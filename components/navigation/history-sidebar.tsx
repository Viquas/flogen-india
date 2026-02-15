"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    ChevronDown,
    ArrowLeft,
    Search,
    Layout,
    FileText,
    Star,
    Calendar
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MOCK_PROJECT_HISTORY, ProjectHistoryItem, Template } from "@/lib/mock-data"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"
import { format, isToday, isYesterday, parseISO } from "date-fns"

interface HistorySidebarProps {
    isOpen: boolean
    onClose: () => void
    onSelectProject: (project: ProjectHistoryItem) => void
    activeProjectId: string | null
    savedTemplates: Template[]
}

// Helper to format date for display
function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d")
}

// Helper to get just the date part (YYYY-MM-DD) from a timestamp
function getDateKey(timestamp: string): string {
    const date = new Date(timestamp)
    return format(date, "yyyy-MM-dd")
}

export function HistorySidebar({ isOpen, onClose, onSelectProject, activeProjectId, savedTemplates }: HistorySidebarProps) {
    const [activeTab, setActiveTab] = useState<'history' | 'templates'>('templates')
    const [starFilter, setStarFilter] = useState<number | null>(null)

    // Extract unique dates from saved templates (sorted newest first)
    const uniqueDates = useMemo(() => {
        const dateSet = new Set<string>()
        savedTemplates.forEach(t => {
            if (t.timestamp) {
                dateSet.add(getDateKey(t.timestamp))
            }
        })
        return Array.from(dateSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    }, [savedTemplates])

    // Default to today's date or the first available date
    const todayKey = format(new Date(), "yyyy-MM-dd")
    const [selectedDateKey, setSelectedDateKey] = useState<string>(
        uniqueDates.includes(todayKey) ? todayKey : (uniqueDates[0] || todayKey)
    )

    // Filter templates by selected date
    const templatesForDate = useMemo(() => {
        return savedTemplates.filter(t => {
            if (!t.timestamp) return false
            return getDateKey(t.timestamp) === selectedDateKey
        })
    }, [savedTemplates, selectedDateKey])

    // Filter templates by star rating
    const filteredTemplates = useMemo(() => {
        let filtered = savedTemplates
        if (starFilter) {
            filtered = filtered.filter(t => t.rating === starFilter)
        }
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }, [savedTemplates, starFilter])

    if (!isOpen) return null

    return (
        <div className="w-64 border-r border-zinc-200 h-full bg-white flex flex-col animate-in slide-in-from-left duration-300">
            {/* Sidebar Header with Tabs */}
            <div className="border-b border-zinc-200 bg-zinc-50/50">
                <div className="flex items-center px-4 py-3 border-b border-zinc-100">
                    <span className="font-bold text-sm tracking-tight text-zinc-900">WebGen V1</span>
                </div>
                <div className="flex p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Date
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'templates' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Templates
                    </button>
                </div>
            </div>

            {activeTab === 'history' ? (
                <>
                    {/* Date Filter - Dynamic based on saved templates */}
                    <div className="p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Calendar className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
                                        {formatDateLabel(selectedDateKey)}
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
                                    {uniqueDates.length > 0 ? (
                                        uniqueDates.map(dateKey => (
                                            <DropdownMenuItem
                                                key={dateKey}
                                                onClick={() => setSelectedDateKey(dateKey)}
                                                className={selectedDateKey === dateKey ? 'bg-zinc-100' : ''}
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
                        <div className="text-[10px] text-zinc-400">
                            {templatesForDate.length} project{templatesForDate.length !== 1 ? 's' : ''} on this date
                        </div>
                    </div>

                    {/* Projects for Selected Date */}
                    <div className="flex-1 overflow-y-auto project-list-scrollbar">
                        {templatesForDate.length > 0 ? (
                            <div className="flex flex-col">
                                {templatesForDate.map((template) => {
                                    const handleViewTemplate = () => {
                                        const isFullHtml = template.code.trim().startsWith('<!DOCTYPE html>');
                                        const isBroken = isFullHtml && template.code.includes('${escapedCode}');
                                        const finalHtml = (isFullHtml && !isBroken)
                                            ? template.code
                                            : constructHtmlBoilerplate(template.code);
                                        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                    };

                                    return (
                                        <button
                                            key={template.id}
                                            onClick={handleViewTemplate}
                                            className="flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-zinc-100/50 group text-zinc-600 hover:bg-zinc-50"
                                        >
                                            <div className="p-1.5 rounded-md transition-colors bg-zinc-100 group-hover:bg-zinc-200">
                                                <Layout className="h-3 w-3 text-zinc-500" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[13px] font-medium truncate text-zinc-900">{template.name}</span>
                                                    {template.rating > 0 && (
                                                        <div className="flex items-center gap-0.5 text-yellow-500">
                                                            <Star className="h-2.5 w-2.5 fill-current" />
                                                            <span className="text-[10px] font-bold">{template.rating}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-zinc-400">
                                                    {new Date(template.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                                    <Search className="h-5 w-5 text-zinc-300" />
                                </div>
                                <p className="text-xs text-zinc-400">No projects created on this date</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Template Filters */}
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Filter by stars</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map((star) => {
                                const isSelected = starFilter === star
                                return (
                                    <button
                                        key={star}
                                        onClick={() => setStarFilter(starFilter === star ? null : star)}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-yellow-400 text-white scale-110 shadow-sm' : 'bg-zinc-100 text-zinc-300 hover:bg-zinc-200'}`}
                                    >
                                        <Star className={`h-2.5 w-2.5 ${isSelected ? "fill-current" : ""}`} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Saved Templates List - Now with Date + Time */}
                    <div className="flex-1 overflow-y-auto project-list-scrollbar">
                        {filteredTemplates.length > 0 ? (
                            <div className="flex flex-col">
                                {filteredTemplates.map((template) => {
                                    const handleViewTemplate = () => {
                                        const isFullHtml = template.code.trim().startsWith('<!DOCTYPE html>');
                                        const isBroken = isFullHtml && template.code.includes('${escapedCode}');
                                        const finalHtml = (isFullHtml && !isBroken)
                                            ? template.code
                                            : constructHtmlBoilerplate(template.code);
                                        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                    };

                                    // Format date + time
                                    const templateDate = new Date(template.timestamp)
                                    const dateStr = isToday(templateDate)
                                        ? "Today"
                                        : isYesterday(templateDate)
                                            ? "Yesterday"
                                            : format(templateDate, "MMM d")
                                    const timeStr = templateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    const fullDateTimeStr = `${dateStr}, ${timeStr}`

                                    return (
                                        <button
                                            key={template.id}
                                            onClick={handleViewTemplate}
                                            className="flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-100/50 hover:bg-zinc-50 transition-colors group w-full"
                                        >
                                            <div className="p-1.5 rounded-md bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                                                <FileText className="h-3 w-3 text-zinc-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[13px] font-medium truncate text-zinc-900">{template.name}</span>
                                                    <div className={`flex items-center gap-0.5 ${template.rating > 0 ? "text-yellow-500" : "text-zinc-200"}`}>
                                                        {template.rating > 0 && <Star className="h-2.5 w-2.5 fill-current" />}
                                                        <span className="text-[10px] font-bold">{template.rating > 0 ? template.rating : ''}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                                                    <span>{template.industry}</span>
                                                    <span>{fullDateTimeStr}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                                    <Star className="h-5 w-5 text-zinc-100" />
                                </div>
                                <p className="text-zinc-400 text-xs font-medium">No templates saved yet</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Footer info */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Storage</span>
                    <span>{savedTemplates.length} templates</span>
                </div>
                <div className="mt-2 h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 transition-all" style={{ width: `${Math.min(savedTemplates.length * 5, 100)}%` }} />
                </div>
            </div>
        </div>
    )
}
