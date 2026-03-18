'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SuccessRateChartProps {
  data: Array<{
    date: string
    success: number
    failure: number
    error: number
  }>
}

export function SuccessRateChart({ data }: SuccessRateChartProps) {
  // Combine failure + error into one "failure" metric for a cleaner chart
  const chartData = data.map((d) => ({
    date: d.date,
    Success: d.success,
    Failure: d.failure + d.error,
  }))

  const hasData = chartData.some((d) => d.Success > 0 || d.Failure > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              <Bar
                dataKey="Success"
                stackId="a"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Failure"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No generation data for this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
