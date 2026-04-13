import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Sales-facing data access. All queries are deduped via React cache() within
 * a single request. The `projects.sales_*` columns and the `call_logs` table
 * are not yet in the typed Database schema — we use untyped casts and
 * rely on the migration having been applied.
 */

export type SalesStatus =
    | 'new'
    | 'attempted'
    | 'in_conversation'
    | 'interested'
    | 'closed'
    | 'not_interested'
    | 'do_not_call'

export type CallOutcome =
    | 'no_answer'
    | 'wrong_number'
    | 'not_interested'
    | 'interested'
    | 'callback_scheduled'
    | 'closed'
    | 'do_not_call'

export interface SalesLeadRow {
    id: string
    slug: string | null
    businessName: string
    phone: string | null
    address: string | null
    industry: string | null
    rating: number | null
    reviewCount: number | null
    qualityScore: number | null
    createdAt: string
    salesStatus: SalesStatus
    salesLastContactAt: string | null
    salesLastContactBy: string | null
    salesLastContactByEmail: string | null
    salesCallCount: number
    salesNextFollowupAt: string | null
    /** true if a matching claim row has paid_at IS NOT NULL */
    isPaid: boolean
}

export interface LeadFilters {
    status?: SalesStatus[]
    search?: string
    industry?: string
    hasFollowup?: boolean
    limit?: number
}

// ---- business_data extraction helpers (mirrors outreach-modal.tsx logic) ----

