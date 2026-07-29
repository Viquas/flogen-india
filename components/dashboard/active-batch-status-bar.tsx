"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2, Sparkles, CheckCircle, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAutopilotProgress } from "@/app/(admin)/dashboard/actions"

interface ActiveBatchStatusBarProps {
    runId: string
    onDismiss?: () => void
}

const STAGE_LABELS: Record<string, string> = {
    pending: "Starting...",
    discovering: "Discovering businesses",
    enqueueing: "Queueing jobs",
    generating: "Generating websites",
    fixing: "Auto-fixing errors",
    scoring: "Quality scoring",
    completed: "Completed",
    failed: "Failed",
}

export function ActiveBatchStatusBar({ runId, onDismiss }: ActiveBatchStatusBarProps) {
    const [progress, setProgress] = useState<{
        stage: string
        progress: { total_projects: number; generated: number; fixed: number; failed: number }
        config: { query?: string; location?: string; industry?: string }
        isComplete: boolean
        error?: string
        startedAt?: string
    } | null>(null)

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const poll = useCallback(async () => {
        try {
            const data = await getAutopilotProgress(runId)
            if (data) {
                setProgress(data as any)
                // Stop the poller once the run reaches a terminal state — otherwise
                // it keeps hitting the server every 3s until the admin dismisses.
                if ((data as any).isComplete && intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
            }
        } catch {
            // Ignore polling errors
        }
    }, [runId])

    useEffect(() => {
        poll()
        intervalRef.current = setInterval(poll, 3000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [poll])

    if (!progress) return null

    const { stage, config, isComplete, error } = progress
    const p = progress.progress || { total_projects: 0, generated: 0, fixed: 0, failed: 0 }
    const label = config.query || config.industry || "Batch"
    const location = config.location ? ` in ${config.location}` : ""
    const elapsed = progress.startedAt
        ? Math.round((Date.now() - new Date(progress.startedAt).getTime()) / 1000)
        : 0
    const elapsedStr = elapsed > 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`

    const isFailed = stage === "failed"
    const isRunning = !isComplete && !isFailed

    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
            isFailed
                ? "bg-red-50 border-red-200"
                : isComplete
                    ? "bg-green-50 border-green-200"
                    : "bg-purple-50 border-purple-200"
        }`}>
            {isRunning && <Loader2 className="h-4 w-4 animate-spin text-purple-600 shrink-0" />}
            {isComplete && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
            {isFailed && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}

            <span className="font-medium truncate">
                {label}{location}
            </span>

            <Badge variant="outline" className={`shrink-0 text-xs ${
                isFailed ? "border-red-300 text-red-700" :
                isComplete ? "border-green-300 text-green-700" :
                "border-purple-300 text-purple-700"
            }`}>
                {STAGE_LABELS[stage] || stage}
            </Badge>

            {p.total_projects > 0 && (
                <span className="text-xs text-zinc-500 shrink-0">
                    {p.generated}/{p.total_projects} generated
                    {p.fixed > 0 && `, ${p.fixed} fixed`}
                    {p.failed > 0 && `, ${p.failed} failed`}
                </span>
            )}

            {isRunning && (
                <span className="text-xs text-zinc-400 shrink-0">{elapsedStr}</span>
            )}

            {error && (
                <span className="text-xs text-red-600 truncate">{error}</span>
            )}

            <div className="ml-auto shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}
