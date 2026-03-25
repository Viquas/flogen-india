"use client"

import { Loader2, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface RedeployDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    businessName: string
    onConfirm: () => void
    isDeploying: boolean
}

export function RedeployDialog({
    open,
    onOpenChange,
    businessName,
    onConfirm,
    isDeploying,
}: RedeployDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Deploy Changes</DialogTitle>
                    <DialogDescription>
                        Deploy changes to <span className="font-semibold text-gray-900">{businessName}</span>?
                        This will save the current code, create a version snapshot, and mark in-progress requests as completed.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeploying}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isDeploying}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {isDeploying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Rocket className="h-4 w-4" />
                        )}
                        Deploy
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
