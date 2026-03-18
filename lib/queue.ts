// Robust DB-backed generation queue using Supabase queue_jobs table

import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveWebsite } from '@/lib/ai/generator'

export interface QueueJob {
    id: string
    project_id: string
    rules: string | null
    template_id: string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    attempts: number
}

// Returns ISO string for Monday 00:00:00 of the current week (UTC)
function currentWeekStart(): string {
    const now = new Date()
    const day = now.getUTCDay() // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? 6 : day - 1 // days since Monday
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff))
    return monday.toISOString()
}

class GenerationQueue {
    private processingSince: number | null = null
    private maxConcurrent = 3

    // Processing is considered stale after 2 minutes without heartbeat
    private readonly STALE_MS = 2 * 60 * 1000

    private get isProcessing(): boolean {
        if (!this.processingSince) return false
        // Auto-expire stale locks
        if (Date.now() - this.processingSince > this.STALE_MS) {
            console.log('[Queue] Processing lock expired (stale), allowing re-entry')
            this.processingSince = null
            return false
        }
        return true
    }

    private set isProcessing(value: boolean) {
        this.processingSince = value ? Date.now() : null
    }

    // Refresh the heartbeat so the stale-check doesn't expire an active loop
    private heartbeat() {
        if (this.processingSince) this.processingSince = Date.now()
    }

    async add(projectId: string, rules?: string, templateId?: string) {
        const supabase = createAdminClient()

        // Dedup: skip if this project already has a pending/processing job
        const { count: existing } = await supabase
            .from('queue_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .in('status', ['pending', 'processing'])

        if (existing && existing > 0) {
            console.log(`[Queue] Job already exists for project ${projectId}, skipping`)
            return
        }

        // Skip projects that already completed generation
        const { data: proj } = await supabase
            .from('projects')
            .select('status')
            .eq('id', projectId)
            .single()

        if (proj && ['review', 'approved', 'deployed'].includes(proj.status)) {
            console.log(`[Queue] Project ${projectId} already in '${proj.status}', skipping`)
            return
        }

        const payload: Record<string, unknown> = {
            project_id: projectId,
            rules: rules || null,
            status: 'pending',
            attempts: 0
        }
        if (templateId) payload.template_id = templateId

        const { error: insertError } = await supabase.from('queue_jobs').insert(payload)
        if (insertError) {
            if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
                console.log(`[Queue] Job already exists for project ${projectId}, skipping duplicate`)
                return
            }
            console.error('[Queue] queue_jobs insert failed, falling back to direct generation:', insertError.message)
            // Fall back: bypass queue table and generate directly
            await supabase.from('projects').update({ status: 'generating', generated_code: null }).eq('id', projectId)
            generateAndSaveWebsite(projectId, undefined, rules, templateId).catch(async (err) => {
                console.error(`[Queue] Fallback generation failed for ${projectId}`, err)
                await supabase.from('projects').update({
                    status: 'error',
                    generation_phase: `Generation failed: ${err instanceof Error ? err.message.substring(0, 200) : 'Unknown error'}`,
                    updated_at: new Date().toISOString(),
                }).eq('id', projectId)
            })
            return
        }

        await supabase.from('projects').update({ status: 'queued', generated_code: null }).eq('id', projectId)
        this.process()
    }

    async addBatch(projectIds: string[], rules?: string, templateId?: string) {
        const supabase = createAdminClient()

        // Dedup: filter out projects that already have a pending/processing job
        const { data: existingJobs } = await supabase
            .from('queue_jobs')
            .select('project_id')
            .in('project_id', projectIds)
            .in('status', ['pending', 'processing'])

        const alreadyQueued = new Set((existingJobs || []).map(j => j.project_id))
        let newProjectIds = projectIds.filter(id => !alreadyQueued.has(id))

        // Also skip projects that already completed generation
        if (newProjectIds.length > 0) {
            const { data: completedProjects } = await supabase
                .from('projects')
                .select('id')
                .in('id', newProjectIds)
                .in('status', ['review', 'approved', 'deployed'])

            const completedIds = new Set((completedProjects || []).map(p => p.id))
            if (completedIds.size > 0) {
                console.log(`[Queue] Skipping ${completedIds.size} already-completed projects`)
                newProjectIds = newProjectIds.filter(id => !completedIds.has(id))
            }
        }

        if (newProjectIds.length === 0) {
            console.log(`[Queue] All ${projectIds.length} projects already queued or completed, skipping`)
            this.process()
            return
        }

        if (alreadyQueued.size > 0) {
            console.log(`[Queue] Skipping ${alreadyQueued.size} already-queued projects, adding ${newProjectIds.length} new`)
        }

        // Build payloads — only include template_id if provided
        const jobs = newProjectIds.map(id => {
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
            if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
                console.log(`[Queue] Batch insert hit duplicate key, falling back to individual inserts`)
                // Fall back to individual inserts to skip just the duplicates
                for (const id of projectIds) {
                    await this.add(id, rules, templateId)
                }
                return
            }
            console.error('[Queue] queue_jobs batch insert failed, falling back to direct generation:', insertError.message)
            // Fall back: mark each project as generating and kick off directly
            await supabase.from('projects').update({ status: 'generating', generated_code: null }).in('id', projectIds)
            for (const id of projectIds) {
                generateAndSaveWebsite(id, undefined, rules, templateId).catch(async (err) => {
                    console.error(`[Queue] Fallback generation failed for ${id}`, err)
                    await supabase.from('projects').update({
                        status: 'error',
                        generation_phase: `Generation failed: ${err instanceof Error ? err.message.substring(0, 200) : 'Unknown error'}`,
                        updated_at: new Date().toISOString(),
                    }).eq('id', id)
                })
            }
            return
        }

        await supabase.from('projects').update({ status: 'queued', generated_code: null }).in('id', projectIds)
        this.process()
    }

