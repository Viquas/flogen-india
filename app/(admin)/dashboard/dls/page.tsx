"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Palette, Plus, Trash2, Star, Search, Loader2, Pencil, ExternalLink
} from "lucide-react"
import Link from "next/link"
import {
    listDesignLanguages,
    createDesignLanguage,
    deleteDesignLanguage,
    toggleDefault,
    type DesignLanguage,
} from "./actions"

export default function DLSPage() {
    const [items, setItems] = useState<DesignLanguage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [isPending, startTransition] = useTransition()

    const load = async () => {
        const res = await listDesignLanguages()
        if (res.success) {
            setItems(res.data)
        }
        setIsLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleDelete = (id: string) => {
        if (!confirm("Delete this DLS?")) return
        startTransition(async () => {
            const res = await deleteDesignLanguage(id)
            if (res.success) {
                setItems(prev => prev.filter(d => d.id !== id))
            }
        })
    }

    const handleToggleDefault = (id: string, industryTag: string | null, current: boolean) => {
        if (!industryTag) return
        startTransition(async () => {
            const res = await toggleDefault(id, industryTag, !current)
            if (res.success) load()
        })
    }

    const filtered = items.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.industry_tag || '').toLowerCase().includes(search.toLowerCase())
    )

    const sourceColors: Record<string, string> = {
        manual: "bg-zinc-100 text-zinc-700",
        stitch: "bg-purple-100 text-purple-700",
        "auto-generated": "bg-blue-100 text-blue-700",
        "url-extracted": "bg-amber-100 text-amber-700",
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight pb-2">Design Languages</h1>
                    <p className="text-muted-foreground">
                        Manage DLS documents used by the generation pipeline.
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(true)}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Create New
                </Button>
            </div>

            {showCreateForm && (
                <CreateDLSForm
                    onCreated={() => { setShowCreateForm(false); load() }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {items.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or industry..."
                        className="pl-9"
                    />
                </div>
            )}

            {filtered.length === 0 && !showCreateForm ? (
                <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                    <Palette className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No Design Languages yet</h3>
                    <p className="text-sm text-zinc-500 mb-4">
                        Create your first DLS or import one from Google Stitch.
                    </p>
                    <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(dls => (
                        <div
                            key={dls.id}
                            className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4 hover:border-zinc-300 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Link
                                        href={`/dashboard/dls/${dls.id}`}
                                        className="font-semibold text-sm hover:underline truncate"
                                    >
                                        {dls.name}
                                    </Link>
                                    {dls.is_default && (
                                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs shrink-0">
                                            Default
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    {dls.industry_tag && (
                                        <span className="bg-zinc-100 px-2 py-0.5 rounded-full">
                                            {dls.industry_tag}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full ${sourceColors[dls.source] || ''}`}>
                                        {dls.source}
                                    </span>
                                    <span>{dls.content.length.toLocaleString()} chars</span>
                                    <span>Updated {new Date(dls.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleDefault(dls.id, dls.industry_tag, dls.is_default)}
                                    disabled={!dls.industry_tag || isPending}
                                    title={dls.is_default ? "Remove as default" : "Set as default for industry"}
                                    className="h-8 w-8 p-0"
                                >
                                    <Star className={`h-4 w-4 ${dls.is_default ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                                </Button>
                                <Link href={`/dashboard/dls/${dls.id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Pencil className="h-4 w-4 text-zinc-500" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(dls.id)}
                                    disabled={isPending}
                                    className="h-8 w-8 p-0 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function CreateDLSForm({
    onCreated,
    onCancel,
}: {
    onCreated: () => void
    onCancel: () => void
}) {
    const [name, setName] = useState("")
    const [industryTag, setIndustryTag] = useState("")
    const [content, setContent] = useState("")
    const [isDefault, setIsDefault] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !content.trim()) {
            setError("Name and content are required.")
            return
        }

        setIsSaving(true)
        setError(null)

        const res = await createDesignLanguage({
            name: name.trim(),
            industry_tag: industryTag.trim() || undefined,
            content: content.trim(),
            source: 'manual',
            is_default: isDefault,
        })

        if (res.success) {
            onCreated()
        } else {
            setError(res.error)
        }
        setIsSaving(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create New DLS</h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Name</label>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Warm Restaurant"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Industry Tag</label>
                    <Input
                        value={industryTag}
                        onChange={e => setIndustryTag(e.target.value)}
                        placeholder="e.g. restaurant, salon, tech"
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">DLS Content</label>
                <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Paste or write your Design Language Specification..."
                    className="min-h-[300px] font-mono text-sm"
                />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={e => setIsDefault(e.target.checked)}
                    className="rounded border-zinc-300"
                />
                Set as default DLS for this industry
            </label>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create
                </Button>
            </div>
        </form>
    )
}
