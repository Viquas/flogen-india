'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TimingChartProps {
  data: {
    p50: number
    p95: number
    avg: number
    dataPoints: Array<{ date: string; avgMs: number }>
  }
}

export function TimingChart({ data }: TimingChartProps) {
  const hasMetrics = data.p50 > 0 || data.p95 > 0 || data.avg > 0
  const hasChart = data.dataPoints.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Timing</CardTitle>
      </CardHeader>
      <CardContent>
        {hasMetrics ? (
          <div className="space-y-4">
            {/* Metric values */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.p50}s</div>
                <div className="text-xs text-muted-foreground mt-1">p50</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{data.p95}s</div>
                <div className="text-xs text-muted-foreground mt-1">p95</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-700">{data.avg}s</div>
                <div className="text-xs text-muted-foreground mt-1">Average</div>
              </div>
            </div>

            {/* Line chart for daily averages */}
            {hasChart && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    label={{ value: 'seconds', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}s`, 'Avg Duration']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgMs"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Avg Duration"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No timing data for this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
