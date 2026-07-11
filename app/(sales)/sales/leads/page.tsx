import Link from 'next/link'
import { Table2, Map as MapIcon } from 'lucide-react'
import { getSalesLeads, type SalesStatus } from '@/lib/sales/get-leads'
import { LeadStatusChip } from '@/components/sales/lead-status-chip'
import { LeadsMapView } from '@/components/sales/leads-map-view'
import { relativeTime } from '@/lib/sales/format'
import { cn } from '@/lib/utils'
import { LeadsFilterBar } from './leads-filter-bar'

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SalesLeadsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const status = typeof params.status === 'string' ? (params.status as SalesStatus) : undefined
    const search = typeof params.q === 'string' ? params.q : undefined
    const industry = typeof params.industry === 'string' ? params.industry : undefined
    const followup = typeof params.followup === 'string' ? params.followup : undefined
    const pool = params.pool === 'website' || params.pool === 'automation' ? params.pool : undefined
    const view = params.view === 'map' ? 'map' : 'table'

    const leads = await getSalesLeads({
        status: status ? [status] : undefined,
        search,
        industry,
        hasFollowup: followup === 'yes' ? true : followup === 'no' ? false : undefined,
        pool,
        limit: 300,
    })

    // Preserve current filters when switching views.
    const toggleParams = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
        if (typeof v === 'string' && k !== 'view') toggleParams.set(k, v)
    }
    const hrefFor = (v: 'table' | 'map') => {
        const p = new URLSearchParams(toggleParams)
        p.set('view', v)
        return `/sales/leads?${p.toString()}`
    }

    const mapLeads = leads
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => ({
            id: l.id,
            businessName: l.businessName,
            lat: l.lat as number,
            lng: l.lng as number,
            salesStatus: l.salesStatus,
            phone: l.phone,
            industry: l.industry,
        }))

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Shared pool · {leads.length} lead{leads.length === 1 ? '' : 's'}
                        {view === 'map' && ` · ${mapLeads.length} on map`} · sorted by oldest contact first
                    </p>
                </div>

                {/* View toggle */}
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                    <Link
                        href={hrefFor('table')}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <Table2 className="h-3.5 w-3.5" /> Table
                    </Link>
                    <Link
                        href={hrefFor('map')}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            view === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        <MapIcon className="h-3.5 w-3.5" /> Map
                    </Link>
                </div>
            </div>

            <div className="mb-4">
                <LeadsFilterBar />
            </div>

            {view === 'map' ? (
                <LeadsMapView leads={mapLeads} />
            ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Business</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Industry</th>
                                <th className="px-4 py-3">Rating</th>
                                <th className="px-4 py-3">Quality</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Last contact</th>
                                <th className="px-4 py-3">Calls</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                        No leads match your filters.
                                    </td>
                                </tr>
                            )}
                            {leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{lead.businessName}</span>
                                            {lead.intent === 'interested' && (
                                                <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">
                                                    🔥 Interested
                                                </span>
                                            )}
                                            {lead.intent === 'engaged' && (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                                                    👁 Engaged
                                                </span>
                                            )}
                                        </div>
                                        {lead.address && (
                                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                                {lead.address}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                        {lead.phone || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{lead.industry || '—'}</td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                        {lead.rating != null ? (
                                            <span>
                                                {lead.rating.toFixed(1)}
                                                {lead.reviewCount != null && (
                                                    <span className="text-gray-400 text-xs ml-1">
                                                        ({lead.reviewCount})
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {lead.qualityScore ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <LeadStatusChip status={lead.salesStatus} />
                                        {lead.isPaid && (
                                            <span className="ml-1.5 inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-600 text-white">
                                                Paid
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div>{relativeTime(lead.salesLastContactAt)}</div>
                                        {lead.salesLastContactByEmail && (
                                            <div className="text-[11px] text-gray-400">
                                                by {lead.salesLastContactByEmail}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{lead.salesCallCount}</td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/sales/leads/${lead.id}`}
                                            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                                        >
                                            Open
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}
        </div>
    )
}
