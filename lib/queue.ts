// Robust DB-backed generation queue using Supabase queue_jobs table

import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveWebsite } from '@/lib/ai/generator'
import { generateAutomationPlan } from '@/lib/automation-plan/generate'
import { notifyProjectRep } from '@/lib/sales/notifications'
import { logger } from '@/lib/logger'
import { isClaudeLive } from '@/lib/generation/worker-liveness'
import { selectHighValue, type Project } from '@/lib/generation/high-value'
import { shouldCronSkip } from '@/lib/generation/router-scope'

export interface QueueJob {
    id: string
    project_id: string
    rules: string | null
    template_id: string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    attempts: number
    created_at?: string
    updated_at?: string
    model_id?: string | null  // repurposed as priority field (e.g. "1" = high priority)
    claimed_by?: string | null
    claimed_at?: string | null
    job_type?: 'website' | 'automation_plan' | null  // null/absent = website (legacy rows)
}

// Max retry attempts before permanently failing a job
const MAX_ATTEMPTS = 3

// Backoff schedule: 2^attempt * 30 seconds (30s, 60s, 120s)
function getBackoffMs(attempt: number): number {
    return Math.pow(2, attempt) * 30 * 1000
}

// Parse priority from model_id column (used as priority carrier)
function parsePriority(modelId: string | null | undefined): number {
    if (!modelId) return 0
    const parsed = parseInt(modelId, 10)
    return isNaN(parsed) ? 0 : parsed
}

// Returns ISO string for Monday 00:00:00 of the current week (UTC)
function currentWeekStart(): string {
    const now = new Date()
    const day = now.getUTCDay() // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? 6 : day - 1 // days since Monday
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff))
    return monday.toISOString()
}

// Parse and validate QUEUE_MAX_CONCURRENT from environment
function getMaxConcurrent(): number {
    const envVal = process.env.QUEUE_MAX_CONCURRENT
    if (!envVal) return 3
    const parsed = parseInt(envVal, 10)
    if (isNaN(parsed) || parsed < 1 || parsed > 20) {
        logger.queue.warn('Invalid QUEUE_MAX_CONCURRENT, using default 3', { value: envVal })
        return 3
    }
    return parsed
}

class GenerationQueue {
    private processingSince: number | null = null
    private maxConcurrent: number = getMaxConcurrent()

    // Processing is considered stale after 2 minutes without heartbeat
    private readonly STALE_MS = 2 * 60 * 1000

