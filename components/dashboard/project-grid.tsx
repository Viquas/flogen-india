"use client"

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectCard } from './project-card'
import { BatchActions } from './batch-actions'
import { BatchGroup } from './batch-group'
import { KeyboardHelpOverlay } from './keyboard-help-overlay'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { regenerateProjects, deployProjects, autoFixAllErrors, resetStuckProjects, searchProjects, approveProject, regenerateProject, fixWebsiteErrors } from '@/app/(admin)/dashboard/actions'
import { Search, Loader2, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Project {
    id: string
    batch_id?: string | null
    business_data: {
        businessName: string
        industry?: string
        description?: string
        services?: string[]
    }
    status: string
    created_at: string
    updated_at: string
    quality_score?: number | null
}

type SortOption = 'newest' | 'quality'

interface BatchInfo {
    id: string
    metadata: any
    source: string
    created_at: string
    assigned_to?: string | null
}

interface ProjectGridProps {
    projects: Project[]
    batchesMap?: Record<string, BatchInfo>
}

type StatusFilter = 'all' | 'review' | 'generating' | 'queued' | 'error'

const filterTabs: { key: StatusFilter; label: string; statuses: string[] }[] = [
    { key: 'all', label: 'All', statuses: [] },
    { key: 'review', label: 'Completed', statuses: ['review', 'approved', 'deployed'] },
    { key: 'generating', label: 'Generating', statuses: ['generating'] },
    { key: 'queued', label: 'Queue', statuses: ['queued'] },
    { key: 'error', label: 'Error', statuses: ['error'] },
]

export function ProjectGrid({ projects, batchesMap = {} }: ProjectGridProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('all')
    const [isAutoFixing, setIsAutoFixing] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isKicking, setIsKicking] = useState(false)
    const [autoFixResult, setAutoFixResult] = useState<{ fixed: number; failed: number; total: number } | null>(null)
    const [resetResult, setResetResult] = useState<number | null>(null)
    const [kickResult, setKickResult] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>('newest')

    // Keyboard navigation state
    const [focusedIndex, setFocusedIndex] = useState<number>(-1)
    const [showHelp, setShowHelp] = useState(false)
    const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const router = useRouter()

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<Project[] | null>(null)

    // Handle global search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults(null)
            return
        }

        // Guard against out-of-order/stale resolutions: an in-flight fetch that
        // resolves after the query changed (or was cleared) must not overwrite
        // the newer state. clearTimeout only cancels a not-yet-fired timer.
        let cancelled = false
        const timeout = setTimeout(async () => {
            setIsSearching(true)
            const { data, success } = await searchProjects(searchQuery)
            if (cancelled) return
            if (success && data) {
                setSearchResults(data as unknown as Project[])
            }
            setIsSearching(false)
        }, 300)

        return () => {
            cancelled = true
            clearTimeout(timeout)
        }
    }, [searchQuery])

    // Filter projects based on search and active tab
    const sourceProjects = searchResults !== null ? searchResults : projects

    // Compute counts per tab based on source projects
    const counts = useMemo(() => {
        const c: Record<StatusFilter, number> = { all: sourceProjects.length, review: 0, generating: 0, queued: 0, error: 0 }
        sourceProjects.forEach(p => {
            if (['review', 'approved', 'deployed'].includes(p.status)) c.review++
            if (p.status === 'generating') c.generating++
            if (p.status === 'queued') c.queued++
            if (p.status === 'error') c.error++
        })
        return c
    }, [sourceProjects])

    const filteredProjects = useMemo(() => {
        const tab = filterTabs.find(t => t.key === activeFilter)
        let result = (!tab || tab.key === 'all') ? [...sourceProjects] : sourceProjects.filter(p => tab.statuses.includes(p.status))

        if (sortBy === 'quality') {
            result = [...result].sort((a, b) => {
                // Nulls last
                const aScore = a.quality_score ?? -1
                const bScore = b.quality_score ?? -1
                return bScore - aScore
            })
        }
        // 'newest' keeps the default created_at descending order from the server

        return result
    }, [sourceProjects, activeFilter, sortBy])

    // Group filtered projects by batch_id
    const groupedProjects = useMemo(() => {
        const hasBatches = Object.keys(batchesMap).length > 0
        if (!hasBatches) return null

        const grouped = new Map<string, Project[]>()
        const order: string[] = []
        for (const project of filteredProjects) {
            const key = project.batch_id || 'ungrouped'
            if (!grouped.has(key)) {
                grouped.set(key, [])
                order.push(key)
            }
            grouped.get(key)!.push(project)
        }
        return { grouped, order }
    }, [filteredProjects, batchesMap])

    // Scroll focused card into view
    useEffect(() => {
        if (focusedIndex >= 0) {
            const el = cardRefs.current.get(focusedIndex)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [focusedIndex])

    // Reset focused index when filter/sort/search changes
    useEffect(() => { setFocusedIndex(-1) }, [activeFilter, sortBy, searchQuery])

    // Define keyboard shortcuts
    const keyboardShortcuts = useMemo(() => {
        const focusedProject = focusedIndex >= 0 ? filteredProjects[focusedIndex] : null

        return [
            {
                key: 'j',
                description: 'Move focus to next project',
                handler: () => setFocusedIndex(prev => Math.min(prev + 1, filteredProjects.length - 1))
            },
            {
                key: 'k',
                description: 'Move focus to previous project',
                handler: () => setFocusedIndex(prev => Math.max(prev - 1, 0))
            },
            {
                key: 'a',
                description: 'Approve focused project',
                handler: () => {
                    if (focusedProject && focusedProject.status === 'review') {
                        approveProject(focusedProject.id)
                    }
                }
            },
            {
                key: 'r',
                description: 'Regenerate focused project',
                handler: () => {
                    if (focusedProject) {
                        regenerateProject(focusedProject.id)
                    }
                }
            },
            {
                key: 'f',
                description: 'Auto-fix focused project',
                handler: () => {
                    if (focusedProject && (focusedProject.status === 'error' || focusedProject.status === 'review')) {
                        fixWebsiteErrors(focusedProject.id)
                    }
                }
            },
            {
                key: 'e',
                description: 'Open focused project in editor',
                handler: () => {
                    if (focusedProject) {
                        router.push(`/editor?id=${focusedProject.id}`)
                    }
                }
            },
            {
                key: '?',
                description: 'Show keyboard shortcuts help',
                handler: () => setShowHelp(prev => !prev)
            },
        ]
    }, [focusedIndex, filteredProjects, router])

    // Register keyboard shortcuts (disabled when help overlay is open)
    useKeyboardShortcuts(keyboardShortcuts, !showHelp)

    // Store project order for editor prefetching
    useEffect(() => {
        const ids = filteredProjects.map(p => p.id)
        try {
            localStorage.setItem('webgen-project-order', JSON.stringify(ids))
        } catch (e) {
            // localStorage may be unavailable
        }
    }, [filteredProjects])

    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (selected) {
                next.add(id)
            } else {
                next.delete(id)
            }
            return next
        })
    }

    const handleSelectAll = () => {
        setSelectedIds(new Set(filteredProjects.map(p => p.id)))
    }

    const handleDeselectAll = () => {
        setSelectedIds(new Set())
    }

    const handleRegenerateSelected = () => {
        startTransition(async () => {
            await regenerateProjects(Array.from(selectedIds))
            setSelectedIds(new Set())
        })
    }

    const handleDeploySelected = () => {
        startTransition(async () => {
            await deployProjects(Array.from(selectedIds))
            setSelectedIds(new Set())
        })
    }

    const handleAutoFixAll = async () => {
        setIsAutoFixing(true)
        setAutoFixResult(null)
        try {
            const result = await autoFixAllErrors()
            if (result.success) {
                setAutoFixResult({ fixed: result.fixed, failed: result.failed, total: result.total || 0 })
            }
        } catch (e) {
            console.error('Auto-fix failed:', e)
        } finally {
            setIsAutoFixing(false)
        }
    }

    const handleResetStuck = async () => {
        setIsResetting(true)
        setResetResult(null)
        try {
            const result = await resetStuckProjects(10)
            if (result.success) {
                setResetResult(result.count)
            }
        } catch (e) {
            console.error('Reset stuck failed:', e)
        } finally {
            setIsResetting(false)
        }
    }

    const handleKickQueue = async () => {
        setIsKicking(true)
        setKickResult(null)
        try {
            const res = await fetch('/api/generate/process')
            const data = await res.json()
            setKickResult(data.message || 'Queue kicked')
        } catch (e) {
            console.error('Kick queue failed:', e)
            setKickResult('Failed to kick queue — check server logs')
        } finally {
            setIsKicking(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-200">
                <div className="flex items-center gap-1">
                    {filterTabs.map(tab => {
                        const isActive = activeFilter === tab.key
                        const count = counts[tab.key]
                        return (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveFilter(tab.key); setSelectedIds(new Set()); setAutoFixResult(null) }}
                                className={`px-4 py-2.5 text-sm font-medium transition-all relative whitespace-nowrap ${isActive
                                    ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-[1px]'
                                    : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-1.5 text-xs tabular-nums ${isActive ? 'text-zinc-500' : 'text-zinc-300'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-3 pb-1">
                    {/* Keyboard shortcut hint */}
                    <span className="text-xs text-zinc-400 hidden lg:inline">Press ? for shortcuts</span>

                    {/* Sort Toggle */}
                    <div className="flex items-center">
                        <button
                            onClick={() => setSortBy(prev => prev === 'newest' ? 'quality' : 'newest')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                                sortBy === 'quality'
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                            }`}
                            title={sortBy === 'newest' ? 'Sort by quality score' : 'Sort by newest'}
                        >
                            <ArrowUpDown className="h-3 w-3" />
                            {sortBy === 'newest' ? 'Newest' : 'Quality'}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search projects..."
                            className="bg-zinc-50 border-zinc-200 pl-8 h-8 text-xs focus-visible:ring-1 focus-visible:ring-zinc-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-2.5 top-2 h-4 w-4 text-zinc-400 animate-spin" />
                        )}
                    </div>

                    {/* Fix All Errors button — only visible on Error tab */}
                    {activeFilter === 'error' && counts.error > 0 && (
                        <button
                            onClick={handleAutoFixAll}
                            disabled={isAutoFixing}
                            className="px-4 py-1.5 text-xs font-semibold rounded-md transition-all disabled:opacity-50 bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
                        >
                            {isAutoFixing ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Fixing {counts.error}...
                                </>
                            ) : (
                                <>🔧 Fix All Errors ({counts.error})</>
                            )}
                        </button>
                    )}

                    {/* Reset Stuck button — only visible on Generating tab */}
                    {activeFilter === 'generating' && counts.generating > 0 && (
                        <button
                            onClick={handleResetStuck}
                            disabled={isResetting}
                            className="px-4 py-1.5 text-xs font-semibold rounded-md transition-all disabled:opacity-50 bg-zinc-700 hover:bg-zinc-800 text-white flex items-center gap-2"
                        >
                            {isResetting ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Resetting...
                                </>
                            ) : (
                                <>⏹ Reset Stuck ({counts.generating})</>
                            )}
                        </button>
                    )}

                    {/* Kick Queue button — only visible on Queue tab when items are stuck */}
                    {activeFilter === 'queued' && counts.queued > 0 && (
                        <button
                            onClick={handleKickQueue}
                            disabled={isKicking}
                            className="px-4 py-1.5 text-xs font-semibold rounded-md transition-all disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                        >
                            {isKicking ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Starting...
                                </>
                            ) : (
                                <>▶ Start Queue ({counts.queued})</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Result banners */}
            {autoFixResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-sm text-emerald-700">
                        <strong>Auto-fix complete:</strong> {autoFixResult.fixed} fixed, {autoFixResult.failed} failed out of {autoFixResult.total} projects
                    </p>
                    <button onClick={() => setAutoFixResult(null)} className="text-emerald-400 hover:text-emerald-600 text-xs">
                        Dismiss
                    </button>
                </div>
            )}
            {resetResult !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-sm text-blue-700">
                        <strong>Reset complete:</strong> {resetResult} stuck project{resetResult !== 1 ? 's' : ''} moved to Error status for retry.
                    </p>
                    <button onClick={() => setResetResult(null)} className="text-blue-400 hover:text-blue-600 text-xs">
                        Dismiss
                    </button>
                </div>
            )}
            {kickResult !== null && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-sm text-purple-700">
                        <strong>Queue processor:</strong> {kickResult}
                    </p>
                    <button onClick={() => setKickResult(null)} className="text-purple-400 hover:text-purple-600 text-xs">
                        Dismiss
                    </button>
                </div>
            )}

            {filteredProjects.length > 0 && (
                <BatchActions
                    selectedCount={selectedIds.size}
                    totalCount={filteredProjects.length}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onRegenerateSelected={handleRegenerateSelected}
                    onDeploySelected={handleDeploySelected}
                    isProcessing={isPending}
                />
            )}

            {filteredProjects.length > 0 ? (
                groupedProjects ? (
                    <div className="space-y-6">
                        {groupedProjects.order.map(batchKey => {
                            const batchProjects = groupedProjects.grouped.get(batchKey)!
                            const batch = batchKey !== 'ungrouped' ? batchesMap[batchKey] : null

                            const completedCount = batchProjects.filter(p => ['review', 'approved', 'deployed'].includes(p.status)).length
                            const failedCount = batchProjects.filter(p => p.status === 'error').length

                            // Calculate global index offset for keyboard navigation
                            let globalOffset = 0
                            for (const k of groupedProjects.order) {
                                if (k === batchKey) break
                                globalOffset += groupedProjects.grouped.get(k)!.length
                            }

                            if (batch) {
                                return (
                                    <BatchGroup
                                        key={batchKey}
                                        batchId={batchKey}
                                        metadata={batch.metadata || {}}
                                        source={batch.source}
                                        createdAt={batch.created_at}
                                        projectCount={batchProjects.length}
                                        completedCount={completedCount}
                                        failedCount={failedCount}
                                        assignedTo={batch.assigned_to}
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {batchProjects.map((project, localIndex) => {
                                                const globalIndex = globalOffset + localIndex
                                                return (
                                                    <ProjectCard
                                                        key={project.id}
                                                        project={project}
                                                        isSelected={selectedIds.has(project.id)}
                                                        isFocused={focusedIndex === globalIndex}
                                                        onSelect={handleSelect}
                                                        cardRef={(el) => {
                                                            if (el) cardRefs.current.set(globalIndex, el)
                                                            else cardRefs.current.delete(globalIndex)
                                                        }}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </BatchGroup>
                                )
                            }

                            // Ungrouped projects (no batch)
                            return (
                                <div key="ungrouped" className="space-y-3">
                                    <div className="px-4 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                        Ungrouped
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {batchProjects.map((project, localIndex) => {
                                            const globalIndex = globalOffset + localIndex
                                            return (
                                                <ProjectCard
                                                    key={project.id}
                                                    project={project}
                                                    isSelected={selectedIds.has(project.id)}
                                                    isFocused={focusedIndex === globalIndex}
                                                    onSelect={handleSelect}
                                                    cardRef={(el) => {
                                                        if (el) cardRefs.current.set(globalIndex, el)
                                                        else cardRefs.current.delete(globalIndex)
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProjects.map((project, index) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isSelected={selectedIds.has(project.id)}
                                isFocused={focusedIndex === index}
                                onSelect={handleSelect}
                                cardRef={(el) => {
                                    if (el) cardRefs.current.set(index, el)
                                    else cardRefs.current.delete(index)
                                }}
                            />
                        ))}
                    </div>
                )
            ) : (
                <div className="flex justify-center py-16">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="bg-purple-50 text-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-zinc-900">
                                {activeFilter === 'all' ? "Welcome to Flogen" : `No ${filterTabs.find(t => t.key === activeFilter)?.label.toLowerCase()} projects`}
                            </h3>
                            <p className="text-sm text-zinc-500 mt-2">
                                {activeFilter === 'all'
                                    ? "Your AI website factory is ready. Complete the checklist below to generate your first batch."
                                    : "Try selecting a different filter or checking back later."}
                            </p>
                        </div>

                        {activeFilter === 'all' && (
                            <div className="bg-white border rounded-xl shadow-sm text-left overflow-hidden">
                                <div className="p-4 border-b bg-zinc-50">
                                    <h4 className="font-medium text-sm text-zinc-700">Quick Start Checklist</h4>
                                </div>
                                <div className="divide-y divide-zinc-100">
                                    <div className="p-4 flex gap-3 items-start">
                                        <div className="text-emerald-500 mt-0.5">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900">Database Setup</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">Tables and policies created.</p>
                                        </div>
                                    </div>
                                    <a href="/dashboard/config" className="p-4 flex gap-3 items-start hover:bg-zinc-50 transition-colors group cursor-pointer">
                                        <div className="text-zinc-300 mt-0.5 group-hover:text-blue-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 group-hover:text-blue-600">Configure The Brain</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">Set up rules.md in the Config tab to guide AI generations.</p>
                                        </div>
                                    </a>
                                    <div className="p-4 flex gap-3 items-start">
                                        <div className="text-zinc-300 mt-0.5">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900">Run Discovery Search</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">Use the search bar above to fetch Google Places data.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <KeyboardHelpOverlay
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                shortcuts={keyboardShortcuts.map(s => ({ key: s.key, description: s.description }))}
            />
        </div>
    )
}
