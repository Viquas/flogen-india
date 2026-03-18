"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Search,
    Loader2,
    Sparkles,
    MapPin,
    Briefcase,
    Hash,
    Plus,
    X,
    ChevronDown,
    ChevronRight,
    Layers,
    Rocket,
} from "lucide-react"
import { TemplateLibraryModal } from "./template-library-modal"
import { AutopilotButton } from "./autopilot-button"
import { BatchProgress } from "./batch-progress"
import { BatchReport } from "./batch-report"

const STORAGE_KEY_INDUSTRIES = "webgen-industry-history"
const STORAGE_KEY_LOCATIONS = "webgen-location-history"

const PRESET_ENTRIES = [5, 10, 20, 50, 100]

const DEFAULT_INDUSTRIES = [
    "Medical",
    "Dental",
    "Legal",
    "Real Estate",
    "Restaurant",
    "Salon & Spa",
    "Fitness & Gym",
    "Education",
    "Automotive",
    "Home Services",
    "Retail",
    "Hospitality",
]

const getStoredList = (key: string, defaults: string[]): string[] => {
    if (typeof window === "undefined") return defaults
    try {
        const stored = localStorage.getItem(key)
        if (stored) {
            const parsed = JSON.parse(stored) as string[]
            const merged = [...new Set([...parsed, ...defaults])]
            return merged
        }
    } catch { /* ignore */ }
    return defaults
}

const persistList = (key: string, list: string[]) => {
    try {
        localStorage.setItem(key, JSON.stringify(list))
    } catch { /* ignore */ }
}

