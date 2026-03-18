/**
 * Autopilot State Machine
 *
 * DB-backed pipeline orchestrator that sequences:
 *   DISCOVER -> ENQUEUE -> GENERATE -> FIX -> SCORE -> COMPLETE
 *
 * Each stage is idempotent: re-entering after a crash skips already-completed work.
 * State is persisted to the batch_runs table before each stage executes.
 *
 * Usage:
 *   const run = await createBatchRun(config)
 *   await runAutopilotPipeline(run.id)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { discoverBusinesses } from '@/lib/discovery'
import { generationQueue } from '@/lib/queue'
import { fixWebsiteErrors } from '@/app/(admin)/dashboard/actions'
import { logger } from '@/lib/logger'
import type {
  PipelineStage,
  BatchRun,
  BatchRunConfig,
  BatchProgress,
} from '@/lib/autopilot-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function advanceStage(runId: string, nextStage: PipelineStage): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('batch_runs')
    .update({
      current_stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId)
}

async function markFailed(runId: string, errorMessage: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('batch_runs')
    .update({
      current_stage: 'failed' as const,
      error_message: errorMessage.substring(0, 2000),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId)
}

async function updateProgress(runId: string, progress: Partial<BatchProgress>): Promise<void> {
  const supabase = createAdminClient()

  // Read current progress, merge, write back
  const { data: run } = await supabase
    .from('batch_runs')
    .select('progress')
    .eq('id', runId)
    .single()

  const current = (run?.progress as unknown as BatchProgress) ?? {} as BatchProgress
  const merged: BatchProgress = {
    total_projects: progress.total_projects ?? current.total_projects ?? 0,
    generated: progress.generated ?? current.generated ?? 0,
    fixed: progress.fixed ?? current.fixed ?? 0,
    failed: progress.failed ?? current.failed ?? 0,
    avg_quality_score: progress.avg_quality_score !== undefined
      ? progress.avg_quality_score
      : current.avg_quality_score ?? null,
  }

  await supabase
    .from('batch_runs')
    .update({
      progress: merged as any,
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId)
}

function parseBatchRun(row: any): BatchRun {
  return {
    id: row.id,
    batch_id: row.batch_id,
    current_stage: row.current_stage as PipelineStage,
    config: (typeof row.config === 'string' ? JSON.parse(row.config) : row.config) as BatchRunConfig,
    progress: (typeof row.progress === 'string' ? JSON.parse(row.progress) : row.progress) as BatchProgress,
    error_message: row.error_message,
    started_at: row.started_at,
    completed_at: row.completed_at,
    updated_at: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Stage Handlers (all idempotent)
// ---------------------------------------------------------------------------

/**
 * DISCOVER stage: Call Google Places API, create batch + projects.
 * Idempotent: If batch_id already set and projects exist, skip.
 */
