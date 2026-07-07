import type { SupabaseClient } from '@supabase/supabase-js'

/** A worker is considered live if its last heartbeat is within this many ms. */
export const HEARTBEAT_TTL_MS = 90_000

/**
 * Upsert a heartbeat row for the given worker. Keyed on `worker_name`.
 */
export async function writeHeartbeat(
    supabase: SupabaseClient,
    workerName: string = 'claude-local',
    status?: string
): Promise<void> {
    const now = new Date().toISOString()
    await supabase.from('generation_workers').upsert(
        {
            worker_name: workerName,
            last_heartbeat_at: now,
            status: status ?? 'busy',
            updated_at: now,
        },
        { onConflict: 'worker_name' }
    )
}

/**
 * True iff the most recently-heartbeating worker's last_heartbeat_at is
 * within HEARTBEAT_TTL_MS of `nowMs`.
 */
export async function isClaudeLive(supabase: SupabaseClient, nowMs: number): Promise<boolean> {
    const { data, error } = await supabase
        .from('generation_workers')
        .select('last_heartbeat_at')
        .order('last_heartbeat_at', { ascending: false })
        .limit(1)

    if (error || !data || data.length === 0) return false

    const lastHeartbeatAt = (data[0] as { last_heartbeat_at: string }).last_heartbeat_at
    const heartbeatMs = Date.parse(lastHeartbeatAt)
    if (Number.isNaN(heartbeatMs)) return false

    return nowMs - heartbeatMs < HEARTBEAT_TTL_MS
}

/**
 * Atomically claim a pending, unclaimed job for Claude. Returns true iff
 * exactly one row was updated (i.e. the claim succeeded).
 */
export async function claimJobForClaude(supabase: SupabaseClient, jobId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('queue_jobs')
        .update({
            claimed_by: 'claude',
            claimed_at: new Date().toISOString(),
            status: 'processing',
        })
        .eq('id', jobId)
        .eq('status', 'pending')
        .is('claimed_by', null)
        .select('id')

    if (error) return false
    return data?.length === 1
}
