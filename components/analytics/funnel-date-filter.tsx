'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function FunnelDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDays = searchParams.get('days') || '7'

  const updateDays = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('days', value)
      } else {
        params.delete('days')
      }
      router.push(`/dashboard/funnel?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="funnel-days-select" className="text-sm font-medium text-muted-foreground">
          Period
        </label>
        <select
          id="funnel-days-select"
          value={currentDays}
          onChange={(e) => updateDays(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
    </div>
  )
}
