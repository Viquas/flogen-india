"use client"

import { useState, useMemo, useEffect } from "react"
import {
    ChevronDown,
    Search,
    Layout,
    Calendar,
    Filter,
    Users
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { format, isToday, isYesterday } from "date-fns"

interface HistorySidebarProps {
    isOpen: boolean
    onClose: () => void
    onSelectProject: (project: any) => void
    activeProjectId: string | null
    projectHistory?: any[]
    batches?: Array<{ id: string; label: string; assignedTo?: string }>
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d")
}

function getDateKey(timestamp: string): string {
    const date = new Date(timestamp)
    return format(date, "yyyy-MM-dd")
}

export function HistorySidebar({
    isOpen,
    onClose,
    onSelectProject,
    activeProjectId,
    projectHistory = [],
    batches = [],
}: HistorySidebarProps) {
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
    const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)

    // Extract unique dates from project history (sorted newest first)
    const historyDates = useMemo(() => {
        const dateSet = new Set<string>()
        projectHistory.forEach(t => {
            if (t.date || t.timestamp) {
                dateSet.add(getDateKey(t.date || t.timestamp))
            }
        })
        return Array.from(dateSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    }, [projectHistory])

    const todayKey = format(new Date(), "yyyy-MM-dd")
    const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey)

    useEffect(() => {
        if (historyDates.length > 0 && !historyDates.includes(selectedDateKey)) {
            setSelectedDateKey(historyDates[0])
        }
    }, [historyDates, selectedDateKey])

    // Get batch IDs assigned to selected assignee
    const assigneeBatchIds = useMemo(() => {
        if (!selectedAssignee) return null
        return new Set(
            batches
                .filter(b => b.assignedTo === selectedAssignee)
                .map(b => b.id)
        )
    }, [batches, selectedAssignee])

    // Filter projects by date, batch, and assignee
    const filteredProjects = useMemo(() => {
        return projectHistory
            .filter(p => {
                const ts = p.date || p.timestamp
                if (!ts) return false
                if (getDateKey(ts) !== selectedDateKey) return false
                if (selectedBatchId && p.batch_id !== selectedBatchId) return false
                if (assigneeBatchIds && (!p.batch_id || !assigneeBatchIds.has(p.batch_id))) return false
                return true
            })
            .sort((a, b) => new Date(b.date || b.timestamp).getTime() - new Date(a.date || a.timestamp).getTime())
    }, [projectHistory, selectedDateKey, selectedBatchId, assigneeBatchIds])

    // Derive unique assignees from batches
    const assignees = useMemo(() => {
        const names = new Set<string>()
        batches.forEach(b => {
            if (b.assignedTo) names.add(b.assignedTo)
        })
        return Array.from(names).sort()
    }, [batches])

    // Selected batch label
    const selectedBatchLabel = useMemo(() => {
        if (!selectedBatchId) return "All Batches"
        const batch = batches.find(b => b.id === selectedBatchId)
        return batch?.label || selectedBatchId.slice(0, 8)
    }, [selectedBatchId, batches])

    if (!isOpen) return null

    return (
        <div className="w-64 border-r border-gray-200 h-full bg-white flex flex-col animate-in slide-in-from-left duration-300">
            {/* Date Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                                {formatDateLabel(selectedDateKey)}
                                <ChevronDown className="h-3 w-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
                            {historyDates.length > 0 ? (
                                historyDates.map(dateKey => (
                                    <DropdownMenuItem
                                        key={dateKey}
                                        onClick={() => setSelectedDateKey(dateKey)}
                                        className={selectedDateKey === dateKey ? 'bg-purple-50 text-purple-700' : ''}
                                    >
                                        {formatDateLabel(dateKey)}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>No dates available</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <span className="text-[10px] text-gray-400 tabular-nums">
                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Filter Section */}
            <div className="px-3 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {/* Batch filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors truncate">
                                <Filter className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{selectedBatchLabel}</span>
                                <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0 ml-auto" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-64 overflow-auto w-48">
                            <DropdownMenuItem
                                onClick={() => setSelectedBatchId(null)}
                                className={!selectedBatchId ? 'bg-purple-50 text-purple-700' : ''}
                            >
                                All Batches
                            </DropdownMenuItem>
                            {batches.map(batch => (
                                <DropdownMenuItem
                                    key={batch.id}
                                    onClick={() => setSelectedBatchId(batch.id)}
                                    className={selectedBatchId === batch.id ? 'bg-purple-50 text-purple-700' : ''}
                                >
                                    <span className="truncate">{batch.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Assignee filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors whitespace-nowrap">
                                <Users className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span>{selectedAssignee || "Everyone"}</span>
                                <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                                onClick={() => setSelectedAssignee(null)}
                                className={!selectedAssignee ? 'bg-purple-50 text-purple-700' : ''}
                            >
                                Everyone
                            </DropdownMenuItem>
                            {assignees.map(name => (
                                <DropdownMenuItem
                                    key={name}
                                    onClick={() => setSelectedAssignee(name)}
                                    className={selectedAssignee === name ? 'bg-purple-50 text-purple-700' : ''}
                                >
                                    {name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto project-list-scrollbar">
                {filteredProjects.length > 0 ? (
                    <div className="flex flex-col">
                        {filteredProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => onSelectProject(project)}
                                className={`flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-100/50 group hover:bg-gray-50 ${activeProjectId === project.id ? 'bg-purple-50/50 border-l-2 border-l-purple-500' : ''}`}
                            >
                                <div className={`p-1.5 rounded-md transition-colors ${activeProjectId === project.id ? 'bg-purple-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                    <Layout className={`h-3 w-3 ${activeProjectId === project.id ? 'text-purple-600' : 'text-gray-500'}`} />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[13px] font-medium truncate text-gray-900">{project.name}</span>
                                        {project.status === 'generating' && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" title="Generating" />}
                                        {project.status === 'error' && <div className="h-1.5 w-1.5 rounded-full bg-red-500" title="Error" />}
                                        {project.status === 'review' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Review" />}
                                        {project.status === 'approved' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Approved" />}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{project.industry}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(project.date || project.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                            <Search className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400">No projects found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
