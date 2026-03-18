"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Loader2, AlertTriangle, Square } from "lucide-react"
import { runAutopilot, getActiveAutopilotRuns, stopAllQueuedProcesses } from "@/app/(admin)/dashboard/actions"
import type { BatchRunConfig } from "@/lib/autopilot-types"

interface AutopilotButtonProps {
    query: string
    location: string
    industry: string
    entries: number
    templateId?: string
    onRunStart?: (runId: string) => void
}

export function AutopilotButton({
    query,
    location,
    industry,
    entries,
    templateId,
    onRunStart,
}: AutopilotButtonProps) {
    const [isStarting, setIsStarting] = useState(false)
    const [isStopping, setIsStopping] = useState(false)
    const [activeRunCount, setActiveRunCount] = useState(0)
    const [autoFixEnabled, setAutoFixEnabled] = useState(true)
    const [qualityThreshold, setQualityThreshold] = useState(100)
    const [error, setError] = useState<string | null>(null)
    const [stopResult, setStopResult] = useState<string | null>(null)

    // Check for active runs on mount
    useEffect(() => {
        let cancelled = false
        async function checkActive() {
            try {
                const runs = await getActiveAutopilotRuns()
                if (!cancelled) {
                    setActiveRunCount(runs.length)
                }
            } catch {
                // Ignore - non-critical
            }
        }
        checkActive()
        return () => { cancelled = true }
    }, [])

    const isReady = !!(query.trim() || industry.trim())

    const handleStart = async () => {
        setIsStarting(true)
        setError(null)
        setStopResult(null)

        const config: BatchRunConfig = {
            query: query.trim() || industry.trim(),
            location: location.trim(),
            industry: industry.trim(),
            entries,
            templateId: templateId || undefined,
            autoFixEnabled,
            qualityThreshold,
        }

        try {
            const result = await runAutopilot(config)
            if (result.success && result.runId) {
                onRunStart?.(result.runId)
            } else {
                setError(result.error || "Failed to start autopilot")
                setIsStarting(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start autopilot")
            setIsStarting(false)
        }
    }

    const handleStop = async () => {
        setIsStopping(true)
        setStopResult(null)
        try {
            const result = await stopAllQueuedProcesses()
            if (result.success) {
                setStopResult(`Stopped ${result.cancelledJobs} jobs, ${result.stoppedRuns} runs`)
                setActiveRunCount(0)
                setIsStarting(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to stop")
        } finally {
            setIsStopping(false)
        }
    }

    return (
        <div className="space-y-2">
            {/* Horizontal bar: config left, actions right */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Config options */}
                <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={autoFixEnabled}
                            onChange={(e) => setAutoFixEnabled(e.target.checked)}
                            className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                        />
                        <span className="text-zinc-500">Auto-fix</span>
                    </label>

                    {autoFixEnabled && (
                        <label className="flex items-center gap-1">
                            <span className="text-zinc-400">Quality:</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={qualityThreshold}
                                onChange={(e) => setQualityThreshold(Math.min(100, Math.max(0, Number(e.target.value))))}
                                className="w-12 h-6 px-1.5 rounded border border-zinc-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </label>
                    )}

                    {activeRunCount > 0 && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[10px] h-5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {activeRunCount} active
                        </Badge>
                    )}
                </div>

                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStop}
                        disabled={isStopping}
                        className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        {isStopping ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Square className="h-3 w-3" />
                        )}
                        Stop All
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleStart}
                        disabled={isStarting || !isReady}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 h-7 text-xs px-3"
                    >
                        {isStarting ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Rocket className="h-3 w-3" />
                                Run Autopilot
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Inline feedback */}
            {(stopResult || error) && (
                <p className={`text-[11px] ${stopResult ? "text-green-600" : "text-red-600"}`}>
                    {stopResult || error}
                </p>
            )}
        </div>
    )
}
