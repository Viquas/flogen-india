'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FilterControlsProps {
  models: string[]
  industries: string[]
}

export function FilterControls({ models, industries }: FilterControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentModel = searchParams.get('model') || ''
  const currentIndustry = searchParams.get('industry') || ''
  const currentDays = searchParams.get('days') || '7'

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/dashboard/analytics?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Days selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="days-select" className="text-sm font-medium text-muted-foreground">
          Period
        </label>
        <select
          id="days-select"
          value={currentDays}
          onChange={(e) => updateParams('days', e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {/* Model filter */}
      {models.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="model-select" className="text-sm font-medium text-muted-foreground">
            Model
          </label>
          <select
            id="model-select"
            value={currentModel}
            onChange={(e) => updateParams('model', e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Industry filter */}
      {industries.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="industry-select" className="text-sm font-medium text-muted-foreground">
            Industry
          </label>
          <select
            id="industry-select"
            value={currentIndustry}
            onChange={(e) => updateParams('industry', e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
