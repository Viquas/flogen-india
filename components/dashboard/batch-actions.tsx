"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Square, RefreshCw, Rocket, Trash2 } from 'lucide-react'

interface BatchActionsProps {
    selectedCount: number
    totalCount: number
    onSelectAll: () => void
    onDeselectAll: () => void
    onRegenerateSelected: () => void
    onDeploySelected: () => void
    isProcessing?: boolean
}

export function BatchActions({
    selectedCount,
    totalCount,
    onSelectAll,
    onDeselectAll,
    onRegenerateSelected,
    onDeploySelected,
    isProcessing,
}: BatchActionsProps) {
    const allSelected = selectedCount === totalCount && totalCount > 0
    const someSelected = selectedCount > 0

    return (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={allSelected ? onDeselectAll : onSelectAll}
                    className="gap-2"
                >
                    {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                    ) : (
                        <Square className="h-4 w-4" />
                    )}
                    {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
                {someSelected && (
                    <Badge variant="secondary">
                        {selectedCount} selected
                    </Badge>
                )}
            </div>

            {someSelected && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRegenerateSelected}
                        disabled={isProcessing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        Regenerate
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onDeploySelected}
                        disabled={isProcessing}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Rocket className="h-4 w-4" />
                        Deploy
                    </Button>
                </div>
            )}
        </div>
    )
}
