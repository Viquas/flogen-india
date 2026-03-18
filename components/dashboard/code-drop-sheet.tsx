"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Star, Loader2, Code2, Layers, Check } from "lucide-react"
import { saveCleanedTemplate } from "@/app/(admin)/dashboard/actions"

interface CodeDropSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved?: () => void
}

export function CodeDropSheet({
    open,
    onOpenChange,
    onSaved,
}: CodeDropSheetProps) {
    const [templateName, setTemplateName] = useState("")
    const [industryTag, setIndustryTag] = useState("")
    const [rating, setRating] = useState(3)
    const [generatedCode, setGeneratedCode] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    const handleSave = async () => {
        if (!templateName.trim() || !industryTag.trim() || !generatedCode.trim()) return

        setIsSaving(true)
        setSaveResult(null)

        try {
            const result = await saveCleanedTemplate({
                name: templateName.trim(),
                industryTag: industryTag.trim(),
                rating,
                generatedCode: generatedCode.trim(),
                // For a manual code drop, we don't necessarily have complete businessData,
                // but we can pass a structured skeleton so the generator knows the industry.
                businessData: { industry: industryTag.trim() },
            })

            if (result.success) {
                setSaveResult({ success: true, message: "Template saved!" })
                onSaved?.()
                setTimeout(() => {
                    onOpenChange(false)
                    // Reset form after closing
                    setTemplateName("")
                    setIndustryTag("")
                    setRating(3)
                    setGeneratedCode("")
                    setSaveResult(null)
                }, 800)
            } else {
                setSaveResult({ success: false, message: result.error || "Failed to save" })
            }
        } catch {
            setSaveResult({ success: false, message: "Unexpected error saving template" })
        } finally {
            setIsSaving(false)
        }
    }

    const isFormValid = templateName.trim() && industryTag.trim() && generatedCode.trim()

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="sm:max-w-xl w-full flex flex-col gap-0 p-0 overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-zinc-100 shrink-0">
                    <SheetHeader className="space-y-1">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <Code2 className="h-4 w-4 text-emerald-600" />
                            Code Drop Template
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            Paste raw React/Tailwind code to save it as a custom reusable template in your library.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* Template Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Template Name
                        </label>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g. Dark SaaS Landing Page"
                            className="h-10"
                        />
                    </div>

                    {/* Industry Tag */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Industry Tag
                        </label>
                        <Input
                            value={industryTag}
                            onChange={(e) => setIndustryTag(e.target.value)}
                            placeholder="e.g. Technology"
                            className="h-10"
                        />
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Quality Rating
                        </label>
                        <div className="flex items-center gap-1 bg-zinc-50 w-max px-3 py-2 rounded-lg border border-zinc-200">
                            {[1, 2, 3].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setRating(s)}
                                    className="p-1 hover:bg-zinc-200 rounded-md transition-colors"
                                >
                                    <Star
                                        className={`h-6 w-6 ${s <= rating ? "text-yellow-400 fill-current" : "text-zinc-300"}`}
                                    />
                                </button>
                            ))}
                            <span className="text-sm font-medium text-zinc-600 ml-3 border-l border-zinc-200 pl-3">
                                {rating === 1 ? "Usable" : rating === 2 ? "Good" : "Excellent"}
                            </span>
                        </div>
                    </div>

                    {/* Code Editor Area */}
                    <div className="space-y-2 flex-1 flex flex-col h-full">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                            React Code
                            <span className="text-zinc-400 font-normal normal-case">
                                {generatedCode.length} chars
                            </span>
                        </label>
                        <Textarea
                            value={generatedCode}
                            onChange={(e) => setGeneratedCode(e.target.value)}
                            placeholder="export default function GeneratedPage() { ... }"
                            className="min-h-[300px] font-mono text-[13px] bg-zinc-900 border-zinc-800 text-zinc-50 outline-none p-4 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                        />
                    </div>

                    {/* Save Result */}
                    {saveResult && (
                        <div className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium ${saveResult.success
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                            {saveResult.success && <Check className="h-4 w-4 shrink-0" />}
                            {saveResult.message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-4 border-t border-zinc-100 shrink-0 bg-zinc-50">
                    <SheetFooter className="flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 bg-white hover:bg-zinc-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !isFormValid}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Layers className="h-4 w-4" />
                            )}
                            {isSaving ? "Analyzing & Saving..." : "Save Template"}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
