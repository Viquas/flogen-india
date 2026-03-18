'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { format, subDays } from 'date-fns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Filters {
  model?: string
  industry?: string
}

interface SuccessRateRow {
  date: string
  success: number
  failure: number
  error: number
}

interface TimingStats {
  p50: number
  p95: number
  avg: number
  dataPoints: Array<{ date: string; avgMs: number }>
}

interface CostBreakdown {
  totalSpend: number
  costPerSuccess: number
  byModel: Array<{ model: string; totalCost: number; callCount: number }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampDays(days: number): number {
  return Math.max(1, Math.min(days, 30))
}

function dateRangeISO(days: number): { from: string; to: string } {
  const now = new Date()
  const from = subDays(now, days)
  from.setHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: now.toISOString() }
}

function dayLabel(isoString: string): string {
  return format(new Date(isoString), 'MMM dd')
}

// ---------------------------------------------------------------------------
// 1. Success / failure rates grouped by day
// ---------------------------------------------------------------------------

export async function getSuccessRatesByDay(
  days: number = 7,
  filters?: Filters
): Promise<SuccessRateRow[]> {
  const supabase = createAdminClient()
  const safeDays = clampDays(days)
  const { from, to } = dateRangeISO(safeDays)

  try {
    // If model filter is set we need to narrow to projects that have cost rows
    // for that model. Supabase JS client does not support JOINs, so we fetch
    // the matching project IDs first.
    let projectIdFilter: string[] | null = null

    if (filters?.model) {
      const { data: costRows } = await supabase
        .from('generation_costs')
        .select('project_id')
        .eq('model', filters.model)
        .gte('created_at', from)
        .lte('created_at', to)

      if (costRows && costRows.length > 0) {
        projectIdFilter = Array.from(new Set(costRows.map((r) => r.project_id).filter(Boolean))) as string[]
      } else {
        // No projects match this model in range -- return empty
        return []
      }
    }

    let query = supabase
      .from('projects')
      .select('created_at, status')
      .gte('created_at', from)
      .lte('created_at', to)

    if (projectIdFilter) {
      query = query.in('id', projectIdFilter)
    }

    if (filters?.industry) {
      // business_data is JSONB; Supabase JS supports ->> text filters
      query = query.filter('business_data->>industry', 'eq', filters.industry)
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('[Analytics] getSuccessRatesByDay error:', error?.message)
      return []
    }

    // Group by day in JS
    const buckets: Record<string, { success: number; failure: number; error: number }> = {}

    // Pre-fill every day in the range so the chart shows zeros
    for (let i = safeDays - 1; i >= 0; i--) {
      const label = format(subDays(new Date(), i), 'MMM dd')
      buckets[label] = { success: 0, failure: 0, error: 0 }
    }

    for (const row of data) {
      const label = dayLabel(row.created_at)
      if (!buckets[label]) buckets[label] = { success: 0, failure: 0, error: 0 }

      if (row.status === 'approved' || row.status === 'review' || row.status === 'deployed') {
        buckets[label].success += 1
      } else if (row.status === 'error') {
        buckets[label].error += 1
      } else {
        // queued / generating -- treat as "in-progress", skip for the chart
      }
    }

    return Object.entries(buckets).map(([date, counts]) => ({
      date,
      ...counts,
    }))
  } catch (e) {
    console.error('[Analytics] getSuccessRatesByDay exception:', e)
    return []
  }
}

// ---------------------------------------------------------------------------
// 2. Timing statistics (p50 / p95 / avg)
// ---------------------------------------------------------------------------

