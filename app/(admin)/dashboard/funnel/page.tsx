import { Suspense } from 'react'
import { getFunnelData, getRevenueStats } from './actions'
import { FunnelChart } from '@/components/analytics/funnel-chart'
import { FunnelDateFilter } from '@/components/analytics/funnel-date-filter'
import { RevenueSummary } from '@/components/analytics/revenue-summary'

interface FunnelPageProps {
  searchParams: Promise<{ days?: string }>
}

export default async function FunnelPage({ searchParams }: FunnelPageProps) {
  const params = await searchParams
  const days = Math.max(1, Math.min(30, parseInt(params.days || '7', 10) || 7))

  const [funnelData, revenueStats] = await Promise.all([
    getFunnelData(days),
    getRevenueStats(days),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Claim Funnel</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Conversion funnel and revenue from claim flow
        </p>
      </div>

      <Suspense fallback={null}>
        <FunnelDateFilter />
      </Suspense>

      <div className="space-y-6">
        <FunnelChart data={funnelData} />
        <RevenueSummary data={revenueStats} />
      </div>
    </div>
  )
}
