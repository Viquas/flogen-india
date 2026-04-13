import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, MessageCircle, MapPin, ExternalLink, ChevronLeft } from 'lucide-react'
import { getLeadDetail } from '@/lib/sales/get-leads'
import { LeadStatusChip, OutcomeChip } from '@/components/sales/lead-status-chip'
import { relativeTime, formatDateTime, toWhatsAppDigits } from '@/lib/sales/format'
import { LogCallForm } from './log-call-form'
import { SharePreviewButton } from './share-preview-button'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: PageProps) {
    const { id } = await params
    const { lead, callLogs } = await getLeadDetail(id)

    if (!lead) notFound()

    const phoneDigits = lead.phone ? toWhatsAppDigits(lead.phone) : ''
    const mapsHref = lead.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`
        : null

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <Link
                href="/sales/leads"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to leads
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                {/* Left: business card */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{lead.businessName}</h1>
                                <div className="mt-2 flex items-center gap-2">
                                    <LeadStatusChip status={lead.salesStatus} />
                                    {lead.isPaid && (
                                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-600 text-white">
                                            Paid
                                        </span>
                                    )}
                                </div>
                            </div>
                            {lead.qualityScore != null && (
                                <div className="text-right">
                                    <div className="text-2xl font-semibold text-gray-900">
                                        {lead.qualityScore}
                                    </div>
                                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">
                                        Quality
                                    </div>
                                </div>
                            )}
                        </div>

                        <dl className="mt-5 space-y-3 text-sm">
                            {lead.industry && (
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                                        Industry
                                    </dt>
                                    <dd className="text-gray-700">{lead.industry}</dd>
                                </div>
                            )}
                            {lead.rating != null && (
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                                        Google rating
                                    </dt>
                                    <dd className="text-gray-700">
                                        {lead.rating.toFixed(1)}
                                        {lead.reviewCount != null && (
                                            <span className="text-gray-400 ml-1">
                                                ({lead.reviewCount} reviews)
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            )}
                            {lead.address && (
                                <div>
                                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                                        Address
                                    </dt>
                                    <dd className="text-gray-700">
                                        {mapsHref ? (
                                            <a
                                                href={mapsHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 hover:text-emerald-700"
                                            >
                                                <MapPin className="h-3.5 w-3.5" />
                                                {lead.address}
                                            </a>
                                        ) : (
                                            lead.address
                                        )}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            {lead.phone && (
                                <>
                                    <a
                                        href={`tel:${lead.phone}`}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                                    >
                                        <Phone className="h-4 w-4" />
                                        Call
                                    </a>
                                    <a
                                        href={`https://wa.me/${phoneDigits}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        WhatsApp
                                    </a>
                                </>
                            )}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <SharePreviewButton slug={lead.slug} businessName={lead.businessName} />
                            {lead.slug && (
                                <a
                                    href={`/preview/${lead.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open preview
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">History snapshot</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Total calls</dt>
                                <dd className="text-gray-900 font-medium">{lead.salesCallCount}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Last contact</dt>
                                <dd className="text-gray-900 font-medium">
                                    {relativeTime(lead.salesLastContactAt)}
                                </dd>
                            </div>
                            {lead.salesLastContactByEmail && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Last by</dt>
                                    <dd className="text-gray-900 font-medium">
                                        {lead.salesLastContactByEmail}
                                    </dd>
                                </div>
                            )}
                            {lead.salesNextFollowupAt && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Next follow-up</dt>
                                    <dd className="text-gray-900 font-medium">
                                        {formatDateTime(lead.salesNextFollowupAt)}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Right: log call + history */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Log a call</h2>
                        <LogCallForm projectId={lead.id} />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">
                            Call history ({callLogs.length})
                        </h2>

                        {callLogs.length === 0 ? (
                            <p className="text-sm text-gray-400 py-8 text-center">
                                No calls logged yet. You'll be the first.
                            </p>
                        ) : (
                            <ol className="space-y-4">
                                {callLogs.map((log) => (
                                    <li
                                        key={log.id}
                                        className="border-l-2 border-gray-100 pl-4 pb-1"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <OutcomeChip outcome={log.outcome} />
                                                <span className="text-xs text-gray-500">
                                                    {log.salespersonEmail || 'unknown'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {relativeTime(log.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {log.notes}
                                        </p>
                                        {log.followUpAt && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                Follow-up: {formatDateTime(log.followUpAt)}
                                            </p>
                                        )}
                                        {log.durationSeconds != null && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Duration: {Math.round(log.durationSeconds / 60)} min
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
