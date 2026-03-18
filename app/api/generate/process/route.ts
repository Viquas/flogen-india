import { NextResponse } from 'next/server'
import { generationQueue } from '@/lib/queue'
import { createAdminClient } from '@/lib/supabase/admin'

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
            console.log(`[Queue] Reset ${resetCount} stale processing jobs back to pending`)
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

            const coveredIds = new Set((existingJobs || []).map((j: { project_id: string }) => j.project_id))
            const orphanIds = projectIds.filter((id: string) => !coveredIds.has(id))

            if (orphanIds.length > 0) {
                console.log(`[Queue] Rescuing ${orphanIds.length} orphaned queued projects...`)
                const orphanJobs = orphanIds.map((id: string) => ({
                    project_id: id,
                    status: 'pending' as const,
                    attempts: 0,
                }))
                const { error: rescueError } = await supabase.from('queue_jobs').insert(orphanJobs)
                if (rescueError) {
                    console.error('[Queue] Rescue insert failed:', rescueError.message)
                    const { generateAndSaveWebsite } = await import('@/lib/ai/generator')
                    await supabase.from('projects').update({ status: 'generating' }).in('id', orphanIds)
                    for (const id of orphanIds) {
                        generateAndSaveWebsite(id).catch(console.error)
                    }
                    rescued = orphanIds.length
                } else {
                    rescued = orphanIds.length
                }
            }
        }

        const status = await generationQueue.getStatus()
        const totalRecovered = rescued + resetCount
        console.log('[Queue] Manual kickstart triggered. Status:', status, `| Rescued: ${rescued}, Reset: ${resetCount}`)
        generationQueue.process().catch(console.error)

        return NextResponse.json({
            success: true,
            message: `Queue processor started — ${status.pending + totalRecovered} pending, ${status.processing} processing${resetCount > 0 ? ` (${resetCount} stale jobs reset)` : ''}${rescued > 0 ? ` (${rescued} orphans rescued)` : ''}`,
            status,
            rescued,
            reset: resetCount,
        })
    } catch (error) {
        console.error('Queue kickstart error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
