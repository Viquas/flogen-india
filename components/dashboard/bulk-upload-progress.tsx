"use client"

import { useState, useEffect, useRef } from "react"
import { Map, Globe, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BulkUploadProgressProps {
  batchId: string
  onComplete?: () => void
}

interface ProgressData {
  total: number
  completed: number
  researching: number
  pending: number
  found_maps: number
  found_web: number
  not_found: number
  failed: number
  status: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadProgress({ batchId, onComplete }: BulkUploadProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completeFired = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/bulk-upload/${batchId}/progress`)
        if (!res.ok) throw new Error("Failed to fetch progress")
        const data: ProgressData = await res.json()
        if (cancelled) return
        setProgress(data)
        setError(null)

        // Check if research is done
        const isDone = data.status === "completed" || data.status === "partially_failed"
        if (isDone && !completeFired.current) {
          completeFired.current = true
          if (intervalRef.current) clearInterval(intervalRef.current)
          onComplete?.()
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Polling error")
        }
      }
    }

    // Initial fetch
    poll()

    // Poll every 3 seconds
    intervalRef.current = setInterval(poll, 3000)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [batchId, onComplete])

  if (error && !progress) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="animate-pulse space-y-3 py-4">
        <div className="h-4 bg-zinc-100 rounded w-3/4" />
        <div className="h-2 bg-zinc-100 rounded" />
        <div className="h-4 bg-zinc-100 rounded w-1/2" />
      </div>
    )
  }

  const pct = progress.total > 0
    ? Math.round(((progress.completed) / progress.total) * 100)
    : 0

  const isDone = progress.status === "completed" || progress.status === "partially_failed"

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-zinc-600 font-medium">
            {isDone ? "Research complete" : "Researching leads..."}
          </span>
          <span className="text-zinc-500 tabular-nums">{pct}%</span>
        </div>
        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isDone ? "bg-emerald-500" : "bg-purple-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Live counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
          <Map className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-600 font-medium">Google Maps</p>
            <p className="text-lg font-semibold text-emerald-700 tabular-nums">
              {progress.found_maps}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <Globe className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Web Search</p>
            <p className="text-lg font-semibold text-blue-700 tabular-nums">
              {progress.found_web}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-500 font-medium">Not Found</p>
            <p className="text-lg font-semibold text-zinc-600 tabular-nums">
              {progress.not_found}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total / Pending</p>
            <p className="text-lg font-semibold text-zinc-600 tabular-nums">
              {progress.total} / {progress.pending}
            </p>
          </div>
        </div>
      </div>

      {progress.failed > 0 && (
        <p className="text-xs text-red-500">
          {progress.failed} lead{progress.failed > 1 ? "s" : ""} failed during research
        </p>
      )}
    </div>
  )
}
