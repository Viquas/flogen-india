import Link from 'next/link'
import { getSalesLeads, type SalesStatus } from '@/lib/sales/get-leads'
import { LeadStatusChip } from '@/components/sales/lead-status-chip'
import { relativeTime } from '@/lib/sales/format'
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

    const leads = await getSalesLeads({
        status: status ? [status] : undefined,
        search,
        industry,
        hasFollowup: followup === 'yes' ? true : followup === 'no' ? false : undefined,
        limit: 300,
    })

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Shared pool · {leads.length} lead{leads.length === 1 ? '' : 's'} · sorted by oldest
                        contact first
                    </p>
                </div>
            </div>

            <div className="mb-4">
                <LeadsFilterBar />
            </div>

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
                                        <div className="font-medium text-gray-900">{lead.businessName}</div>
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
        </div>
    )
}
