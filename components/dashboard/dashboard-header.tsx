"use client"

import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewBatchDialog } from "./new-batch-dialog"
import { CustomBuildDialog } from "./custom-build-dialog"
import { BulkUploadDialog } from "./bulk-upload-dialog"
import { ActiveBatchStatusBar } from "./active-batch-status-bar"
import { getActiveAutopilotRuns } from "@/app/(admin)/dashboard/actions"

interface DashboardHeaderProps {
    greeting: string
}

export function DashboardHeader({ greeting }: DashboardHeaderProps) {
    const [activeRunId, setActiveRunId] = useState<string | null>(null)
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

    // Restore active run state on mount (handles page refresh during active batch)
    useEffect(() => {
        let cancelled = false
        async function checkActive() {
            try {
                const runs = await getActiveAutopilotRuns()
                if (!cancelled && runs.length > 0) {
                    setActiveRunId(runs[0].id)
                }
            } catch {
                // Ignore
            }
        }
        checkActive()
        return () => { cancelled = true }
    }, [])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{greeting}</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkUploadOpen(true)}>
                        <Upload className="h-4 w-4" />
                        Bulk Upload
                    </Button>
                    <CustomBuildDialog />
                    <NewBatchDialog onAutopilotStart={(runId) => setActiveRunId(runId)} />
                </div>
            </div>

            {activeRunId && (
                <ActiveBatchStatusBar
                    runId={activeRunId}
                    onDismiss={() => setActiveRunId(null)}
                />
            )}

            <BulkUploadDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} />
        </div>
    )
}
