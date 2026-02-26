"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    Layers,
} from "lucide-react"
import { TemplateLibraryModal } from "./template-library-modal"

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
        if (entries) queryParts.push(String(entries))
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
                message: `Successfully queued ${result.count} businesses for website generation!`,
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

    return (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-5">
            {/* Header */}
            <div className="space-y-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Discovery Engine
                </h3>
                <p className="text-sm text-muted-foreground">
                    Search for businesses on Google Maps, then auto-generate websites for them.
                </p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3">
                {/* Search Term — full width */}
                <div className="md:col-span-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">
                        Business / Service
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="e.g. Dentists, Plumbers, Hair Salons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 h-11 text-base"
                            aria-label="Business or service search term"
                        />
                    </div>
                </div>

                {/* Location */}
                <div ref={locationRef} className="relative">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">
                        <MapPin className="inline h-3 w-3 mr-1 -mt-0.5" />
                        Location
                    </label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. Texas, HSR Layout Bangalore..."
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
                            className="h-10"
                            aria-label="Location"
                        />
                        {location && (
                            <button
                                onClick={() => { setLocation(""); setLocationFilter("") }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                                aria-label="Clear location"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {showLocationDropdown && filteredLocations.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                            {filteredLocations.map((loc) => (
                                <button
                                    key={loc}
                                    onClick={() => handleSelectLocation(loc)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors flex items-center gap-2"
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
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">
                        <Briefcase className="inline h-3 w-3 mr-1 -mt-0.5" />
                        Industry Tag
                    </label>
                    <button
                        onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                        className="flex items-center justify-between w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm hover:bg-zinc-50 transition-colors"
                        aria-label="Select industry"
                    >
                        {industry ? (
                            <Badge variant="secondary" className="font-medium">
                                {industry}
                            </Badge>
                        ) : (
                            <span className="text-zinc-400">Select industry...</span>
                        )}
                        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${showIndustryDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {industry && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIndustry("") }}
                            className="absolute right-9 top-[calc(50%+10px)] -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 z-10"
                            aria-label="Clear industry"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {showIndustryDropdown && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                            {/* Search within industries */}
                            <div className="px-2 py-1.5 border-b border-zinc-100">
                                <Input
                                    placeholder="Search industries..."
                                    value={industryFilter}
                                    onChange={(e) => setIndustryFilter(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                    aria-label="Filter industries"
                                />
                            </div>

                            {/* Industry list */}
                            <div className="max-h-40 overflow-y-auto">
                                {filteredIndustries.map((ind) => (
                                    <button
                                        key={ind}
                                        onClick={() => handleSelectIndustry(ind)}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                                            ind === industry
                                                ? "bg-purple-50 text-purple-700 font-medium"
                                                : "hover:bg-zinc-50 text-zinc-700"
                                        }`}
                                    >
                                        <Briefcase className="h-3 w-3 text-zinc-400 shrink-0" />
                                        {ind}
                                    </button>
                                ))}
                                {filteredIndustries.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-zinc-400">No matching industries</p>
                                )}
                            </div>

                            {/* Create new */}
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
                                            className="h-8 text-sm flex-1"
                                            aria-label="New industry name"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleCreateIndustry}
                                            disabled={!newIndustryName.trim()}
                                            className="h-8 px-2.5 text-xs"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreatingIndustry(true)}
                                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors font-medium"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Create New Industry
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Entries + Actions */}
            <div className="flex items-end gap-3 flex-wrap">
                {/* Entries selector */}
                <div ref={entriesRef} className="relative">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">
                        <Hash className="inline h-3 w-3 mr-1 -mt-0.5" />
                        Entries
                    </label>
                    <button
                        onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                        className="flex items-center gap-2 h-10 px-4 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 transition-colors min-w-[100px] justify-between"
                        aria-label="Select number of entries"
                    >
                        <span>{entries}</span>
                        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showEntriesDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showEntriesDropdown && (
                        <div className="absolute bottom-full mb-1 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 min-w-[100px]">
                            {PRESET_ENTRIES.map((n) => (
                                <button
                                    key={n}
                                    onClick={() => { setEntries(n); setShowEntriesDropdown(false) }}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                        n === entries ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-zinc-50 text-zinc-700"
                                    }`}
                                >
                                    {n} {n === 100 ? "(max)" : ""}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1" />

                {/* Status */}
                {status && (
                    <div className="text-sm">
                        <span className={status.type === "success" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {status.message}
                        </span>
                    </div>
                )}

                {/* Template Button */}
                <Button
                    variant="outline"
                    onClick={() => setIsTemplateLibraryOpen(true)}
                    className="gap-2 h-10 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                    <Layers className="h-4 w-4" />
                    {selectedTemplate ? "Change Template" : "Use Template"}
                </Button>

                {/* Generate Button */}
                <Button
                    onClick={handleSearch}
                    disabled={isLoading || !isReady}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 px-6"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Discovering...
                        </>
                    ) : (
                        <>
                            <Search className="h-4 w-4" />
                            {selectedTemplate ? "Generate from Template" : "Generate Sites"}
                        </>
                    )}
                </Button>
            </div>

            {/* Selected Template Badge */}
            {selectedTemplate && (
                <div className="flex items-center gap-2 pt-1 border-t border-purple-100">
                    <Layers className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold">Template:</span>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 gap-1.5">
                        {selectedTemplate.name}
                        <span className="text-purple-400">({selectedTemplate.industry_tag})</span>
                        <button
                            onClick={() => setSelectedTemplate(null)}
                            className="ml-1 hover:text-purple-900"
                            aria-label="Remove template selection"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                </div>
            )}

            {/* Active Filters Preview */}
            {(searchTerm || industry || location) && (
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-zinc-100">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Query Preview:</span>
                    <span className="text-sm text-zinc-600 font-mono bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">
                        {entries} {searchTerm || industry}{location ? ` in ${location}` : ""}
                    </span>
                </div>
            )}

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
