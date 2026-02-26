import { NextResponse } from 'next/server'
import { generationQueue } from '@/lib/queue'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const supabase = createAdminClient()

        // Rescue orphaned projects: status='queued' but no matching pending queue_job
        // This happens when the queue_jobs INSERT failed silently on a previous run.
        const { data: queuedProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('status', 'queued')

        let rescued = 0
        if (queuedProjects && queuedProjects.length > 0) {
            const projectIds = queuedProjects.map((p: { id: string }) => p.id)

            // Check which of these already have a pending/processing queue_job
            const { data: existingJobs } = await supabase
                .from('queue_jobs')
                .select('project_id')
                .in('project_id', projectIds)
                .in('status', ['pending', 'processing'])

            const coveredIds = new Set((existingJobs || []).map((j: { project_id: string }) => j.project_id))
            const orphanIds = projectIds.filter((id: string) => !coveredIds.has(id))

            if (orphanIds.length > 0) {
                console.log(`[Queue] Rescuing ${orphanIds.length} orphaned queued projects...`)
                // Insert missing queue_jobs for each orphan
                const orphanJobs = orphanIds.map((id: string) => ({
                    project_id: id,
                    status: 'pending' as const,
                    attempts: 0,
                }))
                const { error: rescueError } = await supabase.from('queue_jobs').insert(orphanJobs)
                if (rescueError) {
                    console.error('[Queue] Rescue insert failed:', rescueError.message)
                    // Fall back: generate directly for each orphan
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
        console.log('[Queue] Manual kickstart triggered. Status:', status, `| Rescued: ${rescued}`)
        generationQueue.process().catch(console.error)

        return NextResponse.json({
            success: true,
            message: `Queue processor started — ${status.pending + rescued} pending, ${status.processing} processing${rescued > 0 ? ` (${rescued} orphans rescued)` : ''}`,
            status,
            rescued,
        })
    } catch (error) {
        console.error('Queue kickstart error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
