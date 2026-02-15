"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ExternalLink, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

// Define a local type until we generate full DB types
interface Project {
    id: string
    business_data: any
    status: string // simplified for compatibility
    created_at: string
    thumbnail_url?: string | null
}

const statusMap: Record<string, { icon: any, color: string, label: string }> = {
    queued: { icon: Clock, color: "text-yellow-500", label: "Queued" },
    generating: { icon: Loader2, color: "text-blue-500 animate-spin", label: "Generating" },
    review: { icon: AlertCircle, color: "text-purple-500", label: "Review" },
    approved: { icon: CheckCircle, color: "text-green-500", label: "Approved" },
    deployed: { icon: ExternalLink, color: "text-green-600", label: "Deployed" },
    error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
}

interface ProjectCardProps {
    project: Project
    isSelected?: boolean
    onSelect?: (id: string, selected: boolean) => void
}

export function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
    const statusConfig = statusMap[project.status] || statusMap.queued
    const Icon = statusConfig.icon

    return (
        <div className={`group relative flex flex-col justify-between rounded-lg border p-6 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
            {onSelect && (
                <div className="absolute top-4 right-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(project.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className={`flex items-center text-sm font-medium ${statusConfig.color}`}>
                        <Icon className="mr-2 h-4 w-4" />
                        {statusConfig.label}
                    </span>
                    <span className="text-xs text-muted-foreground mr-6">
                        {format(new Date(project.created_at), "MMM d, yyyy • h:mm a")}
                    </span>
                </div>
                <h3 className="font-bold text-lg">
                    {project.business_data?.business_name || project.business_data?.businessName || "Untitled Project"}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.business_data?.description}
                </p>
                <div className="flex gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {project.business_data?.industry}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <Link
                    href={`/editor?id=${project.id}`}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Open Workbench
                </Link>
            </div>

            {/* Optional Thumbnail Container */}
            {project.thumbnail_url && (
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-md bg-muted">
                    {/* <img src={project.thumbnail_url} alt="Preview" className="h-full w-full object-cover" /> */}
                </div>
            )}
        </div>
    )
}
