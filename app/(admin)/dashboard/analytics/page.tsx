import { Suspense } from 'react'
import { getSuccessRatesByDay, getTimingStats, getCostBreakdown, getFilterOptions } from './actions'
import { SuccessRateChart } from '@/components/analytics/success-rate-chart'
import { TimingChart } from '@/components/analytics/timing-chart'
import { CostSummary } from '@/components/analytics/cost-summary'
import { FilterControls } from '@/components/analytics/filter-controls'

interface AnalyticsPageProps {
  searchParams: Promise<{ model?: string; industry?: string; days?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams
  const filters = {
    model: params.model || undefined,
    industry: params.industry || undefined,
  }
  const days = Math.max(1, Math.min(30, parseInt(params.days || '7', 10) || 7))

  const [successRates, timingStats, costBreakdown, filterOptions] = await Promise.all([
    getSuccessRatesByDay(days, filters),
    getTimingStats(days, filters),
    getCostBreakdown(days, filters),
    getFilterOptions(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Generation performance, timing, and cost insights
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <FilterControls
          models={filterOptions.models}
          industries={filterOptions.industries}
        />
      </Suspense>

      {/* Charts grid */}
      <div className="space-y-6">
        {/* Success rate chart - full width */}
        <SuccessRateChart data={successRates} />

        {/* Timing + Cost side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimingChart data={timingStats} />
          <CostSummary data={costBreakdown} />
        </div>
      </div>
    </div>
  )
}
