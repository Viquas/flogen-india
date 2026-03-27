"use server"

import { createAdminClient } from '@/lib/supabase/admin'
// Admin auth guard removed — single-operator dashboard, no login flow
import { runAutopilotPipeline } from '@/lib/autopilot'
import type { BatchRunConfig } from '@/lib/autopilot-types'

/**
 * Start a new autopilot pipeline run.
 * Creates a batch_run row and kicks off the pipeline as fire-and-forget.
 * Returns immediately with the runId for progress polling.
 */
export async function runAutopilot(config: BatchRunConfig) {
    const supabase = createAdminClient()

    const { data: run, error } = await supabase
        .from('batch_runs')
        .insert({
            config: config as any,
            current_stage: 'pending',
            progress: {
                total_projects: 0,
                generated: 0,
                fixed: 0,
                failed: 0,
                avg_quality_score: null,
            } as any,
        })
        .select()
        .single()

    if (error || !run) {
        console.error('[Autopilot] Failed to create batch_run:', error)
        return { success: false, error: error?.message ?? 'Failed to create run' }
    }

    // Fire-and-forget: pipeline runs in background
    // On failure, markFailed is called internally by the pipeline
    runAutopilotPipeline(run.id).catch(async (err) => {
        console.error('[Autopilot] Pipeline crashed:', err)
        const supabase = createAdminClient()
        await supabase
            .from('batch_runs')
            .update({
                current_stage: 'failed',
                error_message: err instanceof Error ? err.message : String(err),
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', run.id)
    })

    return { success: true, runId: run.id }
}

/**
 * Resume an interrupted autopilot pipeline run.
 * Reads the batch_run's current_stage and re-enters the pipeline loop.
 */
export async function resumeAutopilot(runId: string) {
    const supabase = createAdminClient()

    const { data: run, error } = await supabase
        .from('batch_runs')
        .select('current_stage')
        .eq('id', runId)
        .single()

    if (error || !run) {
        return { success: false, error: 'Run not found' }
    }

    if (run.current_stage === 'completed' || run.current_stage === 'failed') {
        return { success: false, error: 'Run already finished' }
    }

    // Fire-and-forget with crash safety
    runAutopilotPipeline(runId).catch(async (err) => {
        console.error('[Autopilot] Resume crashed:', err)
        const supabase = createAdminClient()
        await supabase
            .from('batch_runs')
            .update({
                current_stage: 'failed',
                error_message: err instanceof Error ? err.message : String(err),
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', runId)
    })

    return { success: true, runId }
}

/**
 * Get real-time progress for an autopilot run.
 * Aggregates project/queue_job statuses for the batch.
 */
export async function getAutopilotProgress(runId: string) {
    const supabase = createAdminClient()

    const { data: run } = await supabase
        .from('batch_runs')
        .select('current_stage, batch_id, config, progress, error_message, started_at, completed_at')
        .eq('id', runId)
        .single()

    if (!run) {
        return { stage: 'unknown' as const, progress: null, isComplete: false }
    }

    if (!run.batch_id) {
        return {
            stage: run.current_stage,
            progress: null,
            config: run.config,
            errorMessage: run.error_message,
            startedAt: run.started_at,
            completedAt: run.completed_at,
            isComplete: run.current_stage === 'completed' || run.current_stage === 'failed',
        }
    }

    // Aggregate project statuses for this batch
    const { data: projects } = await supabase
        .from('projects')
        .select('status, quality_score, error_type')
        .eq('batch_id', run.batch_id)

    const counts = {
        total: projects?.length ?? 0,
        generated: projects?.filter(p => p.status === 'review' || p.status === 'approved').length ?? 0,
        error: projects?.filter(p => p.status === 'error').length ?? 0,
        generating: projects?.filter(p => p.status === 'generating' || p.status === 'queued').length ?? 0,
        avgQuality: null as number | null,
    }

    const scored = projects?.filter(p => p.quality_score != null) ?? []
    if (scored.length > 0) {
        counts.avgQuality = Math.round(
            scored.reduce((s, p) => s + (p.quality_score ?? 0), 0) / scored.length
        )
    }

    const isComplete = run.current_stage === 'completed' || run.current_stage === 'failed'

    return {
        stage: run.current_stage,
        progress: counts,
        config: run.config,
        errorMessage: run.error_message,
        startedAt: run.started_at,
        completedAt: run.completed_at,
        isComplete,
    }
}

/**
 * Get all active (in-progress) autopilot runs.
 * Used by the UI to show a warning if a run is already active.
 */
export async function getActiveAutopilotRuns() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('batch_runs')
        .select('id, current_stage, started_at, config')
        .not('current_stage', 'in', '("completed","failed")')
        .order('started_at', { ascending: false })

    if (error) {
        console.error('[Autopilot] Failed to fetch active runs:', error)
        return []
    }

    return (data ?? []).map(run => ({
        id: run.id,
        currentStage: run.current_stage,
        startedAt: run.started_at,
        config: run.config,
    }))
}
