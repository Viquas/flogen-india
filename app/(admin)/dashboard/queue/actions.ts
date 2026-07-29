'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import type { QueueStats, QueueJobDetail } from './types'

/**
 * Get queue status counts including stuck job detection.
 */
export async function getQueueStats(): Promise<QueueStats> {
  const supabase = createAdminClient()
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  // Get counts by status
  const statuses = ['pending', 'processing', 'completed', 'failed'] as const
  const counts: Record<string, number> = {}

  for (const status of statuses) {
    const { count } = await supabase
      .from('queue_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    counts[status] = count ?? 0
  }

  // Count stuck jobs (processing > 10 minutes)
  const { count: stuckCount } = await supabase
    .from('queue_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing')
    .lt('updated_at', tenMinAgo)

  return {
    pending: counts.pending ?? 0,
    processing: counts.processing ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    stuck: stuckCount ?? 0,
  }
}

/**
 * Get queue jobs with optional status filter, ordered by most recent first.
 * Includes is_stuck flag for processing jobs older than 10 minutes.
 */
export async function getQueueJobs(
  statusFilter?: string,
  limit: number = 50
): Promise<QueueJobDetail[]> {
  const supabase = createAdminClient()
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  let query = supabase
    .from('queue_jobs')
    .select('id, project_id, status, error_message, attempts, created_at, updated_at, started_at, completed_at, model_id, rules')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as 'pending' | 'processing' | 'completed' | 'failed')
  }

  const { data, error } = await query

  if (error) {
    console.error('[QueueAdmin] Failed to fetch jobs:', error.message)
    return []
  }

  return (data ?? []).map(job => ({
    ...job,
    is_stuck: job.status === 'processing' && job.updated_at < tenMinAgo,
  }))
}

/**
 * Retry a failed or stuck job by resetting it to pending.
 */
export async function retryJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('queue_jobs')
    .update({
      status: 'pending',
      error_message: null,
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', ['failed', 'processing']) // Only retry failed or stuck processing jobs

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/queue')
  return { success: true }
}

/**
 * Cancel a failed or stuck job by setting it to failed with a cancellation message.
 */
export async function cancelJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('queue_jobs')
    .update({
      status: 'failed',
      error_message: 'Manually cancelled by operator',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', ['pending', 'processing']) // Only cancel pending or processing jobs

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/queue')
  return { success: true }
}
