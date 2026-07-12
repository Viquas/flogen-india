import { getVickyosPool } from './db'

/**
 * VickyOS pipeline read model.
 *
 * Source of truth is the cloud CRM (Supabase: projects + call_logs +
 * outreach_messages + interests + claims). The local SQLite scrape cache and
 * the raw lead_lists staging table are deliberately out of scope — the reader
 * role cannot even SELECT lead_lists.
 *
 * Stage mapping (documented in README-vickyos-api.md):
 *   won        — a claim with paid_at set (ground truth for closed-won)
 *   lost       — sales_status in (not_interested, do_not_call)
 *   proposal   — claim started (checkout opened), interest form submitted,
 *                or salesperson marked closed but payment not yet verified
 *   qualified  — inbound reply received, or a call log with a conversation
 *                outcome (anything but no_answer/wrong_number), or
 *                sales_status in (in_conversation, interested)
 *   contacted  — outbound outreach sent or any call attempted
 *   lead       — scraped + audited/promoted, no outreach yet
 *
 * Excluded rows: projects.status = 'error' (dead) and rows with no usable
 * business contact (raw unactionable scrape rows).
 *
 * Privacy: no salesperson identities, no email bodies, no call notes text,
 * no generated-site slugs/URLs. Business contact handle + aggregates only.
 */

export type Stage = 'lead' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

export interface PipelineRow {
    client: string
    contact: string | null
    stage: Stage
    value_inr: number
    stream: 'domestic' | 'international'
    last_touch: string | null
    next_action: string | null
    next_action_date: string | null
    notes: string
}

// ---- business_data extraction (same paths as lib/sales/get-leads.ts) ----

type Json = Record<string, unknown> | null

function bd<T = unknown>(obj: Json, path: string[]): T | null {
    let cur: unknown = obj
    for (const key of path) {
        if (cur && typeof cur === 'object' && key in (cur as Record<string, unknown>)) {
            cur = (cur as Record<string, unknown>)[key]
        } else {
            return null
        }
    }
    return (cur ?? null) as T | null
}

function extractBusinessName(data: Json): string {
    return (
        bd<string>(data, ['businessName']) ||
        bd<string>(data, ['brandIdentity', 'core', 'brandName']) ||
        bd<string>(data, ['business_name']) ||
        'Unknown business'
    )
}

function extractPhone(data: Json): string | null {
    const p =
        bd<string>(data, ['operationalData', 'contact', 'phone']) ||
        bd<string>(data, ['internationalPhoneNumber']) ||
        bd<string>(data, ['contactInfo', 'phone']) ||
        bd<string>(data, ['nationalPhoneNumber'])
    return typeof p === 'string' && p ? p : null
}

/** Email is stored as a plain string or as { display, link }. */
function coerceEmail(value: unknown): string | null {
    if (typeof value === 'string' && value.includes('@')) return value
    if (value && typeof value === 'object') {
        const display = (value as Record<string, unknown>).display
        if (typeof display === 'string' && display.includes('@')) return display
    }
    return null
}

function extractEmail(data: Json): string | null {
    return (
        coerceEmail(bd(data, ['operationalData', 'contact', 'email'])) ||
        coerceEmail(bd(data, ['contactInfo', 'email'])) ||
        coerceEmail(bd(data, ['email']))
    )
}

function extractAddressText(data: Json): string {
    const candidates = [
        bd(data, ['operationalData', 'contact', 'address']),
        bd(data, ['contactInfo', 'address']),
        bd(data, ['address']),
    ]
    for (const c of candidates) {
        if (typeof c === 'string' && c) return c
        if (c && typeof c === 'object') return JSON.stringify(c)
    }
    return ''
}

/** Calling CRM — phone is the primary handle, email the fallback. */
function extractContact(data: Json): string | null {
    return extractPhone(data) || extractEmail(data)
}

