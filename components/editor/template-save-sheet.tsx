"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Star, Loader2, Check, Layers, Monitor } from "lucide-react"
import { saveTemplate } from "@/app/dashboard/actions"
import { constructHtmlBoilerplate } from "@/lib/utils/html-boilerplate"

interface TemplateSaveSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    rating: number
    projectName: string
    generatedCode: string
    businessData: any
    sourceProjectId?: string | null
    onSaved?: () => void
}

export function TemplateSaveSheet({
    open,
    onOpenChange,
    rating,
    projectName,
    generatedCode,
    businessData,
    sourceProjectId,
    onSaved,
}: TemplateSaveSheetProps) {
    const [templateName, setTemplateName] = useState(projectName || "Untitled Template")
    const [isSaving, setIsSaving] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    const industryTag = businessData?.industry
        || businessData?.brandIdentity?.vibe?.industry
        || "General"

    // Build the iframe srcDoc exactly like LivePreview does
    const srcDoc = useMemo(() => {
        if (!generatedCode) return null
        return constructHtmlBoilerplate(generatedCode)
    }, [generatedCode])

    const handleSave = async () => {
        if (!templateName.trim() || !generatedCode) return

        setIsSaving(true)
        setSaveResult(null)

        try {
            const result = await saveTemplate({
                name: templateName.trim(),
                industryTag,
                rating,
                generatedCode,
                businessData,
                sourceProjectId: sourceProjectId || undefined,
            })

            if (result.success) {
                setSaveResult({ success: true, message: "Template saved!" })
                onSaved?.()
                setTimeout(() => onOpenChange(false), 800)
            } else {
                setSaveResult({ success: false, message: result.error || "Failed to save" })
            }
        } catch {
            setSaveResult({ success: false, message: "Unexpected error saving template" })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="sm:max-w-md w-full flex flex-col gap-0 p-0 overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-zinc-100 shrink-0">
                    <SheetHeader className="space-y-1">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <Layers className="h-4 w-4 text-purple-600" />
                            Save as Template
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            Save this design as a reusable template. Future generations can use it as a base to save API costs.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Live Hero Preview */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Monitor className="h-3 w-3" />
                            Hero Preview
                        </label>
                        {/* Container: 388px wide (sheet ~448px - 60px padding).
                            iframe renders at 1280px then scaled: 388/1280 = 0.303.
                            Visible height = 220px / 0.303 ≈ 726px of the actual page (hero only). */}
                        <div className="relative w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100"
                            style={{ height: 220 }}>
                            {srcDoc ? (
                                <>
                                    <iframe
                                        srcDoc={srcDoc}
                                        sandbox="allow-scripts"
                                        title="Website hero preview"
                                        className="absolute top-0 left-0 border-0"
                                        style={{
                                            width: 1280,
                                            height: 800,
                                            transform: "scale(0.303)",
                                            transformOrigin: "top left",
                                            pointerEvents: "none",
                                        }}
                                    />
                                    {/* Fade-out at the bottom to crop naturally */}
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-100 to-transparent pointer-events-none" />
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-400 text-xs">
                                    No preview available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Template Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Template Name
                        </label>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g. Clean Medical Landing Page"
                            className="h-10"
                            aria-label="Template name"
                        />
                    </div>

                    {/* Industry Tag */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Industry Tag
                        </label>
                        <div>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                {industryTag}
                            </Badge>
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Quality Rating
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map((s) => (
                                <Star
                                    key={s}
                                    className={`h-5 w-5 ${s <= rating ? "text-yellow-400 fill-current" : "text-zinc-200"}`}
                                />
                            ))}
                            <span className="text-sm text-zinc-500 ml-2">
                                {rating === 1 ? "Usable" : rating === 2 ? "Good" : "Excellent"}
                            </span>
                        </div>
                    </div>

                    {/* Save Result */}
                    {saveResult && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            saveResult.success
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {saveResult.success && <Check className="h-4 w-4 shrink-0" />}
                            {saveResult.message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-4 border-t border-zinc-100 shrink-0">
                    <SheetFooter className="flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !templateName.trim()}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Layers className="h-4 w-4" />
                            )}
                            {isSaving ? "Saving..." : "Save Template"}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    )
}
