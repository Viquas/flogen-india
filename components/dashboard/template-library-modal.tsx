"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Star,
    Loader2,
    Layers,
    Search,
    ChevronDown,
    Check,
    Trash2,
    X,
} from "lucide-react"
import { getTemplates, deleteTemplate } from "@/app/(admin)/dashboard/actions"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"

interface Template {
    id: string
    name: string
    industry_tag: string
    rating: number
    created_at: string
    generated_code: string
}

interface TemplateLibraryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (template: Template) => void
}

export function TemplateLibraryModal({
    open,
    onOpenChange,
    onSelect,
}: TemplateLibraryModalProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterIndustry, setFilterIndustry] = useState<string | null>(null)
    const [filterRating, setFilterRating] = useState<number | null>(null)
    const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    const fetchTemplates = async () => {
        setIsLoading(true)
        try {
            const result = await getTemplates()
            if (result.success && result.data) {
                setTemplates(result.data as Template[])
            }
        } catch (e) {
            console.error("Failed to load templates:", e)
        } finally {
            setIsLoading(false)
        }
    }

    const industryTags = useMemo(() => {
        const tags = new Set(templates.map((t) => t.industry_tag))
        return Array.from(tags).sort()
    }, [templates])

    const filtered = useMemo(() => {
        let list = templates

        if (filterIndustry) {
            list = list.filter((t) => t.industry_tag === filterIndustry)
        }
        if (filterRating) {
            list = list.filter((t) => t.rating >= filterRating)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    t.industry_tag.toLowerCase().includes(q)
            )
        }
        return list
    }, [templates, filterIndustry, filterRating, searchQuery])

    const handleSelect = (template: Template) => {
        onSelect(template)
        onOpenChange(false)
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setDeletingId(id)
        try {
            await deleteTemplate(id)
            setTemplates((prev) => prev.filter((t) => t.id !== id))
        } catch (e) {
            console.error("Failed to delete template:", e)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Layers className="h-5 w-5 text-purple-600" />
                        Template Library
                    </DialogTitle>
                    <DialogDescription>
                        Choose a saved template as the base for your new batch generation. The AI will only replace content, saving API costs.
                    </DialogDescription>
                </DialogHeader>

                {/* Filters Bar */}
                <div className="flex items-center gap-3 flex-wrap pt-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-9"
                            aria-label="Search templates"
                        />
                    </div>

                    {/* Industry Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                            className="flex items-center gap-2 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm hover:bg-zinc-50 transition-colors"
                            aria-label="Filter by industry"
                        >
                            {filterIndustry ? (
                                <Badge variant="secondary" className="text-xs">
                                    {filterIndustry}
                                </Badge>
                            ) : (
                                <span className="text-zinc-500">All Industries</span>
                            )}
                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                        </button>

                        {filterIndustry && (
                            <button
                                onClick={() => setFilterIndustry(null)}
                                className="absolute -right-2 -top-2 p-0.5 bg-zinc-200 rounded-full hover:bg-zinc-300"
                                aria-label="Clear industry filter"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}

                        {showIndustryDropdown && (
                            <div className="absolute top-full mt-1 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px] max-h-48 overflow-y-auto">
                                <button
                                    onClick={() => { setFilterIndustry(null); setShowIndustryDropdown(false) }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 ${!filterIndustry ? "font-medium text-zinc-900" : "text-zinc-600"}`}
                                >
                                    All Industries
                                </button>
                                {industryTags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => { setFilterIndustry(tag); setShowIndustryDropdown(false) }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 ${filterIndustry === tag ? "font-medium text-purple-700 bg-purple-50" : "text-zinc-600"}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rating Filter */}
                    <div className="flex items-center gap-1 border border-zinc-200 rounded-md px-2 h-9">
                        <span className="text-xs text-zinc-500 mr-1">Min:</span>
                        {[1, 2, 3].map((r) => (
                            <button
                                key={r}
                                onClick={() => setFilterRating(filterRating === r ? null : r)}
                                className={`transition-all hover:scale-110 ${filterRating && filterRating <= r ? "text-yellow-400" : "text-zinc-200"}`}
                                aria-label={`Filter by ${r}+ stars`}
                            >
                                <Star className={`h-4 w-4 ${filterRating && filterRating <= r ? "fill-current" : ""}`} />
                            </button>
                        ))}
                        {filterRating && (
                            <button
                                onClick={() => setFilterRating(null)}
                                className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-600"
                                aria-label="Clear rating filter"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Template Grid */}
                <div className="flex-1 overflow-y-auto pt-3 -mx-1 px-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                            <Layers className="h-10 w-10 mb-3 opacity-40" />
                            <p className="font-medium">No templates found</p>
                            <p className="text-sm mt-1">
                                {templates.length === 0
                                    ? "Save a website with a star rating to create your first template."
                                    : "Try adjusting your filters."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((template) => (
                                <div
                                    key={template.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelect(template)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(template) }}
                                    className="group text-left rounded-xl border border-zinc-200 bg-white hover:border-purple-300 hover:shadow-md transition-all overflow-hidden cursor-pointer"
                                >
                                    {/* Mini Preview */}
                                    <div className="h-36 bg-zinc-100 overflow-hidden relative">
                                        <iframe
                                            srcDoc={constructHtmlBoilerplate(template.generated_code)}
                                            className="w-[1024px] h-[768px] border-0 pointer-events-none"
                                            style={{ transform: "scale(0.2)", transformOrigin: "top left" }}
                                            title={`Preview of ${template.name}`}
                                            sandbox="allow-scripts"
                                            tabIndex={-1}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                                                <Check className="h-3 w-3 inline mr-1" />
                                                Use Template
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Info */}
                                    <div className="p-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm font-semibold text-zinc-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                                                {template.name}
                                            </h4>
                                            <button
                                                onClick={(e) => handleDelete(e, template.id)}
                                                disabled={deletingId === template.id}
                                                className="p-1 rounded hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                                aria-label="Delete template"
                                            >
                                                {deletingId === template.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {template.industry_tag}
                                            </Badge>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`h-3 w-3 ${s <= template.rating ? "text-yellow-400 fill-current" : "text-zinc-200"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