/**
 * domestic = Indian market (the Flogen pivot); everything else (e.g. the
 * Aussie discovery pool) is international. Heuristic: +91 phone or an
 * India-marked address/discovery location.
 */
function deriveStream(data: Json, discoveryLocation: string | null): 'domestic' | 'international' {
    const phone = (extractPhone(data) || '').replace(/[\s-]/g, '')
    if (phone.startsWith('+91') || phone.startsWith('0091')) return 'domestic'
    if (phone.startsWith('+')) return 'international'
    const geo = `${extractAddressText(data)} ${discoveryLocation ?? ''}`.toLowerCase()
    if (/\bindia\b/.test(geo)) return 'domestic'
    if (/\b(australia|nsw|qld|vic\b|\.com\.au)/.test(geo)) return 'international'
    // Unmarked local numbers default to the domestic stream.
    return 'domestic'
}

// ---- stage mapping ----

interface DbRow {
    id: string
    business_data: Record<string, unknown> | null
    status: string
    sales_status: string | null
    quality_score: number | null
    niche_score: number | null
    pool: string | null
    discovery_location: string | null
    sales_call_count: number
    sales_next_followup_at: string | null
    sales_last_contact_at: string | null
    created_at: string
    last_out: string | null
    last_in: string | null
    out_count: string | number
    replied: boolean
    engaged: boolean
    last_call_at: string | null
    meaningful_calls: string | number
    interest_count: string | number
    claim_count: string | number
    paid_count: string | number
    latest_amount_paise: number | null
    paid_amount_paise: number | null
}

function n(v: string | number | null | undefined): number {
    return typeof v === 'string' ? parseInt(v, 10) || 0 : v ?? 0
}

export function mapStage(row: DbRow): Stage {
    const sales = row.sales_status ?? 'new'
    if (n(row.paid_count) > 0) return 'won'
    if (sales === 'not_interested' || sales === 'do_not_call') return 'lost'
    if (n(row.claim_count) > 0 || n(row.interest_count) > 0 || sales === 'closed') return 'proposal'
    if (row.replied || n(row.meaningful_calls) > 0 || sales === 'in_conversation' || sales === 'interested') {
        return 'qualified'
    }
    if (n(row.out_count) > 0 || n(row.sales_call_count) > 0 || sales === 'attempted') return 'contacted'
    return 'lead'
}