export async function getTimingStats(
  days: number = 7,
  filters?: Filters
): Promise<TimingStats> {
  const supabase = createAdminClient()
  const safeDays = clampDays(days)
  const { from, to } = dateRangeISO(safeDays)
  const empty: TimingStats = { p50: 0, p95: 0, avg: 0, dataPoints: [] }

  try {
    let query = supabase
      .from('queue_jobs')
      .select('started_at, completed_at, model_id, project_id')
      .not('started_at', 'is', null)
      .not('completed_at', 'is', null)
      .gte('created_at', from)
      .lte('created_at', to)

    if (filters?.model) {
      query = query.eq('model_id', filters.model)
    }

    const { data: jobs, error } = await query

    if (error || !jobs || jobs.length === 0) {
      if (error) console.error('[Analytics] getTimingStats error:', error.message)
      return empty
    }

    // If industry filter, fetch matching project IDs to narrow results
    let allowedProjectIds: Set<string> | null = null
    if (filters?.industry) {
      const { data: projRows } = await supabase
        .from('projects')
        .select('id')
        .filter('business_data->>industry', 'eq', filters.industry)

      if (projRows) {
        allowedProjectIds = new Set(projRows.map((r) => r.id))
      }
    }

    // Compute durations in milliseconds
    const durations: number[] = []
    const dailyBuckets: Record<string, number[]> = {}

    for (const job of jobs) {
      if (allowedProjectIds && job.project_id && !allowedProjectIds.has(job.project_id)) {
        continue
      }
      const startMs = new Date(job.started_at!).getTime()
      const endMs = new Date(job.completed_at!).getTime()
      const dur = endMs - startMs
      if (dur <= 0) continue

      durations.push(dur)

      const label = dayLabel(job.started_at!)
      if (!dailyBuckets[label]) dailyBuckets[label] = []
      dailyBuckets[label].push(dur)
    }

    if (durations.length === 0) return empty

    durations.sort((a, b) => a - b)

    const p50 = durations[Math.floor(durations.length * 0.5)]
    const p95 = durations[Math.floor(durations.length * 0.95)]
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length

    const dataPoints = Object.entries(dailyBuckets)
      .map(([date, vals]) => ({
        date,
        avgMs: vals.reduce((a, b) => a + b, 0) / vals.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Return values in seconds
    return {
      p50: Math.round(p50 / 100) / 10,
      p95: Math.round(p95 / 100) / 10,
      avg: Math.round(avg / 100) / 10,
      dataPoints: dataPoints.map((dp) => ({
        date: dp.date,
        avgMs: Math.round(dp.avgMs / 100) / 10, // seconds with 1 decimal
      })),
    }
  } catch (e) {
    console.error('[Analytics] getTimingStats exception:', e)
    return empty
  }
}

// ---------------------------------------------------------------------------
// 3. Cost breakdown
// ---------------------------------------------------------------------------

export async function getCostBreakdown(
  days: number = 7,
  filters?: Filters
): Promise<CostBreakdown> {
  const supabase = createAdminClient()
  const safeDays = clampDays(days)
  const { from, to } = dateRangeISO(safeDays)
  const empty: CostBreakdown = { totalSpend: 0, costPerSuccess: 0, byModel: [] }

  try {
    let query = supabase
      .from('generation_costs')
      .select('model, estimated_cost_usd, project_id')
      .gte('created_at', from)
      .lte('created_at', to)

    if (filters?.model) {
      query = query.eq('model', filters.model)
    }

    const { data: costRows, error } = await query

    if (error || !costRows || costRows.length === 0) {
      if (error) console.error('[Analytics] getCostBreakdown error:', error.message)
      return empty
    }

    // If industry filter, get matching project IDs
    let allowedProjectIds: Set<string> | null = null
    if (filters?.industry) {
      const { data: projRows } = await supabase
        .from('projects')
        .select('id')
        .filter('business_data->>industry', 'eq', filters.industry)

      if (projRows) {
        allowedProjectIds = new Set(projRows.map((r) => r.id))
      }
    }

    // Aggregate
    let totalSpend = 0
    const modelMap: Record<string, { totalCost: number; callCount: number }> = {}
    const projectIds = new Set<string>()

    for (const row of costRows) {
      if (allowedProjectIds && row.project_id && !allowedProjectIds.has(row.project_id)) {
        continue
      }

      const cost = Number(row.estimated_cost_usd)
      totalSpend += cost

      if (!modelMap[row.model]) {
        modelMap[row.model] = { totalCost: 0, callCount: 0 }
      }
      modelMap[row.model].totalCost += cost
      modelMap[row.model].callCount += 1

      if (row.project_id) projectIds.add(row.project_id)
    }

    // Count successful projects in the set
    let successCount = 0
    if (projectIds.size > 0) {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('id', Array.from(projectIds))
        .in('status', ['review', 'approved', 'deployed'])

      successCount = count || 0
    }

    const costPerSuccess = successCount > 0 ? totalSpend / successCount : 0

    const byModel = Object.entries(modelMap)
      .map(([model, stats]) => ({
        model,
        totalCost: Math.round(stats.totalCost * 1_000_000) / 1_000_000,
        callCount: stats.callCount,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    return {
      totalSpend: Math.round(totalSpend * 1_000_000) / 1_000_000,
      costPerSuccess: Math.round(costPerSuccess * 1_000_000) / 1_000_000,
      byModel,
    }
  } catch (e) {
    console.error('[Analytics] getCostBreakdown exception:', e)
    return empty
  }
}

// ---------------------------------------------------------------------------
// 4. Filter options (distinct models and industries)
// ---------------------------------------------------------------------------

export async function getFilterOptions(): Promise<{
  models: string[]
  industries: string[]
}> {
  const supabase = createAdminClient()

  try {
    const [costResult, projectResult] = await Promise.all([
      supabase.from('generation_costs').select('model'),
      supabase.from('projects').select('business_data'),
    ])

    const models = costResult.data
      ? Array.from(new Set(costResult.data.map((r) => r.model).filter(Boolean))).sort()
      : []

    const industries = projectResult.data
      ? Array.from(
          new Set(
            projectResult.data
              .map((r) => (r.business_data as Record<string, unknown>)?.industry as string | undefined)
              .filter(Boolean) as string[]
          )
        ).sort()
      : []

    return { models, industries }
  } catch (e) {
    console.error('[Analytics] getFilterOptions exception:', e)
    return { models: [], industries: [] }
  }
}
