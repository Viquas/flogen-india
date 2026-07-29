import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Rep-facing "due today" outreach queue — surfaces leads that need a human touch
 * but would otherwise be forgotten. READ-ONLY: this suggests who to contact; the
 * rep still clicks through and sends manually (no autonomous sending), and the
 * send path re-checks suppression, so an unsubscribed lead can't actually be mailed.
 *
 * Two categories the existing call-scheduled follow-up queue (sales_next_followup_at)
 * doesn't cover:
 *   1. Email sequence follow-ups — emailed ≥3 days ago, no reply, fewer than 3 sends.
 *   2. Claim abandoners — opened the claim/checkout but never paid, still in-window.
 */

// Matches the send-time sequence rails in outreach-actions.ts.
export const FOLLOWUP_MIN_GAP_DAYS = 3
export const FOLLOWUP_MAX_SENDS = 3
/** Stop nagging after this long since the last send. */
export const FOLLOWUP_STALE_DAYS = 14
const DAY_MS = 86_400_000

export interface ProjectEmailAgg {
    projectId: string
    outCount: number
    lastOutMs: number | null
    hasInbound: boolean
}

/**
 * Pure predicate: is this project due for an email follow-up right now?
 * Due when it's been emailed at least once but fewer than 3 times, the last send
 * was 3–14 days ago, there's been no inbound reply, and it hasn't converted.
 */
export function isEmailFollowupDue(agg: ProjectEmailAgg, nowMs: number, paid: Set<string>): boolean {
    if (paid.has(agg.projectId)) return false
    if (agg.hasInbound) return false
    if (agg.outCount < 1 || agg.outCount >= FOLLOWUP_MAX_SENDS) return false
    if (agg.lastOutMs == null) return false
    const days = (nowMs - agg.lastOutMs) / DAY_MS
    return days >= FOLLOWUP_MIN_GAP_DAYS && days <= FOLLOWUP_STALE_DAYS
}

export interface AbandonerClaim {
    projectId: string
    clientEmail: string | null
    expiresAtMs: number | null
}

/**
 * Pure predicate: should this open (unpaid) claim show in the warm-leads queue?
 * Manual-payment interest leads (pending claim WITH contact details) stay until
 * worked; time-boxed checkout abandoners drop off once their window lapses.
 */
export function isAbandonerActive(c: AbandonerClaim, nowMs: number, paid: Set<string>): boolean {
    if (paid.has(c.projectId)) return false
    if (c.clientEmail) return true
    return c.expiresAtMs == null || c.expiresAtMs > nowMs
}

export interface FollowupItem {
    projectId: string
    slug: string | null
    businessName: string
    reason: 'email_followup_due' | 'claim_abandoned'
    detail: string
    sortAt: string | null
}

function extractBusinessName(data: unknown): string {
    const d = (data ?? {}) as Record<string, any>
    return d.businessName || d.brandIdentity?.core?.brandName || d.business_name || 'Unknown business'
}

export interface FollowupQueue {
    emailFollowups: FollowupItem[]
    claimAbandoners: FollowupItem[]
}

export async function getFollowupQueue(): Promise<FollowupQueue> {
    const admin = createAdminClient() as any
    const nowMs = Date.now()

    // Projects that have already converted — never surface these.
    const { data: paidClaims } = await admin
        .from('claims')
        .select('project_id')
        .not('paid_at', 'is', null)
    const paid = new Set<string>((paidClaims || []).map((c: { project_id: string }) => c.project_id))

    // --- Email sequence follow-ups -----------------------------------------
    // Fetch a wide window so the "< 3 sends" count is reliable even if earlier
    // sends are older than the due cutoff.
    const countSince = new Date(nowMs - 60 * DAY_MS).toISOString()
    const { data: msgs } = await admin
        .from('outreach_messages')
        .select('project_id, direction, created_at')
        .eq('channel', 'email')
        .gte('created_at', countSince)

    const byProject = new Map<string, ProjectEmailAgg>()
    for (const m of msgs || []) {
        const pid = m.project_id as string
        if (!pid) continue
        const agg = byProject.get(pid) ?? { projectId: pid, outCount: 0, lastOutMs: null, hasInbound: false }
        if (m.direction === 'in') {
            agg.hasInbound = true
        } else {
            agg.outCount += 1
            const t = new Date(m.created_at as string).getTime()
            if (agg.lastOutMs == null || t > agg.lastOutMs) agg.lastOutMs = t
        }
        byProject.set(pid, agg)
    }
    const dueEmailAggs = [...byProject.values()].filter((a) => isEmailFollowupDue(a, nowMs, paid))

    // --- Claim abandoners --------------------------------------------------
    const { data: openClaims } = await admin
        .from('claims')
        .select('project_id, status, created_at, expires_at, client_email')
        .in('status', ['pending', 'order_created'])
        .is('paid_at', null)
    const abandoners = (openClaims || []).filter((c: Record<string, unknown>) =>
        isAbandonerActive(
            {
                projectId: c.project_id as string,
                clientEmail: (c.client_email as string | null) ?? null,
                expiresAtMs: c.expires_at ? new Date(c.expires_at as string).getTime() : null,
            },
            nowMs,
            paid,
        ),
    )

    // --- Resolve business names + slugs for everything ---------------------
    const allIds = [...new Set([...dueEmailAggs.map((a) => a.projectId), ...abandoners.map((c: any) => c.project_id)])]
    const nameSlug = new Map<string, { name: string; slug: string | null }>()
    if (allIds.length > 0) {
        const { data: projs } = await admin
            .from('projects')
            .select('id, slug, business_data')
            .in('id', allIds)
        for (const p of projs || []) {
            nameSlug.set(p.id as string, {
                name: extractBusinessName(p.business_data),
                slug: (p.slug as string | null) ?? null,
            })
        }
    }

    const emailFollowups: FollowupItem[] = dueEmailAggs
        .map((a) => {
            const ns = nameSlug.get(a.projectId)
            const remaining = FOLLOWUP_MAX_SENDS - a.outCount
            return {
                projectId: a.projectId,
                slug: ns?.slug ?? null,
                businessName: ns?.name ?? 'Unknown business',
                reason: 'email_followup_due' as const,
                detail: `${a.outCount} email${a.outCount > 1 ? 's' : ''} sent · ${remaining} follow-up${remaining > 1 ? 's' : ''} left`,
                sortAt: a.lastOutMs ? new Date(a.lastOutMs).toISOString() : null,
            }
        })
        .sort((x, y) => (x.sortAt || '').localeCompare(y.sortAt || ''))

    const claimAbandoners: FollowupItem[] = abandoners
        .map((c: Record<string, unknown>) => {
            const pid = c.project_id as string
            const ns = nameSlug.get(pid)
            return {
                projectId: pid,
                slug: ns?.slug ?? null,
                businessName: ns?.name ?? 'Unknown business',
                reason: 'claim_abandoned' as const,
                // With manual payment the prospect submits contact details instead of
                // checking out, so a pending claim WITH an email is a hand-raise, not
                // an abandonment — label them differently so reps read the queue right.
                detail:
                    c.status === 'order_created'
                        ? 'Opened checkout — didn’t pay'
                        : c.client_email
                          ? 'Requested contact — awaiting payment'
                          : 'Started a claim — didn’t finish',
                sortAt: (c.created_at as string | null) ?? null,
            }
        })
        .sort((x: FollowupItem, y: FollowupItem) => (y.sortAt || '').localeCompare(x.sortAt || ''))

    return { emailFollowups, claimAbandoners }
}
