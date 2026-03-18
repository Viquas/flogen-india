"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAutopilotProgress } from "@/app/dashboard/actions"
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

type StageKey = (typeof STAGES)[number]["key"]

function getStageIndex(stage: string): number {
    const idx = STAGES.findIndex((s) => s.key === stage)
    return idx >= 0 ? idx : -1
}

function getStageDotClass(stageKey: string, currentStage: string, isFailed: boolean): string {
    if (isFailed && stageKey === currentStage) {
        return "bg-red-500"
    }
    const currentIdx = getStageIndex(currentStage)
    const thisIdx = getStageIndex(stageKey)

    if (thisIdx < currentIdx) return "bg-green-500"
    if (thisIdx === currentIdx) return "bg-blue-500 animate-pulse"
    return "bg-zinc-300"
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
        poll() // initial fetch
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
    const greenPct = total > 0 ? Math.round((progress!.generated / total) * 100) : 0
    const redPct = total > 0 ? Math.round((progress!.error / total) * 100) : 0

    return (
        <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4 space-y-4">
            {/* Stage stepper */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
                {STAGES.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-1.5">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`h-3 w-3 rounded-full ${getStageDotClass(s.key, stage, isFailed)}`}
                            />
                            <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                {s.label}
                            </span>
                        </div>
                        {i < STAGES.length - 1 && (
                            <div className="w-6 h-px bg-zinc-300 mt-[-12px]" />
                        )}
                    </div>
                ))}
            </div>

            {/* Progress counts */}
            {progress && (
                <div className="space-y-2">
                    <p className="text-sm text-zinc-700">
                        <span className="font-medium">{progress.generated}</span> of{" "}
                        <span className="font-medium">{total}</span> generated
                        {progress.error > 0 && (
                            <span className="text-red-600">
                                , <span className="font-medium">{progress.error}</span> failed
                            </span>
                        )}
                        {progress.generating > 0 && (
                            <span className="text-blue-600">
                                , <span className="font-medium">{progress.generating}</span> in progress
                            </span>
                        )}
                    </p>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden flex">
                        {greenPct > 0 && (
                            <div
                                className="bg-green-500 h-full transition-all duration-500"
                                style={{ width: `${greenPct}%` }}
                            />
                        )}
                        {redPct > 0 && (
                            <div
                                className="bg-red-500 h-full transition-all duration-500"
                                style={{ width: `${redPct}%` }}
                            />
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                        {startedAt && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(startedAt), { addSuffix: false })}
                            </span>
                        )}
                        {progress.avgQuality != null && (
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-white">
                                <Zap className="h-3 w-3 text-amber-500" />
                                Avg Quality: {progress.avgQuality}
                            </Badge>
                        )}
                        <span className="ml-auto text-zinc-400">{progressPct}%</span>
                    </div>
                </div>
            )}

            {/* Completion state */}
            {isComplete && !isFailed && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Pipeline completed</span>
                </div>
            )}

            {/* Failed state */}
            {isFailed && (
                <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 space-y-1">
                    <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Pipeline failed</span>
                    </div>
                    {errorMessage && (
                        <p className="text-xs text-red-600">{errorMessage}</p>
                    )}
                </div>
            )}

            {/* Pending/no progress yet */}
            {!progress && !isComplete && (
                <p className="text-sm text-zinc-500 animate-pulse">Starting pipeline...</p>
            )}
        </div>
    )
}
