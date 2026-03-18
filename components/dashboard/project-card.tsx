"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ExternalLink, Clock, CheckCircle, AlertCircle, Loader2, RefreshCcw, Wrench } from "lucide-react"
import React, { useState, useEffect } from "react"
import { regenerateProject, fixWebsiteErrors } from "@/app/(admin)/dashboard/actions"
import { createClient } from "@/lib/supabase/client"

interface Project {
    id: string
    business_data: any
    status: string
    created_at: string
    thumbnail_url?: string | null
    generated_code?: string
    generation_phase?: string | null
    quality_score?: number | null
}

const statusMap: Record<string, { icon: any, color: string, label: string, badgeColor: string }> = {
    queued: { icon: Clock, color: "text-zinc-500", label: "Queued", badgeColor: "bg-zinc-100 text-zinc-600 border-zinc-200" },
    generating: { icon: Loader2, color: "text-blue-600 animate-spin", label: "Generating", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    review: { icon: AlertCircle, color: "text-amber-500", label: "Review", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { icon: CheckCircle, color: "text-emerald-500", label: "Approved", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    deployed: { icon: ExternalLink, color: "text-violet-600", label: "Deployed", badgeColor: "bg-violet-50 text-violet-700 border-violet-200" },
    error: { icon: AlertCircle, color: "text-red-500", label: "Error", badgeColor: "bg-red-50 text-red-700 border-red-200" },
}

interface ProjectCardProps {
    project: Project
    isSelected?: boolean
    isFocused?: boolean
    onSelect?: (id: string, selected: boolean) => void
    cardRef?: React.Ref<HTMLDivElement>
}

export function ProjectCard({ project, isSelected, isFocused, onSelect, cardRef }: ProjectCardProps) {
    const statusConfig = statusMap[project.status] || statusMap.queued
    const Icon = statusConfig.icon
    const [isLoading, setIsLoading] = useState(false)
    const [livePhase, setLivePhase] = useState<string | null>(project.generation_phase || null)

    useEffect(() => {
        // Only subscribe if we are in generating state or queued state
        if (project.status !== 'generating' && project.status !== 'queued') return;

        const supabase = createClient();

        const channel = supabase.channel(`project_${project.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'projects',
                    filter: `id=eq.${project.id}`
                },
                (payload) => {
                    if (payload.new && 'generation_phase' in payload.new) {
                        setLivePhase(payload.new.generation_phase)
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [project.id, project.status]);

    const handleAction = async (e: React.MouseEvent, action: 'retry' | 'fix') => {
        e.preventDefault()
        e.stopPropagation()
        if (isLoading) return

        setIsLoading(true)
        try {
            if (action === 'retry') {
                await regenerateProject(project.id)
            } else if (action === 'fix') {
                await fixWebsiteErrors(project.id)
            }
        } catch (error) {
            console.error('Action failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            ref={cardRef}
            data-project-id={project.id}
            className={`group relative flex flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition-all duration-200 ${
                isSelected
                    ? 'ring-2 ring-primary border-primary'
                    : isFocused
                        ? 'ring-2 ring-blue-500 border-blue-400'
                        : 'border-border hover:border-zinc-300'
            }`}
        >
            {onSelect && (
                <div className="absolute top-4 right-4 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(project.id, e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.badgeColor}`}>
                            <Icon className={`h-3.5 w-3.5 ${project.status === 'generating' || project.status === 'queued' && livePhase ? 'animate-spin' : ''}`} />
                            {(project.status === 'generating' || project.status === 'queued') && livePhase
                                ? livePhase.replace(/\.\.\.$/, '').replace(/\.\.\.$/, '')
                                : statusConfig.label}
                        </span>
                        {project.quality_score != null && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                                project.quality_score >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : project.quality_score >= 50
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                Q: {project.quality_score}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {format(new Date(project.created_at), "MMM d")}
                    </span>
                </div>

                <div>
                    <h3 className="font-semibold text-base text-foreground leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {project.business_data?.business_name || project.business_data?.businessName || project.business_data?.brandIdentity?.core?.brandName || "Untitled Project"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
                        {project.business_data?.description || "No description provided."}
                    </p>
                </div>

                <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground border border-border">
                        {project.business_data?.industry || project.business_data?.brandIdentity?.vibe?.industry || "General"}
                    </span>
                </div>

                {project.status === 'generating' && livePhase && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-primary">{livePhase}</span>
                            <span className="text-muted-foreground capitalize">running job</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-full animate-[progress_2s_ease-in-out_infinite] origin-left rounded-full" />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-5 flex items-center gap-2">
                <Link
                    href={`/editor?id=${project.id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border bg-white text-foreground hover:bg-zinc-50 shadow-sm h-8 px-4 py-2"
                >
                    Open
                </Link>

                {project.status === 'error' && (
                    <button
                        onClick={(e) => handleAction(e, 'retry')}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 h-9 w-9 text-zinc-600"
                        title="Retry Generation"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </button>
                )}

                {(project.status === 'review' || project.status === 'error') && (
                    <button
                        onClick={(e) => handleAction(e, 'fix')}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 h-9 w-9 text-zinc-600"
                        title="Auto-Fix Errors"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {project.thumbnail_url && (
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-md bg-muted" />
            )}
        </div>
    )
}
