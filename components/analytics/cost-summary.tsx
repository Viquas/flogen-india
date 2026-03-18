'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CostSummaryProps {
  data: {
    totalSpend: number
    costPerSuccess: number
    byModel: Array<{ model: string; totalCost: number; callCount: number }>
  }
}

const MODEL_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f97316', // orange
]

function formatUSD(value: number): string {
  return `$${value.toFixed(4)}`
}

export function CostSummary({ data }: CostSummaryProps) {
  const hasData = data.totalSpend > 0 || data.byModel.length > 0

  // Shorten model names for chart labels (e.g. "gpt-4o-mini" stays, but very long names truncate)
  const chartData = data.byModel.map((m) => ({
    ...m,
    shortModel: m.model.length > 20 ? m.model.slice(0, 18) + '...' : m.model,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {/* Top-level metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Spend</div>
                <div className="text-2xl font-bold">{formatUSD(data.totalSpend)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cost / Success</div>
                <div className="text-2xl font-bold">{formatUSD(data.costPerSuccess)}</div>
              </div>
            </div>

            {/* Per-model bar chart */}
            {chartData.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Cost by Model</div>
                <ResponsiveContainer width="100%" height={Math.max(150, chartData.length * 40)}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortModel"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value, _name, entry) => {
                        const cost = Number(value)
                        const calls = (entry?.payload as Record<string, number>)?.callCount ?? 0
                        return [`${formatUSD(cost)} (${calls} calls)`, 'Cost']
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="totalCost" radius={[0, 4, 4, 0]}>
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No cost data for this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