    public async forceProcess() {
        this.isProcessing = false
        this.process()
    }

    public async process() {
        if (this.isProcessing) return
        this.isProcessing = true
        const supabase = createAdminClient()

        try {
            while (true) {
                this.heartbeat()

                // 1. Check current processing count
                const { count: processingCount, error: countError } = await supabase
                    .from('queue_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'processing')

                if (countError) {
                    console.error('[Queue] Failed to count processing jobs:', countError.message)
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
                    console.error('[Queue] Failed to fetch pending jobs:', fetchError.message)
                    break
                }

                if (!pendingJobs || pendingJobs.length === 0) {
                    console.log('[Queue] No more pending jobs, loop exiting')
                    break
                }

                const job = pendingJobs[0] as unknown as QueueJob

                // 3. Mark as processing (optimistic lock — only succeeds if still 'pending')
                const { data: updatedJob, error: updateError } = await supabase
                    .from('queue_jobs')
                    .update({
                        status: 'processing',
                        attempts: (job.attempts || 0) + 1,
                        updated_at: new Date().toISOString(),
                        started_at: new Date().toISOString(),
                    })
                    .eq('id', job.id)
                    .eq('status', 'pending')
                    .select()
                    .single()

                if (updateError || !updatedJob) {
                    // Another worker grabbed this job, try next
                    continue
                }

                console.log(`[Queue] Starting job ${job.id} for project ${job.project_id}`)
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

            const result = await generateAndSaveWebsite(job.project_id, undefined, job.rules || undefined, job.template_id || undefined)

            if (!result.success) {
                throw new Error(result.error || 'Generation failed')
            }

            // Mark job as completed
            await supabase.from('queue_jobs').update({
                status: 'completed',
                updated_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            }).eq('id', job.id)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.error(`[Queue] Job ${job.id} failed for project ${job.project_id}:`, errorMessage)

            await supabase.from('queue_jobs').update({
                status: 'failed',
                error_message: errorMessage,
                updated_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            }).eq('id', job.id)

            if (job.project_id) {
                await supabase.from('projects').update({ status: 'error' }).eq('id', job.project_id)
            }
        }
    }

    async getStatus() {
        const supabase = createAdminClient()
        const weekStart = currentWeekStart()

        // Only report current-week jobs
        const { data } = await supabase
            .from('queue_jobs')
            .select('status')
            .gte('created_at', weekStart)

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

// Survive HMR in dev mode — reuse instance but swap prototype to pick up code changes
const globalForQueue = globalThis as unknown as { __generationQueue?: GenerationQueue }
if (!globalForQueue.__generationQueue) {
    globalForQueue.__generationQueue = new GenerationQueue()
} else {
    // HMR: swap prototype so running process() loops pick up new methods immediately
    Object.setPrototypeOf(globalForQueue.__generationQueue, GenerationQueue.prototype)
}
export const generationQueue = globalForQueue.__generationQueue

// Startup cleanup: reset orphaned processing jobs and stale batch_runs
if (typeof process !== 'undefined') {
    (async () => {
        try {
            const supabase = createAdminClient()

            // Reset processing jobs older than 2 min (orphaned from previous server process)
            const staleThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
            const { data: staleJobs } = await supabase
                .from('queue_jobs')
                .update({ status: 'pending', updated_at: new Date().toISOString() })
                .eq('status', 'processing')
                .lt('started_at', staleThreshold)
                .select('id')

            if (staleJobs && staleJobs.length > 0) {
                console.log(`[Queue] Startup: reset ${staleJobs.length} orphaned processing jobs`)
                generationQueue.process()
            }

            // Cancel batch_runs stuck in non-terminal stages for >10 min
            const batchThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString()
            const { data: staleRuns } = await supabase
                .from('batch_runs')
                .update({
                    current_stage: 'failed',
                    error_message: 'Cancelled: stale pipeline (>10 min without progress)',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .not('current_stage', 'in', '("completed","failed")')
                .lt('updated_at', batchThreshold)
                .select('id')

            if (staleRuns && staleRuns.length > 0) {
                console.log(`[Queue] Startup: cancelled ${staleRuns.length} stale batch_runs`)
            }
        } catch (err) {
            // Startup cleanup is best-effort — don't crash the module
        }
    })()
}
