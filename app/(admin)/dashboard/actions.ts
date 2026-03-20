"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { generateAndSaveWebsite, reviseWebsite, updateProjectWithCode, cleanTemplateCode } from '@/lib/ai/generator'
import { enrichBusinessData } from '@/lib/ai/enricher'
import { generationQueue } from '@/lib/queue'

/**
 * Reset projects stuck in 'generating' status for longer than `minutesThreshold`.
 * Moves them to 'error' so they can be retried via Fix All Errors or manual regeneration.
 */
export async function resetStuckProjects(minutesThreshold = 10) {
    const supabase = createAdminClient()
    const cutoff = new Date(Date.now() - minutesThreshold * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from('projects')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('status', 'generating')
        .lt('updated_at', cutoff)
        .select('id')

    if (error) {
        console.error('Failed to reset stuck projects:', error)
        return { success: false, error: error.message, count: 0 }
    }

    const count = data?.length || 0
    console.log(`[ResetStuck] Reset ${count} projects stuck in generating for >${minutesThreshold}min`)
    revalidatePath('/dashboard')
    return { success: true, count }
}

export async function regenerateProject(projectId: string) {
    const supabase = createAdminClient()

    // Clear any previous pending/processing queue_jobs so add() doesn't dedup
    await supabase
        .from('queue_jobs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .in('status', ['pending', 'processing'])

    // Reset project state (queue.add() will set it to 'queued')
    await supabase
        .from('projects')
        .update({
            generated_code: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    // Route through queue — handles concurrency, status transitions, error handling
    await generationQueue.add(projectId)

    revalidatePath('/dashboard')
    return { success: true }
}

export async function fixWebsiteErrors(projectId: string, rules?: string) {
    const supabase = createAdminClient()

    const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (fetchError || !project) {
        return { success: false, error: "Project not found" }
    }

    // If no code exists at all, do a full regeneration instead of trying to "fix" nothing
    if (!project.generated_code) {
        console.log(`[AutoFix] No code for ${projectId}, running full regeneration...`)
        return regenerateProject(projectId)
    }

    await supabase
        .from('projects')
        .update({ status: 'generating' })
        .eq('id', projectId)

    try {
        let currentData = project.business_data

        if (!(currentData as any).$$manifest) {
            console.log(`[AutoFix] Enriching data for project ${projectId}...`);
            try {
                const enriched = await enrichBusinessData(currentData);
                await supabase
                    .from('projects')
                    .update({ business_data: enriched as any })
                    .eq('id', projectId);
                currentData = enriched as any;
            } catch (enrichError) {
                console.error("[AutoFix] Enrichment failed", enrichError);
            }
        }

        const fixPrompt = `Fix ALL runtime errors, syntax errors, React hook violations, and build issues in this code.

STRICT RULES:
1. All React hooks (useState, useEffect, useRef, useMemo, useCallback) MUST be at the TOP LEVEL of the component — NEVER inside loops, conditions, callbacks, or nested functions.
2. All JSX must be valid — no unmatched tags, no unescaped special characters.
3. Ensure 'export default function GeneratedPage()' exists as the main component.
4. Fix any undefined variable references.
5. Preserve ALL design, colors, layout, content, and interactivity.
6. Ensure good contrast and accessibility.`

        const { code, updatedJson } = await reviseWebsite(
            fixPrompt,
            project.generated_code,
            currentData,
            rules,
            'gemini-3-flash-preview'
        )

        await updateProjectWithCode(projectId, code)

        if (updatedJson) {
            await supabase.from('projects').update({ business_data: updatedJson }).eq('id', projectId)
        }

        // generation_phase column removed
        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error("[AutoFix] Fix failed for", projectId, e)
        await supabase
            .from('projects')
            .update({ status: 'error' })
            .eq('id', projectId)
        return { success: false, error: String(e) }
    }
}

/**
 * Autonomous Debugging Agent — fixes ALL error/broken projects in batch.
 * Uses o3-mini for cost-effective reasoning-based debugging.
 * Targets both 'error' status (generation failures) AND 'review' status with broken code.
 * Runs concurrently with a configurable concurrency limit.
 */
export async function autoFixAllErrors(dateString?: string) {
    const supabase = createAdminClient()

    // Query projects that need fixing: 'error' status, or 'review' with no generated code
    let query = supabase
        .from('projects')
        .select('id, status, generated_code')
        .in('status', ['error', 'review'])
        .order('created_at', { ascending: false })

    if (dateString) {
        const { startOfDay, endOfDay, parseISO } = await import('date-fns')
        const dayStart = startOfDay(parseISO(dateString)).toISOString()
        const dayEnd = endOfDay(parseISO(dateString)).toISOString()
        query = query.gte('created_at', dayStart).lte('created_at', dayEnd)
    }

    const { data: candidates, error } = await query

    if (error || !candidates) {
        console.error('[AutoFix Agent] Failed to fetch projects:', error)
        return { success: false, error: error?.message || 'No projects found', fixed: 0, failed: 0 }
    }

    // Filter: all 'error' projects + 'review' projects with no code (these definitely need fixing)
    // For 'review' projects WITH code, the inline auto-fix in generateAndSaveWebsite already ran,
    // so we only batch-fix those that are explicitly 'error' or have no code.
    const projectsToFix = candidates.filter(
        p => p.status === 'error' || !p.generated_code
    )

    const total = projectsToFix.length
    console.log(`[AutoFix Agent] Starting autonomous fix for ${total} projects (from ${candidates.length} candidates)...`)

    if (total === 0) {
        return { success: true, fixed: 0, failed: 0, total: 0 }
    }

    const CONCURRENCY = 3
    let fixed = 0
    let failed = 0

    for (let i = 0; i < total; i += CONCURRENCY) {
        const batch = projectsToFix.slice(i, i + CONCURRENCY)
        const results = await Promise.allSettled(
            batch.map(p => fixWebsiteErrors(p.id))
        )
        results.forEach(r => {
            if (r.status === 'fulfilled' && r.value.success) fixed++
            else failed++
        })
        console.log(`[AutoFix Agent] Progress: ${i + batch.length}/${total} (fixed: ${fixed}, failed: ${failed})`)
    }

    console.log(`[AutoFix Agent] Complete. Fixed: ${fixed}, Failed: ${failed}, Total: ${total}`)
    revalidatePath('/dashboard')
    return { success: true, fixed, failed, total }
}

export async function getErrorProjectCount(dateString?: string) {
    const supabase = createAdminClient()

    let query = supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')

    if (dateString) {
        const { startOfDay, endOfDay, parseISO } = await import('date-fns')
        const dayStart = startOfDay(parseISO(dateString)).toISOString()
        const dayEnd = endOfDay(parseISO(dateString)).toISOString()
        query = query.gte('created_at', dayStart).lte('created_at', dayEnd)
    }

    const { count, error } = await query
    if (error) return 0
    return count || 0
}

// FR-07: Batch Actions
export async function regenerateProjects(projectIds: string[]) {
    const supabase = createAdminClient()

    // Clear any previous pending/processing queue_jobs so addBatch doesn't dedup
    await supabase
        .from('queue_jobs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .in('project_id', projectIds)
        .in('status', ['pending', 'processing'])

    await supabase
        .from('projects')
        .update({ generated_code: null, updated_at: new Date().toISOString() })
        .in('id', projectIds)

    // Route through queue — handles concurrency, status transitions, error handling
    await generationQueue.addBatch(projectIds)

    revalidatePath('/dashboard')
    return { success: true, count: projectIds.length }
}

export async function deployProjects(projectIds: string[]) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'deployed' as const,
            updated_at: new Date().toISOString(),
        })
        .in('id', projectIds)

    if (error) {
        console.error('Failed to deploy projects:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, count: projectIds.length }
}

export async function approveProject(projectId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'approved' as const,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        console.error('Failed to approve project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function getProjectsByDate(dateString: string) {
    const { startOfDay, endOfDay, parseISO } = await import('date-fns')
    const supabase = createAdminClient()

    const dayStart = startOfDay(parseISO(dateString)).toISOString()
    const dayEnd = endOfDay(parseISO(dateString)).toISOString()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch projects by date:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getProjectById(projectId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (error) {
        console.error('Failed to fetch project by id:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getRecentProjects(limit = 50) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch recent projects:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getProjectRevisions(projectId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('project_revisions')
        .select('id, project_id, version, generated_code, created_at, status')
        .eq('project_id', projectId)
        .order('version', { ascending: false })

    if (error) {
        console.error('Failed to fetch revisions:', error)
        return { success: false as const, error: error.message, data: null }
    }

    return { success: true as const, data: data || [] }
}

export async function restoreProjectRevision(projectId: string, revisionId: string) {
    const supabase = createAdminClient()

    // Fetch the revision
    const { data: revision, error: fetchError } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('id', revisionId)
        .eq('project_id', projectId) // safety check
        .single()

    if (fetchError || !revision) {
        return { success: false, error: 'Revision not found' }
    }

    // Use the existing save function which will automatically snapshot the CURRENT state
    // before we rollback! This ensures we never lose data.
    if (!revision.generated_code) {
        return { success: false, error: 'Revision has no generated code' }
    }

    const { updateProjectWithCode } = await import('@/lib/ai/generator')
    const updateResult = await updateProjectWithCode(projectId, revision.generated_code)

    if (!updateResult.success) {
        return { success: false, error: 'Failed to restore revision' }
    }

    revalidatePath(`/editor?id=${projectId}`)
    return { success: true }
}

// --- TEMPLATE ACTIONS ---

export async function saveTemplate(payload: {
    name: string
    industryTag: string
    rating: number
    generatedCode: string
    businessData?: any
    sourceProjectId?: string
}) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('templates')
        .insert({
            name: payload.name,
            industry_tag: payload.industryTag,
            rating: payload.rating,
            generated_code: payload.generatedCode,
            business_data: payload.businessData || null,
            source_project_id: payload.sourceProjectId || null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Failed to save template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/templates')
    return { success: true, id: data.id }
}

export async function saveCleanedTemplate(payload: {
    name: string
    industryTag: string
    rating: number
    generatedCode: string
    businessData?: any
    sourceProjectId?: string
}) {
    try {
        const cleanedCode = await cleanTemplateCode(payload.generatedCode, payload.industryTag)
        return await saveTemplate({
            ...payload,
            generatedCode: cleanedCode,
        })
    } catch (e) {
        console.error("Failed to clean template code:", e)
        return { success: false, error: String(e) }
    }
}

export async function getTemplates(filters?: {
    industryTag?: string
    minRating?: number
}) {
    const supabase = createAdminClient()

    let query = supabase
        .from('templates')
        .select('id, name, industry_tag, rating, created_at, generated_code')
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })

    if (filters?.industryTag) {
        query = query.eq('industry_tag', filters.industryTag)
    }
    if (filters?.minRating) {
        query = query.gte('rating', filters.minRating)
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch templates:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getTemplateById(templateId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (error) {
        console.error('Failed to fetch template:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function deleteTemplate(templateId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

    if (error) {
        console.error('Failed to delete template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/templates')
    return { success: true }
}

/**
 * Returns a map of { "YYYY-MM-DD": projectCount } for every day in the
 * given month that has at least one project. Used by the CalendarNav to
 * render activity dots without a full page reload when navigating months.
 */
export async function getMonthActivityCounts(
    year: number,
    month: number // 1-indexed (1 = January)
): Promise<Record<string, number>> {
    const supabase = createAdminClient()

    const { startOfMonth, endOfMonth } = await import('date-fns')
    const monthDate = new Date(year, month - 1, 1)
    const from = startOfMonth(monthDate).toISOString()
    const to = endOfMonth(monthDate).toISOString()

    let data: { created_at: string }[] | null = null
    try {
        const result = await supabase
            .from('projects')
            .select('created_at')
            .gte('created_at', from)
            .lte('created_at', to)
        if (result.error) {
            console.warn('[CalendarActivity] Supabase query failed:', result.error.message)
            return {}
        }
        data = result.data
    } catch (e) {
        // Transient network errors (connection timeout, fetch failed) — return empty gracefully
        console.warn('[CalendarActivity] Network error fetching month counts:', e instanceof Error ? e.message : e)
        return {}
    }

    if (!data) {
        return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data) {
        // Truncate ISO timestamp to just the date portion
        const dateKey = row.created_at.slice(0, 10)
        counts[dateKey] = (counts[dateKey] ?? 0) + 1
    }
    return counts
}

/**
 * Get cost statistics for the current month.
 * Returns total spend and generation count for the current month.
 */
export async function getCostStats(): Promise<{
    monthlySpendUsd: number
    monthlyGenerations: number
}> {
    const supabase = createAdminClient()

    // Get first day of current month
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data, error } = await supabase
        .from('generation_costs')
        .select('estimated_cost_usd')
        .gte('created_at', firstOfMonth)

    if (error || !data) {
        return { monthlySpendUsd: 0, monthlyGenerations: 0 }
    }

    const totalCost = data.reduce((sum, row) => sum + Number(row.estimated_cost_usd), 0)
    return {
        monthlySpendUsd: Math.round(totalCost * 100) / 100,
        monthlyGenerations: data.length,
    }
}

export async function searchProjects(query: string) {
    const supabase = createAdminClient()

    // Sanitize query: strip characters that could break PostgREST filter syntax
    const sanitized = query.replace(/[%_\\(),.'":;]/g, '').trim()
    if (!sanitized) {
        return { success: true, data: [] }
    }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`business_data->>businessName.ilike.%${sanitized}%,business_data->brandIdentity->core->>brandName.ilike.%${sanitized}%,business_data->>description.ilike.%${sanitized}%`)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Failed to search projects:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

/**
 * Cancel all pending/processing queue jobs and stop active autopilot runs.
 * Only counts current-week jobs; silently deletes all older records.
 */
export async function stopAllQueuedProcesses() {
    const supabase = createAdminClient()
    let cancelledJobs = 0
    let stoppedRuns = 0

    // Week boundary (Monday 00:00 UTC)
    const now = new Date()
    const day = now.getUTCDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff))
    const weekStart = monday.toISOString()

    // 1. Count active jobs before nuking (for the UI report)
    const { count: activeCount } = await supabase
        .from('queue_jobs')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'processing'])
    cancelledJobs = activeCount || 0

    // 2. Delete ALL queue_jobs — complete wipe, no lingering records
    await supabase
        .from('queue_jobs')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000')

    // 3. Stop active autopilot runs
    const { data: activeRuns } = await supabase
        .from('batch_runs')
        .select('id')
        .not('current_stage', 'in', '("completed","failed")')

    if (activeRuns && activeRuns.length > 0) {
        await supabase
            .from('batch_runs')
            .update({
                current_stage: 'failed',
                error_message: 'Stopped by user',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .in('id', activeRuns.map(r => r.id))
        stoppedRuns = activeRuns.length
    }

    // 4. Reset queued/generating projects
    await supabase
        .from('projects')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .in('status', ['queued', 'generating'])

    revalidatePath('/dashboard')
    return { success: true, cancelledJobs, stoppedRuns }
}

// ---------------------------------------------------------------------------
// AUTOPILOT ACTIONS (Phase 4)
// ---------------------------------------------------------------------------

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

export async function getBatches() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('batches')
        .select('id, source, created_at, assigned_to')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch batches:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function updateBatchAssignee(batchId: string, assignee: string | null) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('batches')
        .update({ assigned_to: assignee })
        .eq('id', batchId)

    if (error) {
        console.error('[Batches] Failed to update assignee:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Save code changes from Edit Mode (inline text/image edits).
 * Uses updateProjectWithCode which snapshots the previous version as a revision.
 */
export async function saveEditModeChanges(projectId: string, newCode: string) {
    const { updateProjectWithCode } = await import('@/lib/ai/generator')
    const result = await updateProjectWithCode(projectId, newCode)

    if (!result.success) {
        console.error('[EditMode] Failed to save changes:', result.error)
        return { success: false, error: result.error || 'Failed to save' }
    }

    revalidatePath(`/editor?id=${projectId}`)
    return { success: true }
}
