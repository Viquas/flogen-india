"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Loader2, AlertTriangle } from "lucide-react"
import { runAutopilot, getActiveAutopilotRuns } from "@/app/dashboard/actions"
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
    const [activeRunCount, setActiveRunCount] = useState(0)
    const [autoFixEnabled, setAutoFixEnabled] = useState(true)
    const [qualityThreshold, setQualityThreshold] = useState(50)
    const [error, setError] = useState<string | null>(null)

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

    return (
        <div className="flex flex-col gap-2">
            {/* Config options */}
            <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={autoFixEnabled}
                        onChange={(e) => setAutoFixEnabled(e.target.checked)}
                        className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-zinc-600">Auto-fix errors</span>
                </label>

                {autoFixEnabled && (
                    <label className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Quality:</span>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={qualityThreshold}
                            onChange={(e) => setQualityThreshold(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-14 h-7 px-2 rounded border border-zinc-200 text-sm text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                    </label>
                )}
            </div>

            {/* Active run warning */}
            {activeRunCount > 0 && (
                <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {activeRunCount} run{activeRunCount > 1 ? "s" : ""} active
                    </Badge>
                </div>
            )}

            {/* Start button */}
            <Button
                onClick={handleStart}
                disabled={isStarting || !isReady}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-10 px-5"
            >
                {isStarting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running...
                    </>
                ) : (
                    <>
                        <Rocket className="h-4 w-4" />
                        Run Autopilot
                    </>
                )}
            </Button>

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-600">{error}</p>
            )}
        </div>
    )
}
