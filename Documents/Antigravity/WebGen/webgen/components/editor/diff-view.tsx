"use client"

import { useState } from "react"
import { DiffEditor } from "@monaco-editor/react"
import { RevisionList } from "@/components/editor/revision-list"
import { VisualDiff } from "@/components/editor/visual-diff"

interface DiffViewProps {
    projectId: string
    currentCode: string | null
    currentVersion: number
}

export function DiffView({ projectId, currentCode, currentVersion }: DiffViewProps) {
    const [olderCode, setOlderCode] = useState("")
    const [newerCode, setNewerCode] = useState("")
    const [olderLabel, setOlderLabel] = useState("")
    const [newerLabel, setNewerLabel] = useState("")
    const [showVisualDiff, setShowVisualDiff] = useState(false)

    const handleSelectPair = (
        older: { code: string; label: string },
        newer: { code: string; label: string }
    ) => {
        setOlderCode(older.code)
        setOlderLabel(older.label)
        setNewerCode(newer.code)
        setNewerLabel(newer.label)
    }

    const hasCode = olderCode || newerCode

    return (
        <div className="h-full flex">
            {/* Left sidebar - Revision list */}
            <div className="w-[280px] border-r border-zinc-200 bg-white overflow-y-auto flex-shrink-0">
                <RevisionList
                    projectId={projectId}
                    currentCode={currentCode}
                    currentVersion={currentVersion}
                    onSelectPair={handleSelectPair}
                />
            </div>

            {/* Right main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Sub-tabs + labels */}
                <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-zinc-200">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/50">
                            <button
                                onClick={() => setShowVisualDiff(false)}
                                className={`h-7 text-xs px-3 rounded-md transition-all font-medium ${
                                    !showVisualDiff
                                        ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                                        : "text-zinc-500 hover:text-zinc-700"
                                }`}
                            >
                                Code Diff
                            </button>
                            <button
                                onClick={() => setShowVisualDiff(true)}
                                className={`h-7 text-xs px-3 rounded-md transition-all font-medium ${
                                    showVisualDiff
                                        ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                                        : "text-zinc-500 hover:text-zinc-700"
                                }`}
                            >
                                Visual Diff
                            </button>
                        </div>
                    </div>
                    {hasCode && (
                        <div className="flex items-center gap-4 text-[10px] font-medium">
                            <span className="text-orange-500">{olderLabel}</span>
                            <span className="text-zinc-300">vs</span>
                            <span className="text-blue-500">{newerLabel}</span>
                        </div>
                    )}
                </div>

                {/* Diff content */}
                <div className="flex-1 overflow-hidden">
                    {!hasCode ? (
                        <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                            Select two revisions to compare
                        </div>
                    ) : showVisualDiff ? (
                        <div className="h-full p-4">
                            <VisualDiff older={olderCode} newer={newerCode} />
                        </div>
                    ) : (
                        <DiffEditor
                            original={olderCode}
                            modified={newerCode}
                            language="typescript"
                            theme="vs"
                            height="100%"
                            options={{
                                readOnly: true,
                                renderSideBySide: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