function bd<T = unknown>(obj: Record<string, unknown> | null | undefined, path: string[]): T | null {
    if (!obj) return null
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

function extractBusinessName(data: Record<string, unknown> | null): string {
    return (
        (bd<string>(data, ['businessName'])) ||
        (bd<string>(data, ['brandIdentity', 'core', 'brandName'])) ||
        (bd<string>(data, ['business_name'])) ||
        'Unknown business'
    )
}

function extractPhone(data: Record<string, unknown> | null): string | null {
    const opPhone = bd<string>(data, ['operationalData', 'contact', 'phone'])
    if (opPhone && typeof opPhone === 'string') return opPhone
    return (
        bd<string>(data, ['internationalPhoneNumber']) ||
        bd<string>(data, ['contactInfo', 'phone']) ||
        bd<string>(data, ['nationalPhoneNumber']) ||
        null
    )
}

function extractAddress(data: Record<string, unknown> | null): string | null {
    return (
        bd<string>(data, ['operationalData', 'contact', 'address']) ||
        bd<string>(data, ['contactInfo', 'address']) ||
        bd<string>(data, ['address']) ||
        null
    )
}

function extractIndustry(data: Record<string, unknown> | null): string | null {
    return (
        bd<string>(data, ['industry']) ||
        bd<string>(data, ['category']) ||
        null
    )
}

function extractRating(data: Record<string, unknown> | null): number | null {
    const r = bd<number>(data, ['rating'])
    return typeof r === 'number' ? r : null
}

function extractReviewCount(data: Record<string, unknown> | null): number | null {
    const c =
        bd<number>(data, ['userRatingCount']) ??
        bd<number>(data, ['reviewCount']) ??
        bd<number>(data, ['review_count'])
    return typeof c === 'number' ? c : null
}

function rowToSalesLead(
    row: Record<string, unknown>,
    emailMap: Map<string, string>,
    paidSet: Set<string>,
): SalesLeadRow {
    const business = (row.business_data as Record<string, unknown> | null) || null
    const lastBy = (row.sales_last_contact_by as string | null) || null
    return {
        id: row.id as string,
        slug: (row.slug as string | null) ?? null,
        businessName: extractBusinessName(business),
        phone: extractPhone(business),
        address: extractAddress(business),
        industry: extractIndustry(business),
        rating: extractRating(business),
        reviewCount: extractReviewCount(business),
        qualityScore: (row.quality_score as number | null) ?? null,
        createdAt: row.created_at as string,
        salesStatus: ((row.sales_status as SalesStatus | null) || 'new'),
        salesLastContactAt: (row.sales_last_contact_at as string | null) ?? null,
        salesLastContactBy: lastBy,
        salesLastContactByEmail: lastBy ? emailMap.get(lastBy) || null : null,
        salesCallCount: (row.sales_call_count as number | null) ?? 0,
        salesNextFollowupAt: (row.sales_next_followup_at as string | null) ?? null,
        isPaid: paidSet.has(row.id as string),
    }
}

// ---- Queries ----

/**
 * Resolve a set of auth.users ids → email map.
 * Uses the admin auth API (not the typed client).
 */
async function getUserEmailMap(userIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    if (userIds.length === 0) return map
    const admin = createAdminClient()
    // listUsers doesn't support filter by id; fetch each in parallel (small N).
    await Promise.all(
        Array.from(new Set(userIds)).map(async (id) => {
            try {
                const { data } = await admin.auth.admin.getUserById(id)
                if (data?.user?.email) map.set(id, data.user.email)
            } catch {
                /* ignore */
            }
        }),
    )
    return map
}

/**
 * Fetch the set of project ids that have a paid claim.
 * Used to ground-truth conversion metrics.
 */
async function getPaidProjectIds(projectIds: string[]): Promise<Set<string>> {
    const set = new Set<string>()
    if (projectIds.length === 0) return set
    const admin = createAdminClient()
    const { data } = await admin
        .from('claims')
        .select('project_id, paid_at')
        .in('project_id', projectIds)
        .not('paid_at', 'is', null)
    for (const row of data || []) {
        if (row.project_id) set.add(row.project_id)
    }
    return set
}

/**
 * Shared pool of leads eligible for sales.
 * Criteria: project status in ('review','approved') AND a phone number exists in business_data.
 * Default sort: untouched leads first (NULLS FIRST on sales_last_contact_at), then quality desc.
 */
export const getSalesLeads = cache(async (filters: LeadFilters = {}): Promise<SalesLeadRow[]> => {
    const admin = createAdminClient() as any
    const limit = filters.limit ?? 200

    let q = admin
        .from('projects')
        .select(
            'id, slug, business_data, quality_score, created_at, sales_status, sales_last_contact_at, sales_last_contact_by, sales_call_count, sales_next_followup_at',
        )
        .in('status', ['review', 'approved'])
        .order('sales_last_contact_at', { ascending: true, nullsFirst: true })
        .order('quality_score', { ascending: false, nullsFirst: false })
        .limit(limit)

    if (filters.status && filters.status.length > 0) {
        q = q.in('sales_status', filters.status)
    }
    if (filters.hasFollowup === true) {
        q = q.not('sales_next_followup_at', 'is', null)
    }
    if (filters.hasFollowup === false) {
        q = q.is('sales_next_followup_at', null)
    }

    const { data, error } = await q
    if (error) {
        console.error('[sales/get-leads] getSalesLeads error:', error)
        return []
    }

    // Require a phone number (filter in app code — JSON path filter syntax varies).
    const withPhone = (data || []).filter((row: Record<string, unknown>) => {
        return !!extractPhone((row.business_data as Record<string, unknown> | null) || null)
    })

    // Optional client-side filters
    const s = filters.search?.trim().toLowerCase()
    const ind = filters.industry?.trim().toLowerCase()
    const filtered = withPhone.filter((row: Record<string, unknown>) => {
        const data = (row.business_data as Record<string, unknown> | null) || null
        if (s) {
            const name = extractBusinessName(data).toLowerCase()
            const phone = (extractPhone(data) || '').toLowerCase()
            if (!name.includes(s) && !phone.includes(s)) return false
        }
        if (ind) {
            const industry = (extractIndustry(data) || '').toLowerCase()
            if (!industry.includes(ind)) return false
        }
        return true
    })

    const projectIds = filtered.map((r: Record<string, unknown>) => r.id as string)
    const lastByIds = filtered
        .map((r: Record<string, unknown>) => r.sales_last_contact_by as string | null)
        .filter((v: string | null): v is string => !!v)

    const [emailMap, paidSet] = await Promise.all([
        getUserEmailMap(lastByIds),
        getPaidProjectIds(projectIds),
    ])

    return filtered.map((row: Record<string, unknown>) => rowToSalesLead(row, emailMap, paidSet))
})

export interface CallLogEntry {
    id: string
    projectId: string
    salespersonId: string
    salespersonEmail: string | null
    outcome: CallOutcome
    notes: string
    followUpAt: string | null
    durationSeconds: number | null
    createdAt: string
}

export interface LeadDetail {
    lead: SalesLeadRow | null
    callLogs: CallLogEntry[]
}

export const getLeadDetail = cache(async (projectId: string): Promise<LeadDetail> => {
    const admin = createAdminClient() as any

    const { data: row } = await admin
        .from('projects')
        .select(
            'id, slug, business_data, quality_score, created_at, sales_status, sales_last_contact_at, sales_last_contact_by, sales_call_count, sales_next_followup_at',
        )
        .eq('id', projectId)
        .maybeSingle()

    if (!row) return { lead: null, callLogs: [] }

    const { data: logs } = await admin
        .from('call_logs')
        .select('id, project_id, salesperson_id, outcome, notes, follow_up_at, duration_seconds, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    const lastBy = (row.sales_last_contact_by as string | null) || null
    const allUserIds = [
        ...(logs || []).map((l: Record<string, unknown>) => l.salesperson_id as string),
        ...(lastBy ? [lastBy] : []),
    ]
    const [emailMap, paidSet] = await Promise.all([
        getUserEmailMap(allUserIds),
        getPaidProjectIds([projectId]),
    ])

    const lead = rowToSalesLead(row, emailMap, paidSet)
    const callLogs: CallLogEntry[] = (logs || []).map((l: Record<string, unknown>) => ({
        id: l.id as string,
        projectId: l.project_id as string,
        salespersonId: l.salesperson_id as string,
        salespersonEmail: emailMap.get(l.salesperson_id as string) || null,
        outcome: l.outcome as CallOutcome,
        notes: (l.notes as string) || '',
        followUpAt: (l.follow_up_at as string | null) || null,
        durationSeconds: (l.duration_seconds as number | null) || null,
        createdAt: l.created_at as string,
    }))

    return { lead, callLogs }
})

// ---- Metrics ----

export interface SalesMetrics {
    myCallsToday: number
    myCallsWeek: number
    myConversions: number
    teamCallsToday: number
    teamCallsWeek: number
    teamConversions: number
    teamConversionRate: number // 0..1 over leads with any call logged
    todaysFollowups: SalesLeadRow[]
    recentActivity: Array<CallLogEntry & { businessName: string; projectId: string }>
}

export const getSalesMetrics = cache(async (currentUserId: string): Promise<SalesMetrics> => {
    const admin = createAdminClient() as any
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    const [
        { count: myCallsToday },
        { count: myCallsWeek },
        { count: teamCallsToday },
        { count: teamCallsWeek },
        followupsRes,
        recentRes,
    ] = await Promise.all([
        admin
            .from('call_logs')
            .select('id', { count: 'exact', head: true })
            .eq('salesperson_id', currentUserId)
            .gte('created_at', startOfToday),
        admin
            .from('call_logs')
            .select('id', { count: 'exact', head: true })
            .eq('salesperson_id', currentUserId)
            .gte('created_at', startOfWeek),
        admin
            .from('call_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfToday),
        admin
            .from('call_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfWeek),
        admin
            .from('projects')
            .select(
                'id, slug, business_data, quality_score, created_at, sales_status, sales_last_contact_at, sales_last_contact_by, sales_call_count, sales_next_followup_at',
            )
            .gte('sales_next_followup_at', startOfToday)
            .lt('sales_next_followup_at', endOfToday)
            .order('sales_next_followup_at', { ascending: true })
            .limit(50),
        admin
            .from('call_logs')
            .select('id, project_id, salesperson_id, outcome, notes, follow_up_at, duration_seconds, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    // Conversion = a paid claim exists whose project was last contacted by a salesperson.
    // For MY conversions: claims.paid_at IS NOT NULL AND projects.sales_last_contact_by = me.
    // For TEAM conversions: claims.paid_at IS NOT NULL AND projects.sales_last_contact_by IS NOT NULL.
    const { data: paidClaims } = await admin
        .from('claims')
        .select('project_id')
        .not('paid_at', 'is', null)

    const paidProjectIds = (paidClaims || []).map((c: { project_id: string }) => c.project_id)
    let myConversions = 0
    let teamConversions = 0
    if (paidProjectIds.length > 0) {
        const { data: convRows } = await admin
            .from('projects')
            .select('id, sales_last_contact_by')
            .in('id', paidProjectIds)
            .not('sales_last_contact_by', 'is', null)
        for (const row of convRows || []) {
            teamConversions++
            if (row.sales_last_contact_by === currentUserId) myConversions++
        }
    }

    // conversion rate: teamConversions / distinct projects with at least 1 call log
    const { data: distinctCalled } = await admin
        .from('projects')
        .select('id')
        .gt('sales_call_count', 0)
    const called = (distinctCalled || []).length
    const teamConversionRate = called > 0 ? teamConversions / called : 0

    // Resolve today's follow-ups into the sales lead row shape
    const followupRows = followupsRes.data || []
    const followupProjectIds = followupRows.map((r: Record<string, unknown>) => r.id as string)
    const followupUserIds = followupRows
        .map((r: Record<string, unknown>) => r.sales_last_contact_by as string | null)
        .filter((v: string | null): v is string => !!v)
    const [fuEmails, fuPaid] = await Promise.all([
        getUserEmailMap(followupUserIds),
        getPaidProjectIds(followupProjectIds),
    ])
    const todaysFollowups = followupRows.map((r: Record<string, unknown>) => rowToSalesLead(r, fuEmails, fuPaid))

    // Resolve recent activity with business names + salesperson emails
    const recentLogs = recentRes.data || []
    const recentProjectIds = recentLogs.map((l: Record<string, unknown>) => l.project_id as string)
    const recentSalesIds = recentLogs.map((l: Record<string, unknown>) => l.salesperson_id as string)
    const [recentProjects, recentEmails] = await Promise.all([
        recentProjectIds.length > 0
            ? admin.from('projects').select('id, business_data').in('id', recentProjectIds)
            : Promise.resolve({ data: [] }),
        getUserEmailMap(recentSalesIds),
    ])
    const nameMap = new Map<string, string>()
    for (const p of (recentProjects as { data: Array<Record<string, unknown>> }).data || []) {
        nameMap.set(
            p.id as string,
            extractBusinessName((p.business_data as Record<string, unknown> | null) || null),
        )
    }

    const recentActivity = recentLogs.map((l: Record<string, unknown>) => ({
        id: l.id as string,
        projectId: l.project_id as string,
        salespersonId: l.salesperson_id as string,
        salespersonEmail: recentEmails.get(l.salesperson_id as string) || null,
        outcome: l.outcome as CallOutcome,
        notes: (l.notes as string) || '',
        followUpAt: (l.follow_up_at as string | null) || null,
        durationSeconds: (l.duration_seconds as number | null) || null,
        createdAt: l.created_at as string,
        businessName: nameMap.get(l.project_id as string) || 'Unknown business',
    }))

    return {
        myCallsToday: myCallsToday || 0,
        myCallsWeek: myCallsWeek || 0,
        myConversions,
        teamCallsToday: teamCallsToday || 0,
        teamCallsWeek: teamCallsWeek || 0,
        teamConversions,
        teamConversionRate,
        todaysFollowups,
        recentActivity,
    }
})

/**
 * Per-salesperson leaderboard aggregates. Used by /sales/team.
 */
export interface SalespersonStats {
    userId: string
    email: string
    callsTotal: number
    callsWeek: number
    outcomes: Record<CallOutcome, number>
    conversions: number
}

export const getTeamStats = cache(async (): Promise<SalespersonStats[]> => {
    const admin = createAdminClient() as any
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all users with 'sales' or 'admin' role
    const { data: roles } = await admin
        .from('user_roles')
        .select('id, role')
        .in('role', ['sales', 'admin'])

    const userIds = (roles || []).map((r: { id: string }) => r.id)
    const emailMap = await getUserEmailMap(userIds)

    // Fetch all call logs in one shot (small N assumed for team use)
    const { data: allLogs } = await admin
        .from('call_logs')
        .select('salesperson_id, outcome, created_at')

    // Paid project map by salesperson
    const { data: paidClaims } = await admin
        .from('claims')
        .select('project_id')
        .not('paid_at', 'is', null)
    const paidProjectIds = (paidClaims || []).map((c: { project_id: string }) => c.project_id)
    const convBySalesperson = new Map<string, number>()
    if (paidProjectIds.length > 0) {
        const { data: convRows } = await admin
            .from('projects')
            .select('sales_last_contact_by')
            .in('id', paidProjectIds)
            .not('sales_last_contact_by', 'is', null)
        for (const row of convRows || []) {
            const key = row.sales_last_contact_by as string
            convBySalesperson.set(key, (convBySalesperson.get(key) || 0) + 1)
        }
    }

    const emptyOutcomes = (): Record<CallOutcome, number> => ({
        no_answer: 0,
        wrong_number: 0,
        not_interested: 0,
        interested: 0,
        callback_scheduled: 0,
        closed: 0,
        do_not_call: 0,
    })

    const statsByUser = new Map<string, SalespersonStats>()
    for (const id of userIds) {
        statsByUser.set(id, {
            userId: id,
            email: emailMap.get(id) || '(unknown)',
            callsTotal: 0,
            callsWeek: 0,
            outcomes: emptyOutcomes(),
            conversions: convBySalesperson.get(id) || 0,
        })
    }

    for (const log of allLogs || []) {
        const key = log.salesperson_id as string
        let stats = statsByUser.get(key)
        if (!stats) {
            // Log from a user who no longer has a role — still surface them
            stats = {
                userId: key,
                email: '(former user)',
                callsTotal: 0,
                callsWeek: 0,
                outcomes: emptyOutcomes(),
                conversions: convBySalesperson.get(key) || 0,
            }
            statsByUser.set(key, stats)
        }
        stats.callsTotal++
        if ((log.created_at as string) >= startOfWeek) stats.callsWeek++
        const outcome = log.outcome as CallOutcome
        if (outcome in stats.outcomes) stats.outcomes[outcome]++
    }

    return Array.from(statsByUser.values()).sort((a, b) => b.conversions - a.conversions || b.callsTotal - a.callsTotal)
})