async function executeDiscoverStage(run: BatchRun): Promise<void> {
  const supabase = createAdminClient()

  // Idempotency: if batch_id is set and projects exist, skip
  if (run.batch_id) {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', run.batch_id)

    if (count && count > 0) {
      logger.autopilot.info('DISCOVER: batch already has projects, skipping', { batchId: run.batch_id, count })
      await advanceStage(run.id, 'enqueueing')
      return
    }
  }

  // Mark stage as discovering
  await advanceStage(run.id, 'discovering')

  const result = await discoverBusinesses({
    query: run.config.query,
    location: run.config.location,
    industry: run.config.industry,
    entries: run.config.entries,
    skipWithWebsite: true,
  })

  // Persist batch_id and update progress atomically
  await supabase
    .from('batch_runs')
    .update({
      batch_id: result.batchId,
      progress: {
        total_projects: result.count,
        generated: 0,
        fixed: 0,
        failed: 0,
        avg_quality_score: null,
      } as any,
      current_stage: 'enqueueing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', run.id)

  logger.autopilot.info('DISCOVER: found businesses', { count: result.count, batchId: result.batchId })
}

/**
 * ENQUEUE stage: Add projects to generation queue.
 * Idempotent: addBatch handles duplicate key gracefully.
 */
async function executeEnqueueStage(run: BatchRun): Promise<void> {
  const supabase = createAdminClient()

  if (!run.batch_id) {
    throw new Error('Cannot enqueue: no batch_id set (discovery may not have completed)')
  }

  // Get all project IDs for this batch
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('batch_id', run.batch_id)

  if (!projects || projects.length === 0) {
    throw new Error(`No projects found for batch ${run.batch_id}`)
  }

  const projectIds = projects.map(p => p.id)

  // addBatch handles duplicates (23505 error code) gracefully
  await generationQueue.addBatch(projectIds, undefined, run.config.templateId)

  logger.autopilot.info('ENQUEUE: queued projects for generation', { count: projectIds.length })
  await advanceStage(run.id, 'generating')
}

/**
 * GENERATE stage: Wait for all queue jobs to complete.
 * Polls every 5 seconds, resets stuck jobs, enforces timeout.
 */
async function executeGenerateStage(run: BatchRun): Promise<void> {
  const supabase = createAdminClient()

  if (!run.batch_id) throw new Error('Cannot generate: no batch_id set')

  // Calculate timeout: entries * 120s, floor 300s, ceiling 3600s
  const timeoutMs = Math.min(Math.max(run.config.entries * 120, 300), 3600) * 1000
  const startTime = Date.now()
  const POLL_INTERVAL = 5000
  const STUCK_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

  logger.autopilot.info('GENERATE: waiting for queue', { timeoutSeconds: timeoutMs / 1000 })

  while (true) {
    // Check if this run was externally cancelled (e.g. user pressed Stop All)
    const { data: runCheck } = await supabase
      .from('batch_runs')
      .select('current_stage')
      .eq('id', run.id)
      .single()

    if (runCheck?.current_stage === 'failed' || runCheck?.current_stage === 'completed') {
      logger.autopilot.info('GENERATE: run was externally terminated, aborting', { runId: run.id, stage: runCheck.current_stage })
      return
    }

    // Get project IDs for this batch
    const { data: batchProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('batch_id', run.batch_id)

    if (!batchProjects || batchProjects.length === 0) break

    const projectIds = batchProjects.map(p => p.id)

    // Count queue_jobs by status for this batch's projects
    const { data: jobs } = await supabase
      .from('queue_jobs')
      .select('id, status, started_at, project_id')
      .in('project_id', projectIds)

    if (!jobs) break

    const counts = { pending: 0, processing: 0, completed: 0, failed: 0 }
    for (const job of jobs) {
      const key = job.status as keyof typeof counts
      if (counts[key] !== undefined) counts[key]++
    }

    // Update progress
    await updateProgress(run.id, {
      generated: counts.completed,
      failed: counts.failed,
    })

    logger.autopilot.info('GENERATE: progress', { pending: counts.pending, processing: counts.processing, completed: counts.completed, failed: counts.failed })

    // Check if all done
    if (counts.pending === 0 && counts.processing === 0) {
      logger.autopilot.info('GENERATE: all jobs finished')
      break
    }

    // Reset stuck processing jobs (started > 5 min ago)
    const now = Date.now()
    const stuckJobs = jobs.filter(
      j => j.status === 'processing' && j.started_at && (now - new Date(j.started_at).getTime() > STUCK_THRESHOLD_MS)
    )
    if (stuckJobs.length > 0) {
      logger.autopilot.info('GENERATE: resetting stuck jobs', { count: stuckJobs.length })
      await supabase
        .from('queue_jobs')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .in('id', stuckJobs.map(j => j.id))
    }

    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      logger.autopilot.warn('GENERATE: timeout reached, force-failing remaining jobs')

      // Force-fail remaining pending/processing jobs
      const remainingIds = jobs
        .filter(j => j.status === 'pending' || j.status === 'processing')
        .map(j => j.id)

      if (remainingIds.length > 0) {
        await supabase
          .from('queue_jobs')
          .update({
            status: 'failed',
            error_message: 'Autopilot timeout',
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .in('id', remainingIds)

        // Also mark corresponding projects as error
        const remainingProjectIds = jobs
          .filter(j => j.status === 'pending' || j.status === 'processing')
          .map(j => j.project_id)
          .filter(Boolean) as string[]

        if (remainingProjectIds.length > 0) {
          await supabase
            .from('projects')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .in('id', remainingProjectIds)
        }
      }
      break
    }

    // Poll wait
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
  }

  await advanceStage(run.id, 'fixing')
}

/**
 * FIX stage: Auto-fix error projects and low-quality projects.
 * Respects config.autoFixEnabled and config.qualityThreshold.
 */
async function executeFixStage(run: BatchRun): Promise<void> {
  const supabase = createAdminClient()

  if (!run.config.autoFixEnabled) {
    logger.autopilot.info('FIX: auto-fix disabled, skipping')
    await advanceStage(run.id, 'scoring')
    return
  }

  if (!run.batch_id) throw new Error('Cannot fix: no batch_id set')

  // Find projects that need fixing:
  // 1. status = 'error' (generation failed)
  // 2. status = 'review' AND quality_score < threshold (low quality)
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, status, quality_score')
    .eq('batch_id', run.batch_id)

  if (!allProjects) {
    await advanceStage(run.id, 'scoring')
    return
  }

  const projectsToFix = allProjects.filter(p =>
    p.status === 'error' ||
    (p.status === 'review' && p.quality_score !== null && p.quality_score < run.config.qualityThreshold)
  )

  if (projectsToFix.length === 0) {
    logger.autopilot.info('FIX: no projects need fixing')
    await advanceStage(run.id, 'scoring')
    return
  }

  logger.autopilot.info('FIX: fixing projects', { count: projectsToFix.length, qualityThreshold: run.config.qualityThreshold })

  const CONCURRENCY = 3
  let fixedCount = 0

  for (let i = 0; i < projectsToFix.length; i += CONCURRENCY) {
    const batch = projectsToFix.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(p => fixWebsiteErrors(p.id))
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.success) fixedCount++
    }

    // Update progress after each batch
    await updateProgress(run.id, { fixed: fixedCount })

    logger.autopilot.info('FIX: progress', { processed: i + batch.length, total: projectsToFix.length, fixed: fixedCount })
  }

  logger.autopilot.info('FIX: completed', { fixed: fixedCount, total: projectsToFix.length })
  await advanceStage(run.id, 'scoring')
}

/**
 * SCORING stage: Aggregate final results.
 * Quality scoring already runs automatically in the generator pipeline.
 * This stage just computes final counts and avg_quality_score.
 */
async function executeScoringStage(run: BatchRun): Promise<void> {
  const supabase = createAdminClient()

  if (!run.batch_id) throw new Error('Cannot score: no batch_id set')

  const { data: projects } = await supabase
    .from('projects')
    .select('status, quality_score')
    .eq('batch_id', run.batch_id)

  if (!projects) {
    await markFailed(run.id, 'Failed to fetch projects for scoring')
    return
  }

  const totalProjects = projects.length
  const generated = projects.filter(p => p.status === 'review' || p.status === 'approved').length
  const failed = projects.filter(p => p.status === 'error').length
  const scored = projects.filter(p => p.quality_score != null)
  const avgQuality = scored.length > 0
    ? Math.round(scored.reduce((sum, p) => sum + (p.quality_score ?? 0), 0) / scored.length)
    : null

  await updateProgress(run.id, {
    total_projects: totalProjects,
    generated,
    failed,
    avg_quality_score: avgQuality,
  })

  // Mark as completed
  await supabase
    .from('batch_runs')
    .update({
      current_stage: 'completed' as const,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', run.id)

  logger.autopilot.info('SCORING: complete', { generated, failed, avgQuality })
}

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full autopilot pipeline for a given batch_run ID.
 * Reads current_stage from DB and executes handlers in sequence until
 * a terminal state (completed/failed) is reached.
 *
 * This function is idempotent: calling it again with the same runId
 * after a crash will resume from the persisted current_stage.
 */
export async function runAutopilotPipeline(runId: string): Promise<void> {
  const supabase = createAdminClient()

  // Stage handler map -- maps current_stage to the handler that advances it
  const stageHandlers: Record<string, (run: BatchRun) => Promise<void>> = {
    pending: executeDiscoverStage,
    discovering: executeDiscoverStage, // Resume = re-enter same stage
    enqueueing: executeEnqueueStage,
    generating: executeGenerateStage,
    fixing: executeFixStage,
    scoring: executeScoringStage,
  }

  // Load initial state
  const { data: initialRow } = await supabase
    .from('batch_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (!initialRow) {
    throw new Error(`BatchRun ${runId} not found`)
  }

  let currentStage: PipelineStage = initialRow.current_stage as PipelineStage

  while (currentStage !== 'completed' && currentStage !== 'failed') {
    const handler = stageHandlers[currentStage]
    if (!handler) {
      await markFailed(runId, `Unknown stage: ${currentStage}`)
      return
    }

    try {
      // Re-read the run to get the latest state
      const { data: freshRow } = await supabase
        .from('batch_runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (!freshRow) {
        throw new Error('Batch run disappeared during execution')
      }

      // Abort if externally cancelled
      if (freshRow.current_stage === 'failed' || freshRow.current_stage === 'completed') {
        logger.autopilot.info('Pipeline was externally terminated, stopping', { runId, stage: freshRow.current_stage })
        return
      }

      const run = parseBatchRun(freshRow)
      await handler(run)

      // Re-read to get the stage the handler advanced to
      const { data: updated } = await supabase
        .from('batch_runs')
        .select('current_stage')
        .eq('id', runId)
        .single()

      currentStage = (updated?.current_stage ?? 'failed') as PipelineStage
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.autopilot.error('Stage failed', { stage: currentStage, error: message })
      await markFailed(runId, message)
      return
    }
  }

  logger.autopilot.info('Pipeline finished', { runId, finalStage: currentStage })
}
