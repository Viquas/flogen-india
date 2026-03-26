'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { subDays } from 'date-fns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelStep {
  step: string
  eventType: string
  count: number
  dropOff: number
}

interface FunnelMetricStage {
  stage: string
  eventType: string
  count: number
  dropOff: number       // % dropped from previous stage
  conversion: number    // % of first stage that reached here
}

export interface FunnelMetrics {
  stages: FunnelMetricStage[]
  overallConversion: number  // first stage -> payment completed
  totalEvents: number
  dateRange: { from: string; to: string }
}

interface RevenueStats {
  totalRevenue: { inr: number; usd: number }
  byPlan: Array<{ plan: string; count: number; revenue: number; currency: string }>
  conversionRate: number
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

// ---------------------------------------------------------------------------
// Funnel step definitions (original legacy events)
// ---------------------------------------------------------------------------

const FUNNEL_STEPS = [
  { step: 'Claim Page Views', eventType: 'claim_page_view' },
  { step: 'Plan Selected', eventType: 'plan_selected' },
  { step: 'Payment Initiated', eventType: 'payment_initiated' },
  { step: 'Payment Completed', eventType: 'payment_completed' },
  { step: 'Customization Submitted', eventType: 'customization_submitted' },
] as const

// ---------------------------------------------------------------------------
// Full claim-to-revenue funnel (new analytics events)
// ---------------------------------------------------------------------------

const FULL_FUNNEL_STAGES = [
  { stage: 'Preview Viewed', eventType: 'preview.viewed' },
  { stage: 'Claim Started', eventType: 'claim.started' },
  { stage: 'Plan Selected', eventType: 'claim.form_submitted' },
  { stage: 'Checkout Opened', eventType: 'payment.checkout_opened' },
  { stage: 'Payment Completed', eventType: 'payment.completed' },
  { stage: 'Upsell Viewed', eventType: 'upsell.viewed' },
  { stage: 'Upsell Accepted', eventType: 'upsell.accepted' },
] as const

// ---------------------------------------------------------------------------
// 1. Funnel data with drop-off percentages
// ---------------------------------------------------------------------------

export async function getFunnelData(days: number = 7): Promise<FunnelStep[]> {
  const supabase = createAdminClient()
  const safeDays = clampDays(days)
  const { from, to } = dateRangeISO(safeDays)

  try {
    const { data, error } = await supabase
      .from('claim_events')
      .select('event_type')
      .gte('created_at', from)
      .lte('created_at', to)

    if (error || !data) {
      console.error('[Funnel] getFunnelData error:', error?.message)
      return []
    }

    // Count occurrences of each event_type in JS (Supabase JS has no GROUP BY)
    const counts: Record<string, number> = {}
    for (const row of data) {
      const et = row.event_type
      counts[et] = (counts[et] || 0) + 1
    }

    // Map to FunnelStep[] with drop-off calculation
    let previousCount = 0
    return FUNNEL_STEPS.map((fs, index) => {
      const count = counts[fs.eventType] || 0
      const dropOff =
        index === 0 || previousCount === 0
          ? 0
          : Math.round(((previousCount - count) / previousCount) * 100)
      previousCount = count
      return {
        step: fs.step,
        eventType: fs.eventType,
        count,
        dropOff,
      }
    })
  } catch (e) {
    console.error('[Funnel] getFunnelData exception:', e)
    return []
  }
}

// ---------------------------------------------------------------------------
// 2. Revenue stats by plan type + conversion rate
// ---------------------------------------------------------------------------

export async function getRevenueStats(days: number = 7): Promise<RevenueStats> {
  const supabase = createAdminClient()
  const safeDays = clampDays(days)
  const { from, to } = dateRangeISO(safeDays)

  const empty: RevenueStats = {
    totalRevenue: { inr: 0, usd: 0 },
    byPlan: [],
    conversionRate: 0,
  }

  try {
    // 1. Fetch paid claims in date range
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('plan, amount_paise, currency, status')
      .in('status', ['paid', 'customizing', 'completed'])
      .gte('paid_at', from)
      .lte('paid_at', to)

    if (claimsError) {
      console.error('[Funnel] getRevenueStats claims error:', claimsError.message)
      return empty
    }

    // 2. Aggregate revenue by plan and currency
    const planMap: Record<string, { count: number; revenue: number; currency: string }> = {}
    let totalInr = 0
    let totalUsd = 0

    for (const claim of claims || []) {
      const plan = claim.plan || 'unknown'
      const currency = (claim.currency || 'INR').toUpperCase()
      const amountMajor = (claim.amount_paise || 0) / 100

      const key = `${plan}-${currency}`
      if (!planMap[key]) {
        planMap[key] = { count: 0, revenue: 0, currency }
      }
      planMap[key].count += 1
      planMap[key].revenue += amountMajor

      if (currency === 'USD') {
        totalUsd += amountMajor
      } else {
        totalInr += amountMajor
      }
    }

    const byPlan = Object.entries(planMap).map(([key, stats]) => ({
      plan: key.split('-')[0],
      count: stats.count,
      revenue: Math.round(stats.revenue * 100) / 100,
      currency: stats.currency,
    }))

    // 3. Compute conversion rate from claim_page_view -> payment_completed
    const { data: events, error: eventsError } = await supabase
      .from('claim_events')
      .select('event_type')
      .in('event_type', ['claim_page_view', 'payment_completed'])
      .gte('created_at', from)
      .lte('created_at', to)

    if (eventsError) {
      console.error('[Funnel] getRevenueStats events error:', eventsError.message)
    }

    let viewCount = 0
    let completedCount = 0
    for (const ev of events || []) {
      if (ev.event_type === 'claim_page_view') viewCount += 1
      if (ev.event_type === 'payment_completed') completedCount += 1
    }

    const conversionRate =
      viewCount > 0 ? Math.round((completedCount / viewCount) * 1000) / 10 : 0

    return {
      totalRevenue: {
        inr: Math.round(totalInr * 100) / 100,
        usd: Math.round(totalUsd * 100) / 100,
      },
      byPlan,
      conversionRate,
    }
  } catch (e) {
    console.error('[Funnel] getRevenueStats exception:', e)
    return empty
  }
}

// ---------------------------------------------------------------------------
// 3. Full claim-to-revenue funnel metrics with drop-off analysis
// ---------------------------------------------------------------------------

export async function getFunnelMetrics(days: number = 7): Promise<FunnelMetrics> {
  const supabase = createAdminClient()
  const safeDays = clampDays(days)
  const { from, to } = dateRangeISO(safeDays)

  const empty: FunnelMetrics = {
    stages: [],
    overallConversion: 0,
    totalEvents: 0,
    dateRange: { from, to },
  }

  try {
    // Fetch all new funnel events in date range
    const eventTypes = FULL_FUNNEL_STAGES.map((s) => s.eventType)
    const { data, error } = await supabase
      .from('claim_events')
      .select('event_type')
      .in('event_type', eventTypes)
      .gte('created_at', from)
      .lte('created_at', to)

    if (error || !data) {
      console.error('[Funnel] getFunnelMetrics error:', error?.message)
      return empty
    }

    // Count occurrences of each event_type
    const counts: Record<string, number> = {}
    for (const row of data) {
      const et = row.event_type
      counts[et] = (counts[et] || 0) + 1
    }

    // Build stages with drop-off and conversion percentages
    const firstCount = counts[FULL_FUNNEL_STAGES[0].eventType] || 0
    let previousCount = 0

    const stages: FunnelMetricStage[] = FULL_FUNNEL_STAGES.map((fs, index) => {
      const count = counts[fs.eventType] || 0
      const dropOff =
        index === 0 || previousCount === 0
          ? 0
          : Math.round(((previousCount - count) / previousCount) * 100)
      const conversion =
        firstCount > 0 ? Math.round((count / firstCount) * 1000) / 10 : 0
      previousCount = count
      return {
        stage: fs.stage,
        eventType: fs.eventType,
        count,
        dropOff,
        conversion,
      }
    })

    // Overall conversion: preview.viewed -> payment.completed
    const paymentCompletedCount = counts['payment.completed'] || 0
    const overallConversion =
      firstCount > 0
        ? Math.round((paymentCompletedCount / firstCount) * 1000) / 10
        : 0

    return {
      stages,
      overallConversion,
      totalEvents: data.length,
      dateRange: { from, to },
    }
  } catch (e) {
    console.error('[Funnel] getFunnelMetrics exception:', e)
    return empty
  }
}