    private get isProcessing(): boolean {
        if (!this.processingSince) return false
        // Auto-expire stale locks
        if (Date.now() - this.processingSince > this.STALE_MS) {
            logger.queue.warn('Processing lock expired (stale), allowing re-entry')
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

    async add(projectId: string, rules?: string, templateId?: string, priority: number = 0) {
        const supabase = createAdminClient()

        // Dedup: skip if this project already has a pending/processing website job
        // (a pending automation-plan job must not block site generation)
        const { count: existing } = await supabase
            .from('queue_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('job_type', 'website')
            .in('status', ['pending', 'processing'])

        if (existing && existing > 0) {
            logger.queue.info('Job already exists, skipping', { projectId })
            return
        }

        // Skip projects that already completed generation
        const { data: proj } = await supabase
            .from('projects')
            .select('status')
            .eq('id', projectId)
            .single()

        if (proj && ['review', 'approved', 'deployed'].includes(proj.status)) {
            logger.queue.info('Project already completed, skipping', { projectId, status: proj.status })
            return
        }

        const payload: Record<string, unknown> = {
            project_id: projectId,
            rules: rules || null,
            status: 'pending',
            attempts: 0,
            model_id: priority > 0 ? String(priority) : null,
        }
        if (templateId) payload.template_id = templateId

        const { error: insertError } = await supabase.from('queue_jobs').insert(payload)
        if (insertError) {
            if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
                logger.queue.info('Job already exists, skipping duplicate', { projectId })
                return
            }
            logger.queue.error('queue_jobs insert failed, falling back to direct generation', { error: insertError.message })
            // Fall back: bypass queue table and generate directly
            await supabase.from('projects').update({ status: 'generating', generated_code: null }).eq('id', projectId)
            generateAndSaveWebsite(projectId, undefined, rules, templateId).catch(async (err) => {
                logger.queue.error('Fallback generation failed', { projectId, error: err instanceof Error ? err.message : String(err) })
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

    /**
     * Enqueue an automation-plan generation job (job_type='automation_plan').
     * Drives projects.plan_status only — never touches projects.status, so the
     * lead keeps its place in the sales workspace while the plan generates.
     */
    async addPlanJob(projectId: string) {
        // Untyped: job_type/plan_status are newer than the generated DB types
        const supabase = createAdminClient() as any

        const { count: existing } = await supabase
            .from('queue_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('job_type', 'automation_plan')
            .in('status', ['pending', 'processing'])

        if (existing && existing > 0) {
            logger.queue.info('Plan job already exists, skipping', { projectId })
            return
        }

        const { error: insertError } = await supabase.from('queue_jobs').insert({
            project_id: projectId,
            rules: null,
            status: 'pending',
            attempts: 0,
            job_type: 'automation_plan',
        })
        if (insertError) {
            logger.queue.error('plan queue_jobs insert failed', { projectId, error: insertError.message })
            throw new Error(insertError.message)
        }

        await supabase.from('projects').update({ plan_status: 'queued' }).eq('id', projectId)
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
                logger.queue.info('Skipping already-completed projects', { count: completedIds.size })
                newProjectIds = newProjectIds.filter(id => !completedIds.has(id))
            }
        }

        if (newProjectIds.length === 0) {
            logger.queue.info('All projects already queued or completed, skipping', { count: projectIds.length })
            this.process()
            return
        }

        if (alreadyQueued.size > 0) {
            logger.queue.info('Skipping already-queued projects, adding new', { skipped: alreadyQueued.size, adding: newProjectIds.length })
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
                logger.queue.warn('Batch insert hit duplicate key, falling back to individual inserts')
                // Fall back to individual inserts to skip just the duplicates
                for (const id of newProjectIds) {
                    await this.add(id, rules, templateId)
                }
                return
            }
            logger.queue.error('queue_jobs batch insert failed, falling back to direct generation', { error: insertError.message })
            // Fall back: mark each project as generating and kick off directly
            await supabase.from('projects').update({ status: 'generating', generated_code: null }).in('id', projectIds)
            for (const id of projectIds) {
                generateAndSaveWebsite(id, undefined, rules, templateId).catch(async (err) => {
                    logger.queue.error('Fallback generation failed', { projectId: id, error: err instanceof Error ? err.message : String(err) })
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

        // Compute once per run — cheap heartbeat check, not per-iteration.
        const claudeLive = await isClaudeLive(supabase, Date.now())

        try {
            while (true) {
                this.heartbeat()

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

                // 2. Fetch pending jobs (batch of 10, sorted by created_at for FIFO)
                //    We fetch a small batch so we can sort by priority in-memory
                //    (model_id column carries priority; no dedicated DB column)
                //    Also filter out jobs in backoff: updated_at > now means "retry later"
                const { data: pendingJobs, error: fetchError } = await supabase
                    .from('queue_jobs')
                    .select('*')
                    .eq('status', 'pending')
                    .lte('updated_at', new Date().toISOString()) // skip jobs still in backoff
                    .order('created_at', { ascending: true })
                    .limit(10)

                if (fetchError) {
                    logger.queue.error('Failed to fetch pending jobs', { error: fetchError.message })
                    break
                }

                if (!pendingJobs || pendingJobs.length === 0) {
                    logger.queue.info('No more pending jobs, loop exiting')
                    break
                }

                // Sort by priority DESC (highest first), then by created_at ASC (FIFO within same priority)
                const sorted = [...pendingJobs].sort((a, b) => {
                    const pA = parsePriority(a.model_id)
                    const pB = parsePriority(b.model_id)
                    if (pB !== pA) return pB - pA // higher priority first
                    return 0 // already sorted by created_at from DB
                }) as unknown as QueueJob[]

                // If Claude is live, work out which of these jobs' projects are in
                // Claude's high-value scope, so the cron can leave them alone.
                let highValueIds = new Set<string>()
                if (claudeLive) {
                    const projectIds = sorted.map((j) => j.project_id)
                    const { data: projects, error: projectsError } = await supabase
                        .from('projects')
                        .select('id,is_high_value,niche_score,business_data')
                        .in('id', projectIds)

                    if (projectsError) {
                        logger.queue.error('Failed to fetch projects for high-value scoping', { error: projectsError.message })
                    } else if (projects) {
                        const highValue = selectHighValue(projects as unknown as Project[])
                        highValueIds = new Set(highValue.map((p) => p.id))
                    }
                }

                const job = sorted.find(
                    (j) => j.job_type === 'automation_plan' || !shouldCronSkip(j as { project_id: string; created_at: string }, {
                        claudeLive,
                        nowMs: Date.now(),
                        highValueProjectIds: highValueIds,
                    })
                ) as QueueJob | undefined

                if (!job) {
                    // Everything remaining pending belongs to a live Claude worker's scope.
                    logger.queue.info('All remaining pending jobs are in Claude scope, cron yielding')
                    break
                }

                // 3. Mark as processing (optimistic lock — only succeeds if still 'pending')
                const { data: updatedJob, error: updateError } = await supabase
                    .from('queue_jobs')
                    .update({
                        status: 'processing',
                        attempts: (job.attempts || 0) + 1,
                        updated_at: new Date().toISOString(),
                        started_at: new Date().toISOString(),
                        claimed_by: 'cron',
                        claimed_at: new Date().toISOString(),
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
                this.executeJob(updatedJob as unknown as QueueJob).catch((err) => logger.queue.error('executeJob unhandled error', { error: err instanceof Error ? err.message : String(err) }))
            }
        } finally {
            this.isProcessing = false
        }
    }

    private async executeJob(job: QueueJob) {
        const supabase = createAdminClient()
        try {
            if (!job.project_id) throw new Error("QueueJob missing project_id")

            if (job.job_type === 'automation_plan') {
                // Plan jobs drive projects.plan_status only (inside the generator) —
                // projects.status stays untouched so the lead keeps its CRM state.
                const result = await generateAutomationPlan(job.project_id)
                if (!result.success) {
                    throw new Error(result.error || 'Plan generation failed')
                }
            } else {
                await supabase.from('projects').update({ status: 'generating' }).eq('id', job.project_id)

                // Template auto-routing now lives inside generateAndSaveWebsite, so every
                // caller (cron, local worker, API) gets the cheap content-swap path. We just
                // pass the job's explicit template_id (usually none) and let it route.
                const result = await generateAndSaveWebsite(job.project_id, undefined, job.rules || undefined, job.template_id || undefined)

                if (!result.success) {
                    throw new Error(result.error || 'Generation failed')
                }

                // Close the loop: tell the assigned rep their demo site is ready
                notifyProjectRep(job.project_id, 'deliverable_ready', { deliverable: 'website' })
                    .catch(() => { /* notification failure must not fail the job */ })
            }

            // Mark job as completed
            await supabase.from('queue_jobs').update({
                status: 'completed',
                updated_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            }).eq('id', job.id)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            const currentAttempts = job.attempts || 1

            if (currentAttempts < MAX_ATTEMPTS) {
                // Exponential backoff: set updated_at to future timestamp so process loop skips it
                // Use attempt-1 so schedule is 30s, 60s, 120s (not 60s, 120s, 240s)
                const backoffMs = getBackoffMs(currentAttempts - 1)
                const retryAfter = new Date(Date.now() + backoffMs).toISOString()
                logger.queue.warn('Job failed, scheduling retry with backoff', {
                    jobId: job.id,
                    projectId: job.project_id,
                    attempt: currentAttempts,
                    maxAttempts: MAX_ATTEMPTS,
                    retryAfter,
                    backoffSeconds: backoffMs / 1000,
                    error: errorMessage,
                })

                await supabase.from('queue_jobs').update({
                    status: 'pending',
                    error_message: errorMessage,
                    updated_at: retryAfter, // acts as retry_after — process loop filters .lte('updated_at', now)
                }).eq('id', job.id)

                if (job.project_id) {
                    if (job.job_type === 'automation_plan') {
                        await (supabase.from('projects') as any).update({ plan_status: 'queued' }).eq('id', job.project_id)
                    } else {
                        await supabase.from('projects').update({ status: 'queued' }).eq('id', job.project_id)
                    }
                }
            } else {
                // Permanently failed after MAX_ATTEMPTS
                logger.queue.error('Job permanently failed after max attempts', {
                    jobId: job.id,
                    projectId: job.project_id,
                    attempts: currentAttempts,
                    error: errorMessage,
                })

                await supabase.from('queue_jobs').update({
                    status: 'failed',
                    error_message: errorMessage,
                    updated_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                }).eq('id', job.id)

                if (job.project_id) {
                    if (job.job_type === 'automation_plan') {
                        await (supabase.from('projects') as any).update({ plan_status: 'failed' }).eq('id', job.project_id)
                    } else {
                        await supabase.from('projects').update({ status: 'error' }).eq('id', job.project_id)
                    }
                }
            }
        } finally {
            // Restart the process loop to pick up any pending jobs
            this.process()
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

            // Reset orphaned processing jobs. 15-min threshold (not 2): on Vercel a
            // cold-starting instance runs this while another warm instance may still
            // be legitimately generating (up to maxDuration 800s) — a short window
            // reclaims live jobs and double-processes them. Claude-claimed jobs are
            // excluded: the local worker is a separate process that survives server
            // restarts; the cron safety valve owns reclaiming those.
            const staleThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString()
            const { data: staleJobs } = await supabase
                .from('queue_jobs')
                .update({ status: 'pending', updated_at: new Date().toISOString(), claimed_by: null, claimed_at: null })
                .eq('status', 'processing')
                .lt('started_at', staleThreshold)
                .or('claimed_by.is.null,claimed_by.eq.cron')
                .select('id')

            if (staleJobs && staleJobs.length > 0) {
                logger.queue.info('Startup: reset orphaned processing jobs', { count: staleJobs.length })
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
                logger.queue.info('Startup: cancelled stale batch_runs', { count: staleRuns.length })
            }
        } catch (err) {
            // Startup cleanup is best-effort — don't crash the module
        }
    })()
}
