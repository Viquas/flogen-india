'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { setActivePromptVersion } from './actions'
import type { PromptVersionRow } from './types'

const PROMPT_DISPLAY_NAMES: Record<string, string> = {
    system: 'System Prompt',
    revision: 'Revision Prompt',
}

function VersionRow({
    version,
    onSetActive,
}: {
    version: PromptVersionRow
    onSetActive: (name: string, versionId: string) => void
}) {
    const [isPending, startTransition] = useTransition()

    return (
        <div
            className={`flex items-center gap-4 px-4 py-3 border-b last:border-b-0 ${
                version.is_active ? 'bg-green-50/50 dark:bg-green-950/20' : ''
            }`}
        >
            <div className="w-6 shrink-0">
                {version.is_active ? (
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                ) : (
                    <Circle className="size-4 text-muted-foreground" />
                )}
            </div>

            <div className="w-16 shrink-0">
                <span className="font-mono text-sm font-medium">v{version.version}</span>
            </div>

            <div className="w-24 shrink-0">
                {version.is_active ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-600">Active</Badge>
                ) : (
                    <Badge variant="secondary">Inactive</Badge>
                )}
            </div>

            <div className="flex-1 min-w-0 text-sm text-muted-foreground truncate">
                {version.change_notes || 'Initial version'}
            </div>

            <div className="w-32 shrink-0 text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
            </div>

            <div className="w-28 shrink-0 flex justify-end">
                {!version.is_active && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                            startTransition(() => {
                                onSetActive(version.name, version.id)
                            })
                        }
                    >
                        {isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : null}
                        Set Active
                    </Button>
                )}
            </div>
        </div>
    )
}

export function PromptVersionList({
    initialVersions,
}: {
    initialVersions: Record<string, PromptVersionRow[]>
}) {
    const router = useRouter()

    async function handleSetActive(name: string, versionId: string) {
        const result = await setActivePromptVersion(name, versionId)
        if (result.success) {
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            {Object.entries(initialVersions).map(([name, versions]) => (
                <Card key={name}>
                    <CardHeader>
                        <CardTitle>{PROMPT_DISPLAY_NAMES[name] || name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Table Header */}
                        <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="w-6" />
                            <div className="w-16">Version</div>
                            <div className="w-24">Status</div>
                            <div className="flex-1 min-w-0">Change Notes</div>
                            <div className="w-32">Created</div>
                            <div className="w-28 text-right">Actions</div>
                        </div>

                        {/* Version Rows */}
                        {versions.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                                No versions found. Versions will be created automatically on first generation.
                            </div>
                        ) : (
                            versions.map((version) => (
                                <VersionRow
                                    key={version.id}
                                    version={version}
                                    onSetActive={handleSetActive}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
