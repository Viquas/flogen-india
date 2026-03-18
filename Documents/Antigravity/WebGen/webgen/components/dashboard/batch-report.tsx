"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle2,
    Wrench,
    AlertTriangle,
    XCircle,
    ChevronDown,
    ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ErrorType } from "@/lib/ai/error-classifier"

interface BatchReportProps {
    runId: string
}

interface ProjectRow {
    id: string
    status: string
    quality_score: number | null
    error_type: string | null
    error_details: string | null
    business_data: { businessName?: string; [key: string]: unknown }
}

type Category = "success" | "fixed" | "needs_review" | "failed"

const ERROR_TYPE_LABELS: Record<string, string> = {
    [ErrorType.SYNTAX_ERROR]: "Syntax Error",
    [ErrorType.RENDER_ERROR]: "Render Error",
    [ErrorType.MISSING_SECTIONS]: "Missing Sections",
    [ErrorType.STYLE_ISSUES]: "Style Issues",
    [ErrorType.DATA_MAPPING]: "Data Mapping",
    [ErrorType.TIMEOUT]: "Timeout",
    [ErrorType.UNKNOWN]: "Unknown",
}

function categorizeProjects(projects: ProjectRow[]): Record<Category, ProjectRow[]> {
    const result: Record<Category, ProjectRow[]> = {
        success: [],
        fixed: [],
        needs_review: [],
        failed: [],
    }

    for (const p of projects) {
        if (p.status === "error") {
            result.failed.push(p)
        } else if (
            (p.status === "review" || p.status === "approved") &&
            p.error_type
        ) {
            // Had an error but was fixed (error_type set but no longer in error status)
            result.fixed.push(p)
        } else if (
            p.status === "review" &&
            p.quality_score != null &&
            p.quality_score < 50
        ) {
            result.needs_review.push(p)
        } else if (p.status === "review" || p.status === "approved") {
            result.success.push(p)
        }
    }

    return result
}

function groupByErrorType(projects: ProjectRow[]): Map<string, ProjectRow[]> {
    const groups = new Map<string, ProjectRow[]>()
    for (const p of projects) {
        const key = p.error_type || "unknown"
        const existing = groups.get(key) || []
        existing.push(p)
        groups.set(key, existing)
    }
    return groups
}

function ErrorTypeGroup({ errorType, projects }: { errorType: string; projects: ProjectRow[] }) {
    const [expanded, setExpanded] = useState(false)
    const label = ERROR_TYPE_LABELS[errorType] || errorType

    return (
        <div className="border border-red-100 rounded-md overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-red-50/50 hover:bg-red-50 transition-colors text-sm"
            >
                <span className="font-medium text-red-700">
                    {label} ({projects.length})
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-red-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
            </button>
            {expanded && (
                <div className="divide-y divide-red-50">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="px-3 py-2 flex items-start justify-between gap-2 text-sm"
                        >
                            <div className="min-w-0">
                                <p className="font-medium text-zinc-700 truncate">
                                    {p.business_data?.businessName || "Unnamed Project"}
                                </p>
                                {p.error_details && (
                                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                        {p.error_details.length > 100
                                            ? p.error_details.slice(0, 100) + "..."
                                            : p.error_details}
                                    </p>
                                )}
                            </div>
                            <a
                                href={`/editor?id=${p.id}`}
                                className="shrink-0 text-blue-600 hover:text-blue-800 p-1"
                                title="Open in editor"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function BatchReport({ runId }: BatchReportProps) {
    const [projects, setProjects] = useState<ProjectRow[] | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function loadProjects() {
            try {
                // First get the batch_id for this run
                const supabase = createClient()

                const { data: run } = await supabase
                    .from("batch_runs")
                    .select("batch_id")
                    .eq("id", runId)
                    .single()

                if (cancelled || !run?.batch_id) {
                    if (!cancelled) setLoading(false)
                    return
                }

                const { data } = await supabase
                    .from("projects")
                    .select("id, status, quality_score, error_type, error_details, business_data")
                    .eq("batch_id", run.batch_id)
                    .order("created_at", { ascending: false })

                if (!cancelled) {
                    setProjects((data as unknown as ProjectRow[]) ?? [])
                    setLoading(false)
                }
            } catch {
                if (!cancelled) setLoading(false)
            }
        }

        loadProjects()
        return () => { cancelled = true }
    }, [runId])

    if (loading) {
        return (
            <div className="rounded-lg border border-zinc-200 p-4">
                <p className="text-sm text-zinc-500 animate-pulse">Loading report...</p>
            </div>
        )
    }

    if (!projects || projects.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-200 p-4">
                <p className="text-sm text-zinc-500">No projects found for this run.</p>
            </div>
        )
    }

    const categories = categorizeProjects(projects)
    const failedGroups = groupByErrorType(categories.failed)

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-800">Batch Report</h4>

            {/* Category badges */}
            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1.5 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                    {categories.success.length} Success
                </Badge>
                <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                    <Wrench className="h-3 w-3" />
                    {categories.fixed.length} Fixed
                </Badge>
                <Badge variant="secondary" className="gap-1.5 bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertTriangle className="h-3 w-3" />
                    {categories.needs_review.length} Needs Review
                </Badge>
                <Badge variant="secondary" className="gap-1.5 bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3" />
                    {categories.failed.length} Failed
                </Badge>
            </div>

            {/* Failed projects grouped by error type */}
            {categories.failed.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Failures by Error Type
                    </p>
                    {Array.from(failedGroups.entries()).map(([errorType, projs]) => (
                        <ErrorTypeGroup
                            key={errorType}
                            errorType={errorType}
                            projects={projs}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">All projects generated successfully</span>
                </div>
            )}
        </div>
    )
}
