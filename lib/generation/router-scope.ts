// Predicate governing whether the Vercel cron queue processor should leave a
// pending job for a live local Claude worker, or take it itself.

/** How long the cron waits for Claude to claim a high-value job before taking it. */
export const CLAUDE_SCOPE_GRACE_MS = 10 * 60 * 1000

/** How long a claude-claimed job can sit in 'processing' before the safety valve reclaims it. */
export const CLAUDE_STUCK_MS = 15 * 60 * 1000

/**
 * True iff the cron should skip this job (leave it for Claude to claim):
 * Claude is live, the job's project is in Claude's high-value scope, and the
 * job is still young (within the grace period). Otherwise the cron may take it.
 */
export function shouldCronSkip(
    job: { project_id: string; created_at: string },
    opts: { claudeLive: boolean; nowMs: number; highValueProjectIds: Set<string> }
): boolean {
    if (!opts.claudeLive) return false
    if (!opts.highValueProjectIds.has(job.project_id)) return false

    const ageMs = opts.nowMs - Date.parse(job.created_at)
    return ageMs < CLAUDE_SCOPE_GRACE_MS
}