export function DiscoverySearch() {
    // Core fields
    const [searchTerm, setSearchTerm] = useState("")
    const [location, setLocation] = useState("")
    const [industry, setIndustry] = useState("")
    const [entries, setEntries] = useState(10)

    // History
    const [industryHistory, setIndustryHistory] = useState<string[]>(DEFAULT_INDUSTRIES)
    const [locationHistory, setLocationHistory] = useState<string[]>([])

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
    const [showLocationDropdown, setShowLocationDropdown] = useState(false)
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false)
    const [industryFilter, setIndustryFilter] = useState("")
    const [locationFilter, setLocationFilter] = useState("")
    const [isCreatingIndustry, setIsCreatingIndustry] = useState(false)
    const [newIndustryName, setNewIndustryName] = useState("")

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string; industry_tag: string } | null>(null)
    const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false)

    // Autopilot state
    const [autopilotRunId, setAutopilotRunId] = useState<string | null>(null)
    const [showAutopilotReport, setShowAutopilotReport] = useState(false)
    const [autopilotExpanded, setAutopilotExpanded] = useState(false)

    const industryRef = useRef<HTMLDivElement>(null)
    const locationRef = useRef<HTMLDivElement>(null)
    const entriesRef = useRef<HTMLDivElement>(null)
    const newIndustryInputRef = useRef<HTMLInputElement>(null)

    // Load persisted history on mount
    useEffect(() => {
        setIndustryHistory(getStoredList(STORAGE_KEY_INDUSTRIES, DEFAULT_INDUSTRIES))
        setLocationHistory(getStoredList(STORAGE_KEY_LOCATIONS, []))
    }, [])

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
                setShowIndustryDropdown(false)
                setIsCreatingIndustry(false)
            }
            if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
                setShowLocationDropdown(false)
            }
            if (entriesRef.current && !entriesRef.current.contains(e.target as Node)) {
                setShowEntriesDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    // Focus new-industry input when entering create mode
    useEffect(() => {
        if (isCreatingIndustry && newIndustryInputRef.current) {
            newIndustryInputRef.current.focus()
        }
    }, [isCreatingIndustry])

    // Auto-expand autopilot when a run starts
    useEffect(() => {
        if (autopilotRunId) setAutopilotExpanded(true)
    }, [autopilotRunId])

    const filteredIndustries = industryHistory.filter(
        (i) => i.toLowerCase().includes(industryFilter.toLowerCase())
    )

    const filteredLocations = locationHistory.filter(
        (l) => l.toLowerCase().includes(locationFilter.toLowerCase())
    )

    const handleSelectIndustry = (value: string) => {
        setIndustry(value)
        setShowIndustryDropdown(false)
        setIndustryFilter("")
        setIsCreatingIndustry(false)
    }

    const handleCreateIndustry = () => {
        const name = newIndustryName.trim()
        if (!name) return
        const updated = [name, ...industryHistory.filter((i) => i.toLowerCase() !== name.toLowerCase())]
        setIndustryHistory(updated)
        persistList(STORAGE_KEY_INDUSTRIES, updated)
        setIndustry(name)
        setNewIndustryName("")
        setIsCreatingIndustry(false)
        setShowIndustryDropdown(false)
    }

    const handleSelectLocation = (value: string) => {
        setLocation(value)
        setShowLocationDropdown(false)
        setLocationFilter("")
    }

    const addLocationToHistory = useCallback((loc: string) => {
        const trimmed = loc.trim()
        if (!trimmed) return
        setLocationHistory((prev) => {
            const updated = [trimmed, ...prev.filter((l) => l.toLowerCase() !== trimmed.toLowerCase())].slice(0, 50)
            persistList(STORAGE_KEY_LOCATIONS, updated)
            return updated
        })
    }, [])

    const handleSearch = async () => {
        const term = searchTerm.trim()
        if (!term && !industry) return

        setIsLoading(true)
        setStatus(null)

        // Build the query string the API expects
        const queryParts: string[] = []
        queryParts.push(term || industry)
        if (location.trim()) {
            queryParts.push(`in ${location.trim()}`)
            addLocationToHistory(location.trim())
        }
        const query = queryParts.join(" ")

        try {
            const rules = localStorage.getItem("web-factory-rules") || ""
            const response = await fetch("/api/discovery/google-places", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    rules,
                    templateId: selectedTemplate?.id || undefined,
                    structured: {
                        searchTerm: term || industry,
                        location: location.trim(),
                        industry: industry,
                        entries,
                    },
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch places")
            }

            setStatus({
                type: "success",
                message: `Queued ${result.count} businesses for website generation!`,
            })
            setSearchTerm("")
        } catch (error) {
            console.error("Discovery error:", error)
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : "An error occurred while fetching places.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSearch()
        }
    }

    const isReady = !!(searchTerm.trim() || industry)
    const queryPreview = `${entries} ${searchTerm || industry}${location ? ` in ${location}` : ""}`

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            {/* ── Zone 1: Search Form ── */}
            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold leading-none">Discovery Engine</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Find businesses on Google Maps and auto-generate websites
                        </p>
                    </div>
                </div>

                {/* Business / Service — full width */}
                <div>
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 block">
                        Business / Service
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="e.g. Dentists, Plumbers, Hair Salons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 h-10"
                            aria-label="Business or service search term"
                        />
                    </div>
                </div>

                {/* 3-column row: Location | Industry | Entries */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px] gap-3">
                    {/* Location */}
                    <div ref={locationRef} className="relative">
                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location
                        </label>
                        <div className="relative">
                            <Input
                                placeholder="e.g. Texas, Bangalore..."
                                value={location}
                                onChange={(e) => {
                                    setLocation(e.target.value)
                                    setLocationFilter(e.target.value)
                                    if (e.target.value && locationHistory.length > 0) {
                                        setShowLocationDropdown(true)
                                    }
                                }}
                                onFocus={() => {
                                    if (locationHistory.length > 0) setShowLocationDropdown(true)
                                }}
                                onKeyDown={handleKeyDown}
                                className="h-9 pr-8"
                                aria-label="Location"
                            />
                            {location && (
                                <button
                                    onClick={() => { setLocation(""); setLocationFilter("") }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                                    aria-label="Clear location"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        {showLocationDropdown && filteredLocations.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                                {filteredLocations.map((loc) => (
                                    <button
                                        key={loc}
                                        onClick={() => handleSelectLocation(loc)}
                                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 transition-colors flex items-center gap-2"
                                    >
                                        <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Industry Tag */}
                    <div ref={industryRef} className="relative">
                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Industry
                        </label>
                        <button
                            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                            className="flex items-center justify-between w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm hover:bg-zinc-50 transition-colors"
                            aria-label="Select industry"
                        >
                            {industry ? (
                                <span className="font-medium text-zinc-900 truncate">{industry}</span>
                            ) : (
                                <span className="text-zinc-400">Select...</span>
                            )}
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                {industry && (
                                    <span
                                        onClick={(e) => { e.stopPropagation(); setIndustry("") }}
                                        className="p-0.5 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                )}
                                <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showIndustryDropdown ? "rotate-180" : ""}`} />
                            </div>
                        </button>

                        {showIndustryDropdown && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                                <div className="px-2 py-1.5 border-b border-zinc-100">
                                    <Input
                                        placeholder="Search industries..."
                                        value={industryFilter}
                                        onChange={(e) => setIndustryFilter(e.target.value)}
                                        className="h-7 text-sm"
                                        autoFocus
                                        aria-label="Filter industries"
                                    />
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                    {filteredIndustries.map((ind) => (
                                        <button
                                            key={ind}
                                            onClick={() => handleSelectIndustry(ind)}
                                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${ind === industry
                                                ? "bg-purple-50 text-purple-700 font-medium"
                                                : "hover:bg-zinc-50 text-zinc-700"
                                                }`}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                    {filteredIndustries.length === 0 && (
                                        <p className="px-3 py-2 text-xs text-zinc-400">No matching industries</p>
                                    )}
                                </div>
                                <div className="border-t border-zinc-100 px-2 py-1.5">
                                    {isCreatingIndustry ? (
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                ref={newIndustryInputRef}
                                                placeholder="New industry name..."
                                                value={newIndustryName}
                                                onChange={(e) => setNewIndustryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") { e.preventDefault(); handleCreateIndustry() }
                                                    if (e.key === "Escape") setIsCreatingIndustry(false)
                                                }}
                                                className="h-7 text-sm flex-1"
                                                aria-label="New industry name"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleCreateIndustry}
                                                disabled={!newIndustryName.trim()}
                                                className="h-7 px-2.5 text-xs"
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCreatingIndustry(true)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Create New
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Entries */}
                    <div ref={entriesRef} className="relative">
                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Entries
                        </label>
                        <button
                            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                            className="flex items-center justify-between w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 transition-colors"
                            aria-label="Select number of entries"
                        >
                            <span>{entries}</span>
                            <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showEntriesDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {showEntriesDropdown && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1">
                                {PRESET_ENTRIES.map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => { setEntries(n); setShowEntriesDropdown(false) }}
                                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${n === entries ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-zinc-50 text-zinc-700"}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Action Bar ── */}
                <div className="flex items-center gap-3 pt-1">
                    {/* Query preview */}
                    {(searchTerm || industry || location) && (
                        <span className="text-xs text-zinc-400 font-mono truncate mr-auto">
                            {queryPreview}
                        </span>
                    )}
                    {!searchTerm && !industry && !location && <span className="mr-auto" />}

                    {/* Selected template badge */}
                    {selectedTemplate && (
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 shrink-0 text-xs">
                            <Layers className="h-3 w-3" />
                            {selectedTemplate.name}
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="ml-0.5 hover:text-purple-900"
                                aria-label="Remove template"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {/* Template button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTemplateLibraryOpen(true)}
                        className="gap-1.5 h-8 text-xs border-zinc-200 text-zinc-600 hover:text-zinc-900 shrink-0"
                    >
                        <Layers className="h-3.5 w-3.5" />
                        Template
                    </Button>

                    {/* Generate button */}
                    <Button
                        onClick={handleSearch}
                        disabled={isLoading || !isReady}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-8 px-4 text-xs shrink-0"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Discovering...
                            </>
                        ) : (
                            <>
                                <Search className="h-3.5 w-3.5" />
                                Generate Sites
                            </>
                        )}
                    </Button>
                </div>

                {/* Status message */}
                {status && (
                    <p className={`text-xs ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {status.message}
                    </p>
                )}
            </div>

            {/* ── Zone 2: Autopilot Section ── */}
            <div className="border-t border-zinc-100">
                {/* Toggle header */}
                <button
                    onClick={() => setAutopilotExpanded(!autopilotExpanded)}
                    className="w-full flex items-center gap-2 px-5 py-2.5 text-xs hover:bg-zinc-50 transition-colors"
                >
                    {autopilotExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                        : <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                    }
                    <Rocket className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-semibold text-zinc-600 uppercase tracking-wider">Autopilot</span>
                    <span className="text-zinc-400">Full pipeline: discover, generate, fix, score</span>
                </button>

                {autopilotExpanded && (
                    <div className="px-5 pb-4 space-y-3">
                        <AutopilotButton
                            query={searchTerm}
                            location={location}
                            industry={industry}
                            entries={entries}
                            templateId={selectedTemplate?.id}
                            onRunStart={(runId) => {
                                setAutopilotRunId(runId)
                                setShowAutopilotReport(false)
                            }}
                        />

                        {/* Progress */}
                        {autopilotRunId && (
                            <BatchProgress
                                runId={autopilotRunId}
                                onComplete={() => setShowAutopilotReport(true)}
                            />
                        )}

                        {/* Report */}
                        {showAutopilotReport && autopilotRunId && (
                            <BatchReport runId={autopilotRunId} />
                        )}
                    </div>
                )}
            </div>

            {/* Template Library Modal */}
            <TemplateLibraryModal
                open={isTemplateLibraryOpen}
                onOpenChange={setIsTemplateLibraryOpen}
                onSelect={(template) => setSelectedTemplate({
                    id: template.id,
                    name: template.name,
                    industry_tag: template.industry_tag,
                })}
            />
        </div>
    )
}
