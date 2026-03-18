"use client"

import { useState, useEffect } from "react"
import { getProjectRevisions } from "@/app/dashboard/actions"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

interface Revision {
    id: string
    version: number
    generated_code: string | null
    created_at: string
    status?: string
}

interface RevisionListProps {
    projectId: string
    currentCode: string | null
    currentVersion: number
    onSelectPair: (
        older: { code: string; label: string },
        newer: { code: string; label: string }
    ) => void
}

export function RevisionList({
    projectId,
    currentCode,
    currentVersion,
    onSelectPair,
}: RevisionListProps) {
    const [revisions, setRevisions] = useState<Revision[]>([])
    const [loading, setLoading] = useState(true)
    const [newerIdx, setNewerIdx] = useState<number | null>(null)
    const [olderIdx, setOlderIdx] = useState<number | null>(null)

    // Build list: current version at top + fetched revisions
    const allRevisions: Revision[] = [
        {
            id: "current",
            version: currentVersion,
            generated_code: currentCode,
            created_at: new Date().toISOString(),
            status: "current",
        },
        ...revisions,
    ]

    // Fetch revisions on mount or projectId change
    useEffect(() => {
        setNewerIdx(null)
        setOlderIdx(null)
        setRevisions([])
        setLoading(true)

        let cancelled = false
        getProjectRevisions(projectId).then((result) => {
            if (cancelled) return
            if (result.success && result.data) {
                setRevisions(result.data as Revision[])
            }
            setLoading(false)
        })
        return () => {
            cancelled = true
        }
    }, [projectId])

    // Auto-select current + previous on load
    useEffect(() => {
        if (loading || allRevisions.length < 2) return
        if (newerIdx !== null || olderIdx !== null) return

        // Select current (index 0) as newer and next (index 1) as older
        setNewerIdx(0)
        setOlderIdx(1)
        const newer = allRevisions[0]
        const older = allRevisions[1]
        onSelectPair(
            {
                code: older.generated_code || "",
                label: older.status === "current"
                    ? `v${older.version} - Current`
                    : `v${older.version} - ${format(new Date(older.created_at), "MMM d, HH:mm")}`,
            },
            {
                code: newer.generated_code || "",
                label: newer.status === "current"
                    ? `v${newer.version} - Current`
                    : `v${newer.version} - ${format(new Date(newer.created_at), "MMM d, HH:mm")}`,
            }
        )
    }, [loading, revisions.length])

    const handleClick = (idx: number) => {
        let newNewer = newerIdx
        let newOlder = olderIdx

        if (newerIdx === null) {
            // First click: select as newer
            newNewer = idx
            setNewerIdx(idx)
        } else if (olderIdx === null) {
            // Second click: select as older
            if (idx === newerIdx) return // Can't select same
            newOlder = idx
            setOlderIdx(idx)
        } else {
            // Both selected: start new selection with this as newer
            newNewer = idx
            newOlder = null
            setNewerIdx(idx)
            setOlderIdx(null)
            return // Wait for second click
        }

        // Emit pair when both are selected
        if (newNewer !== null && newOlder !== null) {
            const newer = allRevisions[newNewer]
            const older = allRevisions[newOlder]
            onSelectPair(
                {
                    code: older.generated_code || "",
                    label: older.status === "current"
                        ? `v${older.version} - Current`
                        : `v${older.version} - ${format(new Date(older.created_at), "MMM d, HH:mm")}`,
                },
                {
                    code: newer.generated_code || "",
                    label: newer.status === "current"
                        ? `v${newer.version} - Current`
                        : `v${newer.version} - ${format(new Date(newer.created_at), "MMM d, HH:mm")}`,
                }
            )
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
        )
    }

    if (allRevisions.length <= 1) {
        return (
            <div className="p-4 text-sm text-zinc-400 text-center">
                No previous revisions to compare
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 mb-1">
                Revisions ({allRevisions.length})
            </div>
            {allRevisions.map((rev, idx) => {
                const isNewer = newerIdx === idx
                const isOlder = olderIdx === idx
                return (
                    <button
                        key={rev.id}
                        onClick={() => handleClick(idx)}
                        className={`bg-white hover:bg-zinc-50 border rounded-lg p-3 w-full text-left transition-all ${
                            isNewer
                                ? "border-l-4 border-l-blue-500 border-t border-r border-b border-zinc-200"
                                : isOlder
                                ? "border-l-4 border-l-orange-500 border-t border-r border-b border-zinc-200"
                                : "border-zinc-200"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-900">
                                v{rev.version}
                            </span>
                            {isNewer && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
                                    Newer
                                </span>
                            )}
                            {isOlder && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500">
                                    Older
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                            {rev.status === "current"
                                ? "Current version"
                                : format(new Date(rev.created_at), "MMM d, HH:mm")}
                        </div>
                        {rev.status && rev.status !== "current" && (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">
                                {rev.status}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
