"use client"

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, Loader2, ArrowLeft, History } from 'lucide-react'
import { getProjectRevisions, restoreProjectRevision } from '@/app/dashboard/actions'

interface Revision {
    id: string
    version: number
    created_at: string
    generated_code: string | null
}

interface RevisionHistoryProps {
    projectId: string
    currentVersion: number
    onViewDiff: (code: string | null) => void // null to exit diff view
    onRestoreComplete?: () => void
}

export function RevisionHistory({ projectId, currentVersion, onViewDiff, onRestoreComplete }: RevisionHistoryProps) {
    const [revisions, setRevisions] = useState<Revision[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [activeDiffId, setActiveDiffId] = useState<string | null>(null)

    useEffect(() => {
        const fetchRevisions = async () => {
            const res = await getProjectRevisions(projectId)
            if (res.success && res.data) {
                setRevisions(res.data)
            }
            setIsLoading(false)
        }
        fetchRevisions()
    }, [projectId, currentVersion])

    const handleViewDiff = (revision: Revision) => {
        if (activeDiffId === revision.id) {
            setActiveDiffId(null)
            onViewDiff(null)
        } else {
            setActiveDiffId(revision.id)
            onViewDiff(revision.generated_code)
        }
    }

    const handleRestore = (revisionId: string) => {
        if (!confirm('Are you sure you want to restore this version? The current version will be saved as a new revision.')) {
            return
        }

        startTransition(async () => {
            const res = await restoreProjectRevision(projectId, revisionId)
            if (res.success) {
                setActiveDiffId(null)
                onViewDiff(null)
                onRestoreComplete?.()
            } else {
                alert('Failed to restore revision: ' + res.error)
            }
        })
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card className="flex flex-col h-full border-0 rounded-none shadow-none">
            <CardHeader className="pb-2 border-b px-4 py-3 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Revision History
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    {revisions.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Clock className="h-8 w-8 opacity-20" />
                            <p>No previous versions found.</p>
                            <p className="text-xs">Revisions are created automatically when AI refines the code or when you manually regenerate.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {/* Current Version Indicator */}
                            <div className="p-4 bg-purple-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold flex items-center gap-2 text-purple-900">
                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                        Current Version (v{currentVersion})
                                    </p>
                                    <p className="text-xs text-purple-700 mt-1">Active code</p>
                                </div>
                            </div>

                            {/* Past Revisions */}
                            {revisions.map((rev) => (
                                <div key={rev.id} className={`p-4 transition-colors ${activeDiffId === rev.id ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-semibold flex items-center gap-2">
                                                Version {rev.version}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(rev.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            variant={activeDiffId === rev.id ? 'default' : 'outline'}
                                            className="h-7 text-xs flex-1"
                                            onClick={() => handleViewDiff(rev)}
                                        >
                                            {activeDiffId === rev.id ? 'Close Diff' : 'View Code Diff'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-7 text-xs shrink-0"
                                            disabled={isPending}
                                            onClick={() => handleRestore(rev.id)}
                                        >
                                            <ArrowLeft className="h-3 w-3 mr-1" />
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
