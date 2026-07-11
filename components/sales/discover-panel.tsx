'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, MapPin, Briefcase, Hash, Loader2, Compass, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SYDNEY_SUBURBS } from '@/lib/au-suburbs'
import { NICHE_FIT_TABLE } from '@/lib/lead-scoring'
import { discoverSalesLeads, type DiscoverResult } from '@/app/(sales)/sales/discover/actions'
import type { AreaSelection } from './discovery-map'

// MapLibre is browser-only — load without SSR.
const DiscoveryMap = dynamic(() => import('./discovery-map').then((m) => m.DiscoveryMap), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />,
})

const ENTRIES_PRESETS = [10, 20, 50, 100]

// Genres known to score for the automation pool — surfaced as quick picks.
const AUTOMATION_GENRES = Object.keys(NICHE_FIT_TABLE).sort()

export function DiscoverPanel() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [searchTerm, setSearchTerm] = useState('')
    const [location, setLocation] = useState('')
    const [industry, setIndustry] = useState('')
    const [entries, setEntries] = useState(20)
    const [pool, setPool] = useState<'website' | 'automation'>('website')
    const [area, setArea] = useState<AreaSelection | null>(null)
    const [radiusKm, setRadiusKm] = useState(5)
    const [result, setResult] = useState<DiscoverResult | null>(null)

    const hasBusiness = !!(searchTerm.trim() || industry.trim())
    const hasArea = !!area || !!location.trim()
    const ready = hasBusiness && hasArea

    const setRadius = (km: number) => {
        setRadiusKm(km)
        setArea((prev) => (prev ? { ...prev, radiusKm: km } : prev))
    }

    const run = () => {
        if (!ready || isPending) return
        setResult(null)
        startTransition(async () => {
            const res = await discoverSalesLeads({
                searchTerm,
                location,
                industry,
                entries,
                pool,
                circle: area ?? undefined,
            })
            setResult(res)
            if (res.success) router.refresh()
        })
    }

    return (
        <div className="space-y-5">
            {/* Area picker (map) */}
            <div>
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Target area
                </label>
                <div className="h-72 w-full rounded-lg overflow-hidden border border-gray-200">
                    <DiscoveryMap value={area} onChange={setArea} radiusKm={radiusKm} className="h-full w-full" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-gray-400 shrink-0">Radius</span>
                    <input
                        type="range"
                        min={1}
                        max={50}
                        value={radiusKm}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="flex-1 accent-emerald-600"
                        aria-label="Search radius in kilometres"
                    />
                    <span className="text-xs font-medium text-gray-600 tabular-nums w-12">{radiusKm} km</span>
                    {area && (
                        <button
                            type="button"
                            onClick={() => setArea(null)}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-3 w-3" /> Clear
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    {area
                        ? `Selected: ${radiusKm} km around ${area.lat.toFixed(3)}, ${area.lng.toFixed(3)}`
                        : 'Click the map to drop a pin, or type an area below.'}
                </p>
            </div>

            {/* Business / service */}
            <div>
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                    Business type
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && run()}
                        placeholder="e.g. Plumbers, Hair Salons, Cafes..."
                        className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                        aria-label="Business type"
                    />
                </div>
                {pool === 'automation' && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Automation niches:</span>
                        {AUTOMATION_GENRES.map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setSearchTerm(g)}
                                className="text-[11px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors capitalize"
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Location | Industry | Entries */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_110px] gap-3">
                <div>
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> or type an area
                    </label>
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && run()}
                        placeholder="Suburb, city or region"
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                        aria-label="Area"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {SYDNEY_SUBURBS.slice(0, 8).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setLocation(s)}
                                className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                                {s.replace(', NSW', '')}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> Industry <span className="text-gray-300 normal-case">(optional)</span>
                    </label>
                    <input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && run()}
                        placeholder="Used for scoring"
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                        aria-label="Industry"
                    />
                </div>

                <div>
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Count
                    </label>
                    <select
                        value={entries}
                        onChange={(e) => setEntries(Number(e.target.value))}
                        className="w-full h-10 px-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                        aria-label="Number of leads"
                    >
                        {ENTRIES_PRESETS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lead type */}
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Lead type</span>
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                    <button
                        type="button"
                        onClick={() => setPool('website')}
                        aria-pressed={pool === 'website'}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            pool === 'website' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        Needs a website
                    </button>
                    <button
                        type="button"
                        onClick={() => setPool('automation')}
                        aria-pressed={pool === 'automation'}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            pool === 'automation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        Automation fit
                    </button>
                </div>
            </div>

            <p className="text-xs text-gray-400">
                {pool === 'website'
                    ? 'Finds businesses with no website. Each callable lead lands in your Leads workspace.'
                    : 'Finds businesses that already have a website and scores them for an automation pitch (booking, chat, missed-call text-back).'}
            </p>

            {/* Action */}
            <button
                onClick={run}
                disabled={!ready || isPending}
                className={cn(
                    'inline-flex items-center gap-2 h-11 px-5 rounded-lg text-sm font-semibold transition-colors',
                    ready && !isPending
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                {isPending ? 'Finding leads…' : 'Find leads'}
            </button>

            {/* Result */}
            {result && (
                <div
                    className={cn(
                        'flex items-start gap-2 rounded-lg border p-3 text-sm',
                        result.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800',
                    )}
                >
                    {result.success ? (
                        <>
                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                            <div className="space-y-1">
                                <p>
                                    <strong>{result.promotedCount}</strong> lead{result.promotedCount === 1 ? '' : 's'} added to your workspace
                                    {result.skippedCount > 0 && ` · ${result.skippedCount} duplicate${result.skippedCount === 1 ? '' : 's'} skipped`}.
                                </p>
                                <button
                                    onClick={() => router.push(`/sales/leads?pool=${result.pool}`)}
                                    className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    Go to Leads <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                            <p>{result.message}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
