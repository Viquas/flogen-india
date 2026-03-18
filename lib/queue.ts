// Robust DB-backed generation queue using Supabase queue_jobs table

import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveWebsite } from '@/lib/ai/generator'
import { logger } from '@/lib/logger'

export interface QueueJob {
    id: string
    project_id: string
    rules: string | null
    template_id: string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    attempts: number
}

class GenerationQueue {
    private isProcessing = false
    private maxConcurrent = 3
    private periodicTimer: ReturnType<typeof setInterval> | null = null

    async add(projectId: string, rules?: string, templateId?: string) {
        const supabase = createAdminClient()

        const payload: Record<string, unknown> = {
            project_id: projectId,
            rules: rules || null,
            status: 'pending',
            attempts: 0
        }
        if (templateId) payload.template_id = templateId

        const { error: insertError } = await supabase.from('queue_jobs').insert(payload)
        if (insertError) {
            logger.queue.error('queue_jobs insert failed, falling back to direct generation', { error: insertError.message })
            // Fall back: bypass queue table and generate directly
            await supabase.from('projects').update({ status: 'generating', generated_code: null }).eq('id', projectId)
            generateAndSaveWebsite(projectId, undefined, rules, templateId).catch(console.error)
            return
        }

        await supabase.from('projects').update({ status: 'queued', generated_code: null }).eq('id', projectId)
        this.process()
    }

    async addBatch(projectIds: string[], rules?: string, templateId?: string) {
        const supabase = createAdminClient()

        // Build payloads — only include template_id if provided, avoids schema errors
        // when the column hasn't been migrated yet in the live DB.
        const jobs = projectIds.map(id => {
            const job: Record<string, unknown> = {
                project_id: id,
                rules: rules || null,
                status: 'pending' as const,
                attempts: 0
            }
            if (templateId) job.template_id = templateId
            return job
        })

        const { error: insertError } = await supabase.from('queue_jobs').insert(jobs)

        if (insertError) {
            logger.queue.error('queue_jobs batch insert failed, falling back to direct generation', { error: insertError.message })
            // Fall back: mark each project as generating and kick off directly
            await supabase.from('projects').update({ status: 'generating', generated_code: null }).in('id', projectIds)
            for (const id of projectIds) {
                generateAndSaveWebsite(id, undefined, rules, templateId).catch(console.error)
            }
            return
        }

        await supabase.from('projects').update({ status: 'queued', generated_code: null }).in('id', projectIds)
        this.process()
    }

    // Recover stuck jobs and boot the processor for any pending work
    async recoverStuckJobs() {
        const supabase = createAdminClient()

        // Reset jobs that were left in 'processing' state (e.g. server crashed mid-job)
        const { data: stuckJobs } = await supabase
            .from('queue_jobs')
            .select('*')
            .eq('status', 'processing')

        if (stuckJobs && stuckJobs.length > 0) {
            logger.queue.info('Recovering stuck jobs', { count: stuckJobs.length })
            await supabase
                .from('queue_jobs')
                .update({ status: 'pending' })
                .in('id', stuckJobs.map(j => j.id))
        }

        // Always check for pending jobs and boot the processor if any exist.
        // This handles the case where the server hot-reloads while jobs are
        // still in 'pending' state and no in-flight 'processing' jobs exist.
        const { count: pendingCount } = await supabase
            .from('queue_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')

        const hasStuck = (stuckJobs?.length ?? 0) > 0
        const hasPending = (pendingCount ?? 0) > 0

        if (hasStuck || hasPending) {
            logger.queue.info('Booting processor', { pendingCount: pendingCount ?? 0, recoveredFromStuck: stuckJobs?.length ?? 0 })
            this.process()
        }

        // Start the periodic watchdog so orphaned jobs are always rescued
        this.startPeriodicCheck()
    }

    // Watchdog: every 30 s kick the processor in case new pending jobs appeared
    // without a code path that called process() (e.g. direct DB inserts, edge cases)
    private startPeriodicCheck() {
        if (this.periodicTimer) return // already running
        this.periodicTimer = setInterval(async () => {
            if (this.isProcessing) return
            const supabase = createAdminClient()
            const { count } = await supabase
                .from('queue_jobs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
            if ((count ?? 0) > 0) {
                logger.queue.info('Watchdog: found pending jobs, booting processor', { count })
                this.process()
            }
        }, 30_000)
    }

    public async process() {
        if (this.isProcessing) return
        this.isProcessing = true
        const supabase = createAdminClient()

        try {
            while (true) {
                // 1. Check current processing count
                const { count: processingCount, error: countError } = await supabase
                    .from('queue_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'processing')

                if (countError) {
                    logger.queue.error('Failed to count processing jobs', { error: countError.message })
                    break
                }

                const currentProcessing = processingCount || 0

                if (currentProcessing >= this.maxConcurrent) {
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    continue
                }

                // 2. Fetch one pending job
                const { data: pendingJobs, error: fetchError } = await supabase
                    .from('queue_jobs')
                    .select('*')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true })
                    .limit(1)

                if (fetchError) {
                    logger.queue.error('Failed to fetch pending jobs', { error: fetchError.message })
                    break
                }

                if (!pendingJobs || pendingJobs.length === 0) {
                    break // Queue is empty
                }

                const job = pendingJobs[0] as unknown as QueueJob

                // 3. Mark as processing (optimistic lock — only succeeds if still 'pending')
                const { data: updatedJob, error: updateError } = await supabase
                    .from('queue_jobs')
                    .update({
                        status: 'processing',
                        attempts: (job.attempts || 0) + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', job.id)
                    .eq('status', 'pending')
                    .select()
                    .single()

                if (updateError || !updatedJob) {
                    // Another worker grabbed this job, try next
                    continue
                }

                logger.queue.info('Starting job', { jobId: job.id, projectId: job.project_id })
                // Process job asynchronously so the loop can immediately pick up the next one
                this.executeJob(updatedJob as unknown as QueueJob).catch(console.error)
            }
        } finally {
            this.isProcessing = false
        }
    }

    private async executeJob(job: QueueJob) {
        const supabase = createAdminClient()
        try {
            if (!job.project_id) throw new Error("QueueJob missing project_id")

            await supabase.from('projects').update({ status: 'generating' }).eq('id', job.project_id)

            await generateAndSaveWebsite(job.project_id, undefined, job.rules || undefined, job.template_id || undefined)

            // Mark job as completed
            await supabase.from('queue_jobs').update({
                status: 'completed',
                updated_at: new Date().toISOString()
            }).eq('id', job.id)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.queue.error('Job failed', { jobId: job.id, projectId: job.project_id, error: errorMessage })

            await supabase.from('queue_jobs').update({
                status: 'failed',
                error_message: errorMessage,
                updated_at: new Date().toISOString()
            }).eq('id', job.id)

            if (job.project_id) {
                await supabase.from('projects').update({ status: 'error' }).eq('id', job.project_id)
            }
        }
    }

    async getStatus() {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('queue_jobs')
            .select('status')

        const counts = { pending: 0, processing: 0, completed: 0, failed: 0 }
        if (data) {
            data.forEach((job: { status: string }) => {
                const statusKey = job.status as keyof typeof counts
                if (counts[statusKey] !== undefined) {
                    counts[statusKey]++
                }
            })
        }
        return counts
    }
}

export const generationQueue = new GenerationQueue()

// Trigger recovery on module load
if (typeof process !== 'undefined') {
    generationQueue.recoverStuckJobs().catch(console.error)
}
