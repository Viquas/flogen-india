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
    designLanguageId?: string
    onRunStart?: (runId: string) => void
    renderBeforeGenerate?: React.ReactNode
}

export function AutopilotButton({
    query,
    location,
    industry,
    entries,
    templateId,
    designLanguageId,
    onRunStart,
    renderBeforeGenerate,
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
            designLanguageId: designLanguageId || undefined,
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
            {/* Action row: Stop All (left) | active badge | Generate Websites (right) */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStop}
                    disabled={isStopping}
                    className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    {isStopping ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <Square className="h-3 w-3" />
                    )}
                    Stop All
                </Button>

                {activeRunCount > 0 && (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[10px] h-5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {activeRunCount} active
                    </Badge>
                )}

                <div className="flex-1" />

                {renderBeforeGenerate}

                <Button
                    size="sm"
                    onClick={handleStart}
                    disabled={isStarting || !isReady}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 h-8 text-xs px-4"
                >
                    {isStarting ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Rocket className="h-3 w-3" />
                            Generate Websites
                        </>
                    )}
                </Button>
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
