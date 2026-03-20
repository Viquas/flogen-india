"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { DiscoverySearch } from "./discovery-search"

interface NewBatchDialogProps {
    onAutopilotStart?: (runId: string) => void
}

export function NewBatchDialog({ onAutopilotStart }: NewBatchDialogProps) {
    const [open, setOpen] = useState(false)

    const handleAutopilotStart = (runId: string) => {
        onAutopilotStart?.(runId)
        setOpen(false)
    }

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
            >
                <Plus className="h-4 w-4" />
                New Batch
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Discovery Engine</DialogTitle>
                        <DialogDescription>
                            Find businesses on Google Maps and auto-generate websites
                        </DialogDescription>
                    </DialogHeader>
                    <DiscoverySearch
                        embedded
                        onAutopilotStart={handleAutopilotStart}
                        onClose={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
