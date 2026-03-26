import { NextResponse } from 'next/server'
import { generationQueue } from '@/lib/queue'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET() {
    try {
        const supabase = createAdminClient()

        // 1. Reset stale processing jobs (stuck >2 min) back to pending
        const staleThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        const { data: staleJobs } = await supabase
            .from('queue_jobs')
            .select('id, project_id')
            .eq('status', 'processing')
            .lt('started_at', staleThreshold)

        let resetCount = 0
        if (staleJobs && staleJobs.length > 0) {
            await supabase
                .from('queue_jobs')
                .update({ status: 'pending', updated_at: new Date().toISOString() })
                .in('id', staleJobs.map(j => j.id))
            resetCount = staleJobs.length
            logger.queue.info('Reset stale processing jobs back to pending', { count: resetCount })
        }

        // 2. Rescue orphaned projects: status='queued' but no matching pending/processing queue_job
        const { data: queuedProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('status', 'queued')

        let rescued = 0
        if (queuedProjects && queuedProjects.length > 0) {
            const projectIds = queuedProjects.map((p: { id: string }) => p.id)

            const { data: existingJobs } = await supabase
                .from('queue_jobs')
                .select('project_id')
                .in('project_id', projectIds)
                .in('status', ['pending', 'processing'])

            const coveredIds = new Set((existingJobs || []).map((j: { project_id: string | null }) => j.project_id).filter(Boolean))
            const orphanIds = projectIds.filter((id: string) => !coveredIds.has(id))

            if (orphanIds.length > 0) {
                logger.queue.info('Rescuing orphaned queued projects', { count: orphanIds.length })
                const orphanJobs = orphanIds.map((id: string) => ({
                    project_id: id,
                    status: 'pending' as const,
                    attempts: 0,
                }))
                const { error: rescueError } = await supabase.from('queue_jobs').insert(orphanJobs)
                if (rescueError) {
                    logger.queue.error('Rescue insert failed, falling back to direct generation', { error: rescueError.message })
                    const { generateAndSaveWebsite } = await import('@/lib/ai/generator')
                    await supabase.from('projects').update({ status: 'generating' }).in('id', orphanIds)
                    for (const id of orphanIds) {
                        generateAndSaveWebsite(id).catch((err) =>
                            logger.queue.error('Orphan fallback generation failed', { projectId: id, error: err instanceof Error ? err.message : String(err) })
                        )
                    }
                    rescued = orphanIds.length
                } else {
                    rescued = orphanIds.length
                }
            }
        }

        const status = await generationQueue.getStatus()
        const totalRecovered = rescued + resetCount
        logger.queue.info('Manual kickstart triggered', { ...status, rescued, reset: resetCount })
        generationQueue.process().catch((err) =>
            logger.queue.error('Process loop failed after kickstart', { error: err instanceof Error ? err.message : String(err) })
        )

        return NextResponse.json({
            success: true,
            message: `Queue processor started — ${status.pending + totalRecovered} pending, ${status.processing} processing${resetCount > 0 ? ` (${resetCount} stale jobs reset)` : ''}${rescued > 0 ? ` (${rescued} orphans rescued)` : ''}`,
            status,
            rescued,
            reset: resetCount,
        })
    } catch (error) {
        logger.queue.error('Queue kickstart error', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