function toDate(iso: string | null): string | null {
    if (!iso) return null
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function lastTouch(row: DbRow): string | null {
    const stamps = [row.last_out, row.last_in, row.last_call_at, row.sales_last_contact_at]
        .filter((s): s is string => !!s)
        .map((s) => new Date(s).getTime())
        .filter((t) => !isNaN(t))
    if (stamps.length === 0) return null
    return new Date(Math.max(...stamps)).toISOString().slice(0, 10)
}

const NEXT_ACTION_BY_STAGE: Record<Stage, string | null> = {
    lead: 'send first outreach',
    contacted: 'follow up — no reply yet',
    qualified: 'call to advance the deal',
    proposal: 'follow up on payment / close',
    won: 'deliver and onboard',
    lost: null,
}

function nextAction(row: DbRow, stage: Stage): { action: string | null; date: string | null } {
    if (row.sales_next_followup_at && stage !== 'won' && stage !== 'lost') {
        return { action: 'follow-up call (scheduled)', date: toDate(row.sales_next_followup_at) }
    }
    return { action: NEXT_ACTION_BY_STAGE[stage], date: null }
}

/** One structured line — never free text from call notes or email bodies. */
function composeNotes(row: DbRow, stage: Stage): string {
    const parts: string[] = []
    if (row.pool === 'automation' && row.niche_score != null) parts.push(`niche score ${row.niche_score}`)
    if (row.quality_score != null) parts.push(`audit score ${row.quality_score}`)
    if (row.status === 'deployed') parts.push('site delivered')
    else if (row.status === 'review' || row.status === 'approved') parts.push('demo ready')
    else if (row.status === 'queued' || row.status === 'generating') parts.push('demo generating')
    const sent = n(row.out_count)
    if (sent > 0) parts.push(`${sent} outreach sent`)
    if (row.replied) parts.push('reply received')
    else if (row.engaged) parts.push('email opened')
    const calls = n(row.sales_call_count)
    if (calls > 0) parts.push(`${calls} call${calls === 1 ? '' : 's'}`)
    if (n(row.interest_count) > 0) parts.push('interest form submitted')
    if (stage === 'won') parts.push('paid')
    return parts.slice(0, 4).join(', ') || 'no activity yet'
}

function valueInr(row: DbRow): number {
    const paise = n(row.paid_count) > 0 ? row.paid_amount_paise : row.latest_amount_paise
    return paise != null ? Math.round(paise / 100) : 0
}

// ---- queries ----

const PIPELINE_SQL = `
SELECT
    p.id, p.business_data, p.status, p.sales_status, p.quality_score,
    p.niche_score, p.pool, p.discovery_location, p.sales_call_count,
    p.sales_next_followup_at, p.sales_last_contact_at, p.created_at,
    ob.last_out, ob.last_in, ob.out_count, ob.replied, ob.engaged,
    calls.last_call_at, calls.meaningful_calls,
    intr.interest_count,
    cl.claim_count, cl.paid_count, cl.latest_amount_paise, cl.paid_amount_paise
FROM projects p
LEFT JOIN LATERAL (
    SELECT
        max(created_at) FILTER (WHERE direction = 'out') AS last_out,
        max(created_at) FILTER (WHERE direction = 'in')  AS last_in,
        count(*)        FILTER (WHERE direction = 'out') AS out_count,
        count(*)        FILTER (WHERE direction = 'in') > 0 AS replied,
        count(*)        FILTER (WHERE opened_at IS NOT NULL OR clicked_at IS NOT NULL) > 0 AS engaged
    FROM outreach_messages o WHERE o.project_id = p.id
) ob ON true
LEFT JOIN LATERAL (
    SELECT
        max(created_at) AS last_call_at,
        count(*) FILTER (WHERE outcome NOT IN ('no_answer', 'wrong_number')) AS meaningful_calls
    FROM call_logs c WHERE c.project_id = p.id
) calls ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS interest_count FROM interests i WHERE i.project_id = p.id
) intr ON true
LEFT JOIN LATERAL (
    SELECT
        count(*) AS claim_count,
        count(*) FILTER (WHERE paid_at IS NOT NULL) AS paid_count,
        (array_agg(amount_paise ORDER BY created_at DESC))[1] AS latest_amount_paise,
        (array_agg(amount_paise ORDER BY paid_at DESC) FILTER (WHERE paid_at IS NOT NULL))[1] AS paid_amount_paise
    FROM claims k WHERE k.project_id = p.id
) cl ON true
WHERE p.status <> 'error'
ORDER BY p.sales_last_contact_at DESC NULLS LAST, p.created_at DESC
`

export async function getPipelineRows(): Promise<PipelineRow[]> {
    const { rows } = await getVickyosPool().query<DbRow>(PIPELINE_SQL)
    return rows
        .filter((row) => extractContact(row.business_data) !== null)
        .map((row) => {
            const stage = mapStage(row)
            const next = nextAction(row, stage)
            return {
                client: extractBusinessName(row.business_data),
                contact: extractContact(row.business_data),
                stage,
                value_inr: valueInr(row),
                stream: deriveStream(row.business_data, row.discovery_location),
                last_touch: lastTouch(row),
                next_action: next.action,
                next_action_date: next.date,
                notes: composeNotes(row, stage),
            }
        })
}

export interface PipelineSummary {
    as_of: string
    by_stage: Record<Stage, number>
    total_value_inr: number
    reply_rate_30d: number
    outreach_sent_7d: number
    demos_generated_7d: number
    calls_logged_7d: number
}

const ACTIVITY_SQL = `
SELECT
    (SELECT count(*) FROM outreach_messages
        WHERE direction = 'out' AND created_at >= now() - interval '7 days')  AS outreach_sent_7d,
    (SELECT count(*) FROM outreach_messages
        WHERE direction = 'out' AND created_at >= now() - interval '30 days') AS sends_30d,
    (SELECT count(*) FROM outreach_messages
        WHERE direction = 'in' AND created_at >= now() - interval '30 days')  AS replies_30d,
    (SELECT count(*) FROM call_logs
        WHERE created_at >= now() - interval '7 days')                        AS calls_logged_7d,
    (SELECT count(*) FROM queue_jobs
        WHERE job_type = 'website' AND status = 'completed'
          AND completed_at >= now() - interval '7 days')                      AS demos_generated_7d
`

export async function getPipelineSummary(): Promise<PipelineSummary> {
    const [rows, activity] = await Promise.all([
        getPipelineRows(),
        getVickyosPool().query(ACTIVITY_SQL),
    ])
    const a = activity.rows[0]

    const byStage: Record<Stage, number> = {
        lead: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0,
    }
    let totalValue = 0
    for (const row of rows) {
        byStage[row.stage]++
        if (row.stage !== 'lost') totalValue += row.value_inr
    }

    const sends = n(a.sends_30d)
    const replies = n(a.replies_30d)
    return {
        as_of: new Date().toISOString(),
        by_stage: byStage,
        total_value_inr: totalValue,
        reply_rate_30d: sends > 0 ? Math.round((replies / sends) * 1000) / 1000 : 0,
        outreach_sent_7d: n(a.outreach_sent_7d),
        demos_generated_7d: n(a.demos_generated_7d),
        calls_logged_7d: n(a.calls_logged_7d),
    }
}

const PRODUCT_TOTALS_SQL = `
SELECT
    (SELECT count(*) FROM projects WHERE status <> 'error')                       AS crm_rows,
    (SELECT count(*) FROM claims WHERE paid_at IS NOT NULL)                       AS deals_won,
    (SELECT coalesce(sum(amount_paise), 0) FROM claims WHERE paid_at IS NOT NULL) AS revenue_paise,
    (SELECT count(*) FROM outreach_messages WHERE direction = 'out')              AS outreach_sent_total,
    (SELECT count(*) FROM call_logs)                                              AS calls_logged_total,
    (SELECT count(*) FROM queue_jobs WHERE job_type = 'website' AND status = 'completed') AS demos_generated_total
`

/**
 * Product definition for the VickyOS product registry: what FloGen is, plus
 * lifetime aggregates. Static facts live here (reviewed copy), numbers come
 * from the DB.
 */
export async function getProductCard() {
    const { rows } = await getVickyosPool().query(PRODUCT_TOTALS_SQL)
    const t = rows[0]
    return {
        as_of: new Date().toISOString(),
        product: {
            id: 'flogen',
            name: 'FloGen',
            owner: 'Esso Digital',
            category: 'outbound sales engine (internal tool)',
            definition:
                'Scrapes local-business data from Google Maps, audits each business’s web presence, ' +
                'auto-generates a demo replacement website, then sells it through cold outreach ' +
                '(email/WhatsApp) and a call-based sales CRM. Two discovery pools: website ' +
                '(businesses with no site) and automation (AI-automation fit).',
            streams: ['domestic', 'international'],
            stage_model: ['lead', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
            api_base: '/api/vickyos/v1',
            endpoints: ['/health', '/pipeline', '/pipeline/summary', '/product'],
        },
        totals: {
            crm_rows: n(t.crm_rows),
            deals_won: n(t.deals_won),
            revenue_collected_inr: Math.round(n(t.revenue_paise) / 100),
            outreach_sent_total: n(t.outreach_sent_total),
            calls_logged_total: n(t.calls_logged_total),
            demos_generated_total: n(t.demos_generated_total),
        },
    }
}
