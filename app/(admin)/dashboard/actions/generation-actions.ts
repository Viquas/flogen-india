"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { generationQueue } from '@/lib/queue'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Reset projects stuck in 'generating' status for longer than `minutesThreshold`.
 * Moves them to 'error' so they can be retried via Fix All Errors or manual regeneration.
 */
export async function resetStuckProjects(minutesThreshold = 10) {
    await requireAdmin()
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
    await requireAdmin()
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
    // Priority 1 = manual regeneration from dashboard (higher than batch default of 0)
    await generationQueue.add(projectId, undefined, undefined, 1)

    revalidatePath('/dashboard')
    return { success: true }
}

// FR-07: Batch Actions
export async function regenerateProjects(projectIds: string[]) {
    await requireAdmin()
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

/**
 * Cancel all pending/processing queue jobs and stop active autopilot runs.
 * Only counts current-week jobs; silently deletes all older records.
 */
export async function stopAllQueuedProcesses() {
    await requireAdmin()
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
