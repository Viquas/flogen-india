'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueSummaryProps {
  data: {
    totalRevenue: { inr: number; usd: number }
    byPlan: Array<{ plan: string; count: number; revenue: number; currency: string }>
    conversionRate: number
  }
}

function formatINR(value: number): string {
  return `Rs. ${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatUSD(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function RevenueSummary({ data }: RevenueSummaryProps) {
  const hasData = data.totalRevenue.inr > 0 || data.totalRevenue.usd > 0 || data.byPlan.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue &amp; Conversion</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            {/* Total revenue */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue (INR)</div>
                <div className="text-2xl font-bold">{formatINR(data.totalRevenue.inr)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue (USD)</div>
                <div className="text-2xl font-bold">{formatUSD(data.totalRevenue.usd)}</div>
              </div>
            </div>

            {/* By plan breakdown */}
            {data.byPlan.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">By Plan</div>
                <div className="space-y-2">
                  {data.byPlan.map((p) => (
                    <div
                      key={`${p.plan}-${p.currency}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="font-medium capitalize">{p.plan}</span>
                      <span className="text-muted-foreground">
                        {p.count} claim{p.count !== 1 ? 's' : ''} &middot;{' '}
                        {p.currency === 'USD' ? formatUSD(p.revenue) : formatINR(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion rate */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">Claim-to-Payment</div>
              <div className="text-3xl font-bold">{data.conversionRate}%</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No revenue data for this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
