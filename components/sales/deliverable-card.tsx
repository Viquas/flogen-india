'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Copy,
    Check,
    ExternalLink,
    Zap,
    Globe,
    Loader2,
    Sparkles,
    FileDown,
    Presentation,
    AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    generateWebsiteForLead,
    generatePlanForLead,
    exportPresentationPdf,
} from '@/app/(sales)/sales/leads/[id]/deliverable-actions'

interface DeliverableCardProps {
    leadId: string
    slug: string | null
    pool: 'website' | 'automation' | null
    nicheScore: number | null
    pitchAngle: string | null
    businessName: string
    projectStatus: string
    planStatus: string | null
    presentationUrl: string | null
}

export function DeliverableCard({
    leadId,
    slug,
    pool,
    nicheScore,
    pitchAngle,
    projectStatus,
    planStatus,
    presentationUrl,
}: DeliverableCardProps) {
    const router = useRouter()
    const [copied, setCopied] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [exporting, setExporting] = useState(false)

    const isAutomation = pool === 'automation'
    const path = slug ? (isAutomation ? `/pitch/${slug}` : `/claim/${slug}`) : null
    const presentationPath = slug
        ? isAutomation
            ? `/pitch/${slug}/presentation`
            : `/claim/${slug}/presentation`
        : null
    const label = isAutomation ? 'Automation pitch' : 'Website claim page'
    const Icon = isAutomation ? Zap : Globe

    // Deliverable readiness per stream
    const siteReady = ['review', 'approved', 'deployed'].includes(projectStatus)
    const siteWorking = ['queued', 'generating'].includes(projectStatus)
    const planReady = planStatus === 'ready'
    const planWorking = planStatus === 'queued' || planStatus === 'generating'
    const working = isAutomation ? planWorking : siteWorking
    // Automation pitch pages work without a plan (template fallback); claim links
    // must never go out before the site exists.
    const shareable = !!path && (isAutomation || siteReady)

    // While a generation is in flight, poll so the card advances on its own
    useEffect(() => {
        if (!working) return
        const t = setInterval(() => router.refresh(), 5000)
        return () => clearInterval(t)
    }, [working, router])

    const copy = async () => {
        if (!path) return
        const url = `${window.location.origin}${path}`
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            /* ignore */
        }
    }

    const handleGenerate = () => {
        startTransition(async () => {
            const res = isAutomation
                ? await generatePlanForLead(leadId)
                : await generateWebsiteForLead(leadId)
            if (res.ok) {
                toast.success(isAutomation ? 'Plan generation queued' : 'Demo site generation queued')
                router.refresh()
            } else {
                toast.error(res.error || 'Failed to queue generation')
            }
        })
    }

    const handleExportPdf = async () => {
        setExporting(true)
        try {
            const res = await exportPresentationPdf(leadId)
            if (res.ok && res.url) {
                toast.success('Presentation PDF ready')
                router.refresh()
            } else {
                toast.error(res.error || 'PDF export failed')
            }
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${isAutomation ? 'text-amber-500' : 'text-emerald-600'}`} />
                <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
                {isAutomation && nicheScore != null && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-semibold">
                        Score {nicheScore}
                    </span>
                )}
            </div>

            {isAutomation && pitchAngle && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{pitchAngle}</p>
            )}

            {/* Generation state */}
            {isAutomation ? (
                planReady ? (
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <Sparkles className="h-3.5 w-3.5" /> Custom automation plan ready
                    </p>
                ) : planWorking ? (
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Studying the business &amp; writing their plan…
                    </p>
                ) : (
                    <div className="mb-3">
                        {planStatus === 'failed' && (
                            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                                <AlertTriangle className="h-3.5 w-3.5" /> Plan generation failed — try again
                            </p>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            Generate custom plan
                        </button>
                        <p className="mt-1.5 text-[11px] text-gray-400">
                            The pitch page works now with template copy — the plan upgrades it to a custom study.
                        </p>
                    </div>
                )
            ) : siteReady ? (
                <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Demo site generated
                </p>
            ) : siteWorking ? (
                <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating their demo site…
                </p>
            ) : (
                <div className="mb-3">
                    {projectStatus === 'error' && (
                        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Generation failed — try again
                        </p>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                        Generate demo site
                    </button>
                    <p className="mt-1.5 text-[11px] text-gray-400">
                        Don&apos;t share the claim link before the demo exists.
                    </p>
                </div>
            )}

            {/* Share link — only once there is something worth sending */}
            {path && shareable ? (
                <>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <code className="flex-1 truncate text-xs text-gray-600">{path}</code>
                        <button
                            onClick={copy}
                            className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a
                            href={path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open {isAutomation ? 'pitch' : 'claim'} page
                        </a>
                        {presentationPath && (
                            <a
                                href={presentationPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:text-indigo-900"
                            >
                                <Presentation className="h-3.5 w-3.5" />
                                Presentation
                            </a>
                        )}
                        {presentationUrl ? (
                            <a
                                href={presentationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <FileDown className="h-3.5 w-3.5" />
                                Download PDF
                            </a>
                        ) : (
                            <button
                                onClick={handleExportPdf}
                                disabled={exporting}
                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-60"
                            >
                                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                                {exporting ? 'Exporting…' : 'Export PDF'}
                            </button>
                        )}
                    </div>
                </>
            ) : path && !shareable ? (
                <p className="text-sm text-gray-400">
                    Share link unlocks when the demo site is ready.
                </p>
            ) : (
                <p className="text-sm text-gray-400">No shareable page for this lead yet.</p>
            )}
        </div>
    )
}
