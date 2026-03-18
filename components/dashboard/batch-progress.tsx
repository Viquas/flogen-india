"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { CheckCircle2, XCircle, Clock, Zap, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getAutopilotProgress } from "@/app/(admin)/dashboard/actions"
import { formatDistanceToNow } from "date-fns"

interface BatchProgressProps {
    runId: string
    onComplete: () => void
}

const STAGES = [
    { key: "discovering", label: "Discover" },
    { key: "enqueueing", label: "Enqueue" },
    { key: "generating", label: "Generate" },
    { key: "fixing", label: "Fix" },
    { key: "scoring", label: "Score" },
    { key: "completed", label: "Done" },
] as const

function getStageIndex(stage: string): number {
    return STAGES.findIndex((s) => s.key === stage)
}

function getStageStatus(stageKey: string, currentStage: string, isFailed: boolean): "done" | "active" | "failed" | "pending" {
    if (isFailed && stageKey === currentStage) return "failed"
    const currentIdx = getStageIndex(currentStage)
    const thisIdx = getStageIndex(stageKey)
    if (thisIdx < currentIdx) return "done"
    if (thisIdx === currentIdx) return "active"
    return "pending"
}

export function BatchProgress({ runId, onComplete }: BatchProgressProps) {
    const [stage, setStage] = useState<string>("pending")
    const [progress, setProgress] = useState<{
        total: number
        generated: number
        error: number
        generating: number
        avgQuality: number | null
    } | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [startedAt, setStartedAt] = useState<string | null>(null)
    const [isComplete, setIsComplete] = useState(false)
    const [isFailed, setIsFailed] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const completeCalled = useRef(false)

    const poll = useCallback(async () => {
        try {
            const data = await getAutopilotProgress(runId)
            setStage(data.stage)
            if (data.progress) setProgress(data.progress)
            if (data.errorMessage) setErrorMessage(data.errorMessage)
            if (data.startedAt) setStartedAt(data.startedAt)

            if (data.isComplete) {
                setIsComplete(true)
                setIsFailed(data.stage === "failed")
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
                if (!completeCalled.current) {
                    completeCalled.current = true
                    onComplete()
                }
            }
        } catch {
            // Ignore polling errors
        }
    }, [runId, onComplete])

    useEffect(() => {
        poll()
        intervalRef.current = setInterval(poll, 3000)
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [poll])

    const totalProcessed = progress ? progress.generated + progress.error : 0
    const total = progress?.total ?? 0
    const progressPct = total > 0 ? Math.round((totalProcessed / total) * 100) : 0

    return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
            {/* Stage stepper — horizontal pills */}
            <div className="flex items-center gap-1">
                {STAGES.map((s, i) => {
                    const status = getStageStatus(s.key, stage, isFailed)
                    return (
                        <div key={s.key} className="flex items-center gap-1">
                            <div
                                className={`
                                    flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors
                                    ${status === "done" ? "bg-emerald-100 text-emerald-700" : ""}
                                    ${status === "active" ? "bg-blue-100 text-blue-700" : ""}
                                    ${status === "failed" ? "bg-red-100 text-red-700" : ""}
                                    ${status === "pending" ? "bg-zinc-100 text-zinc-400" : ""}
                                `}
                            >
                                {status === "done" && <CheckCircle2 className="h-2.5 w-2.5" />}
                                {status === "active" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                {status === "failed" && <XCircle className="h-2.5 w-2.5" />}
                                {s.label}
                            </div>
                            {i < STAGES.length - 1 && (
                                <div className={`w-3 h-px ${getStageIndex(s.key) < getStageIndex(stage) ? "bg-emerald-300" : "bg-zinc-200"}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Progress section */}
            {progress && (
                <div className="space-y-2">
                    {/* Counts + percentage */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-600">
                            <span className="font-semibold text-zinc-900">{progress.generated}</span>
                            <span className="text-zinc-400">/{total}</span>
                            <span className="ml-1">generated</span>
                            {progress.error > 0 && (
                                <span className="text-red-500 ml-2">
                                    {progress.error} failed
                                </span>
                            )}
                            {progress.generating > 0 && (
                                <span className="text-blue-500 ml-2">
                                    {progress.generating} in progress
                                </span>
                            )}
                        </p>
                        <span className="text-xs font-mono text-zinc-400">{progressPct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden flex">
                        {progress.generated > 0 && (
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${total > 0 ? (progress.generated / total) * 100 : 0}%` }}
                            />
                        )}
                        {progress.error > 0 && (
                            <div
                                className="bg-red-400 h-full transition-all duration-500"
                                style={{ width: `${total > 0 ? (progress.error / total) * 100 : 0}%` }}
                            />
                        )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        {startedAt && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(startedAt), { addSuffix: false })}
                            </span>
                        )}
                        {progress.avgQuality != null && (
                            <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-amber-500" />
                                Quality: {progress.avgQuality}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Completion */}
            {isComplete && !isFailed && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pipeline completed
                </div>
            )}

            {/* Failed */}
            {isFailed && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        Pipeline failed
                    </div>
                    {errorMessage && (
                        <p className="text-[11px] text-red-500 pl-5">{errorMessage}</p>
                    )}
                </div>
            )}

            {/* Pending */}
            {!progress && !isComplete && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Starting pipeline...
                </div>
            )}
        </div>
    )
}
