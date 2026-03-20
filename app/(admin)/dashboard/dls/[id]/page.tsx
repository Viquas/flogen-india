"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft, Save, Loader2, Star, Trash2
} from "lucide-react"
import Link from "next/link"
import {
    getDesignLanguage,
    updateDesignLanguage,
    deleteDesignLanguage,
    toggleDefault,
    type DesignLanguage,
} from "../actions"

export default function DLSEditorPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [dls, setDls] = useState<DesignLanguage | null>(null)
    const [name, setName] = useState("")
    const [industryTag, setIndustryTag] = useState("")
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        const load = async () => {
            const res = await getDesignLanguage(id)
            if (res.success) {
                setDls(res.data)
                setName(res.data.name)
                setIndustryTag(res.data.industry_tag || "")
                setContent(res.data.content)
            }
            setIsLoading(false)
        }
        load()
    }, [id])

    const hasChanges = dls && (
        name !== dls.name ||
        industryTag !== (dls.industry_tag || "") ||
        content !== dls.content
    )

    const handleSave = async () => {
        setIsSaving(true)
        setStatus(null)

        const res = await updateDesignLanguage(id, {
            name: name.trim(),
            industry_tag: industryTag.trim() || undefined,
            content: content.trim(),
        })

        if (res.success) {
            setStatus({ type: 'success', message: 'Saved successfully.' })
            // Update local state to track "has changes"
            setDls(prev => prev ? {
                ...prev,
                name: name.trim(),
                industry_tag: industryTag.trim() || null,
                content: content.trim(),
            } : null)
        } else {
            setStatus({ type: 'error', message: res.error })
        }
        setIsSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm("Delete this DLS? This cannot be undone.")) return
        const res = await deleteDesignLanguage(id)
        if (res.success) {
            router.push('/dashboard/dls')
        }
    }

    const handleToggleDefault = async () => {
        if (!dls || !dls.industry_tag) return
        const res = await toggleDefault(id, dls.industry_tag, !dls.is_default)
        if (res.success) {
            setDls(prev => prev ? { ...prev, is_default: !prev.is_default } : null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    if (!dls) {
        return (
            <div className="max-w-4xl space-y-4">
                <p className="text-zinc-500">DLS not found.</p>
                <Link href="/dashboard/dls">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to DLS list
                    </Button>
                </Link>
            </div>
        )
    }

    const sourceColors: Record<string, string> = {
        manual: "bg-zinc-100 text-zinc-700",
        stitch: "bg-purple-100 text-purple-700",
        "auto-generated": "bg-blue-100 text-blue-700",
        "url-extracted": "bg-amber-100 text-amber-700",
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/dls">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{dls.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={sourceColors[dls.source]}>
                                {dls.source}
                            </Badge>
                            {dls.is_default && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                    Default
                                </Badge>
                            )}
                            {dls.stitch_project_id && (
                                <span className="text-xs text-zinc-400">
                                    Stitch: {dls.stitch_project_id}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleDefault}
                        disabled={!dls.industry_tag}
                        title={dls.is_default ? "Remove as default" : "Set as default"}
                    >
                        <Star className={`h-4 w-4 mr-1 ${dls.is_default ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                        {dls.is_default ? 'Default' : 'Set Default'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="gap-2"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-700 mb-1 block">Name</label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="DLS name"
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
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">
                        DLS Content
                        <span className="text-zinc-400 font-normal ml-2">
                            {content.length.toLocaleString()} characters
                        </span>
                    </label>
                    <Textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="min-h-[500px] font-mono text-sm bg-zinc-50"
                    />
                </div>

                {status && (
                    <div className={`p-3 rounded-md text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    )
}
