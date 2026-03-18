"use client"

import { useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'

interface BatchGroupProps {
  batchId: string
  metadata: {
    query?: string
    location?: string
    industry?: string
    entries?: number
    count?: number
  }
  source: string
  createdAt: string
  projectCount: number
  completedCount: number
  failedCount: number
  children: React.ReactNode
}

export function BatchGroup({
  batchId,
  metadata,
  source,
  createdAt,
  projectCount,
  completedCount,
  failedCount,
  children,
}: BatchGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const label = metadata?.industry && metadata?.location
    ? `${metadata.industry} in ${metadata.location}`
    : metadata?.query || 'Batch'

  const entryCount = metadata?.entries || metadata?.count || projectCount

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        )}

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <span className="font-semibold text-sm text-zinc-900 truncate">{label}</span>
          <span className="text-xs text-zinc-500">({entryCount} entries)</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-emerald-600">{completedCount} done</span>
          {failedCount > 0 && (
            <span className="text-xs font-medium text-red-600">{failedCount} failed</span>
          )}
          {projectCount - completedCount - failedCount > 0 && (
            <span className="text-xs text-zinc-400">
              {projectCount - completedCount - failedCount} pending
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="pl-2">
          {children}
        </div>
      )}
    </div>
  )
}
