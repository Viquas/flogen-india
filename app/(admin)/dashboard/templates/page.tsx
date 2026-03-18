"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Star,
    Loader2,
    Layers,
    Search,
    Trash2,
    ChevronDown,
    X,
    Code2,
} from "lucide-react"
import { getTemplates, deleteTemplate } from "@/app/(admin)/dashboard/actions"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"
import { format } from "date-fns"
import { CodeDropSheet } from "@/components/dashboard/code-drop-sheet"

interface Template {
    id: string
    name: string
    industry_tag: string
    rating: number
    created_at: string
    generated_code: string
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterIndustry, setFilterIndustry] = useState<string | null>(null)
    const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isCodeDropOpen, setIsCodeDropOpen] = useState(false)

    useEffect(() => {
        fetchTemplates()
    }, [])

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
        return Array.from(new Set(templates.map((t) => t.industry_tag))).sort()
    }, [templates])

    const filtered = useMemo(() => {
        let list = templates
        if (filterIndustry) list = list.filter((t) => t.industry_tag === filterIndustry)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter((t) => t.name.toLowerCase().includes(q) || t.industry_tag.toLowerCase().includes(q))
        }
        return list
    }, [templates, filterIndustry, searchQuery])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteTemplate(id)
            setTemplates((prev) => prev.filter((t) => t.id !== id))
        } catch (e) {
            console.error("Delete failed:", e)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Layers className="h-6 w-6 text-purple-600" />
                        Templates
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Reusable website designs saved from your best generations. Use them to save API costs on future batches.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-8"
                        onClick={() => setIsCodeDropOpen(true)}
                    >
                        <Code2 className="h-4 w-4 text-emerald-600" />
                        Code Drop
                    </Button>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                        {templates.length} template{templates.length !== 1 ? "s" : ""}
                    </Badge>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        aria-label="Search templates"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                        className="flex items-center gap-2 h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm hover:bg-zinc-50 transition-colors"
                        aria-label="Filter by industry"
                    >
                        {filterIndustry || "All Industries"}
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                    </button>
                    {filterIndustry && (
                        <button
                            onClick={() => setFilterIndustry(null)}
                            className="absolute -right-2 -top-2 p-0.5 bg-zinc-200 rounded-full hover:bg-zinc-300"
                            aria-label="Clear filter"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                    {showIndustryDropdown && (
                        <div className="absolute top-full mt-1 left-0 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
                            <button
                                onClick={() => { setFilterIndustry(null); setShowIndustryDropdown(false) }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                            >
                                All Industries
                            </button>
                            {industryTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => { setFilterIndustry(tag); setShowIndustryDropdown(false) }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 ${filterIndustry === tag ? "font-medium text-purple-700 bg-purple-50" : ""}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <Layers className="h-12 w-12 mb-4 opacity-30" />
                    <p className="font-medium text-lg">No templates yet</p>
                    <p className="text-sm mt-1">
                        Open a generated website in the editor, then click a star rating to save it as a template.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((template) => (
                        <div
                            key={template.id}
                            className="group rounded-xl border border-zinc-200 bg-white hover:shadow-lg transition-all overflow-hidden"
                        >
                            <div className="h-40 bg-zinc-100 overflow-hidden relative">
                                <iframe
                                    srcDoc={constructHtmlBoilerplate(template.generated_code)}
                                    className="w-[1024px] h-[768px] border-0 pointer-events-none"
                                    style={{ transform: "scale(0.22)", transformOrigin: "top left" }}
                                    title={`Preview of ${template.name}`}
                                    sandbox="allow-scripts"
                                    tabIndex={-1}
                                />
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-zinc-900 line-clamp-1">{template.name}</h3>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        {[1, 2, 3].map((s) => (
                                            <Star
                                                key={s}
                                                className={`h-3.5 w-3.5 ${s <= template.rating ? "text-yellow-400 fill-current" : "text-zinc-200"}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="text-xs">
                                        {template.industry_tag}
                                    </Badge>
                                    <span className="text-[11px] text-zinc-400">
                                        {format(new Date(template.created_at), "MMM d, yyyy")}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 text-xs gap-1.5 flex-1"
                                        onClick={() => handleDelete(template.id)}
                                        disabled={deletingId === template.id}
                                    >
                                        {deletingId === template.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CodeDropSheet
                open={isCodeDropOpen}
                onOpenChange={setIsCodeDropOpen}
                onSaved={fetchTemplates}
            />
        </div>
    )
}
