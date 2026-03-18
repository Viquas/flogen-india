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

interface FunnelChartProps {
  data: Array<{
    step: string
    count: number
    dropOff: number
  }>
}

const STEP_COLORS = [
  '#2563EB', // blue-600
  '#3B82F6', // blue-500
  '#60A5FA', // blue-400
  '#93C5FD', // blue-300
  '#BFDBFE', // blue-200
]

export function FunnelChart({ data }: FunnelChartProps) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-2">
            {/* Drop-off annotations */}
            <div className="flex flex-wrap gap-3 text-xs mb-2">
              {data.map((d) =>
                d.dropOff > 0 ? (
                  <span key={d.step} className="text-red-500 font-medium">
                    {d.step}: -{d.dropOff}% drop
                  </span>
                ) : null
              )}
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="step"
                  width={180}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, _name, entry) => {
                    const count = Number(value)
                    const dropOff = (entry?.payload as Record<string, number>)?.dropOff ?? 0
                    const label = dropOff > 0 ? `${count} (${dropOff}% drop-off)` : `${count}`
                    return [label, 'Count']
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STEP_COLORS[index % STEP_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
            No funnel data for this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
