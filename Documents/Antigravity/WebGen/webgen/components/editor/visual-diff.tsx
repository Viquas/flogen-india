"use client"

import { useMemo } from "react"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"

interface VisualDiffProps {
    older: string
    newer: string
}

export function VisualDiff({ older, newer }: VisualDiffProps) {
    const olderHtml = useMemo(
        () => (older ? constructHtmlBoilerplate(older) : ""),
        [older]
    )
    const newerHtml = useMemo(
        () => (newer ? constructHtmlBoilerplate(newer) : ""),
        [newer]
    )

    return (
        <div className="flex gap-4 h-full">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 px-2 py-1.5">
                    Before
                </div>
                <iframe
                    srcDoc={olderHtml}
                    sandbox="allow-scripts"
                    className="w-full flex-1 border rounded-lg bg-white"
                    title="Older version preview"
                />
            </div>
            <div className="w-px bg-zinc-200 self-stretch" />
            <div className="flex-1 flex flex-col min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 px-2 py-1.5">
                    After
                </div>
                <iframe
                    srcDoc={newerHtml}
                    sandbox="allow-scripts"
                    className="w-full flex-1 border rounded-lg bg-white"
                    title="Newer version preview"
                />
            </div>
        </div>
    )
}
