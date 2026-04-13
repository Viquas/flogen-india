import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSalesMetrics } from '@/lib/sales/get-leads'
import { LeadStatusChip, OutcomeChip } from '@/components/sales/lead-status-chip'
import { relativeTime, formatDateTime } from '@/lib/sales/format'

export default async function SalesOverviewPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/sales-login')

    const m = await getSalesMetrics(user.id)
    const conversionPct = (m.teamConversionRate * 100).toFixed(1)

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Signed in as <span className="text-gray-700">{user.email}</span>
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="My calls today" value={m.myCallsToday} />
                <StatCard label="My calls this week" value={m.myCallsWeek} />
                <StatCard label="My conversions" value={m.myConversions} accent="emerald" />
                <StatCard label="Team conversions" value={m.teamConversions} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Team calls today" value={m.teamCallsToday} />
                <StatCard label="Team calls this week" value={m.teamCallsWeek} />
                <StatCard
                    label="Team conversion rate"
                    value={`${conversionPct}%`}
                    hint="paid claims / leads called"
                />
            </div>

            {/* Today's follow-ups */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-900">Today's follow-ups</h2>
                    <Link
                        href="/sales/followups"
                        className="text-xs text-emerald-700 hover:text-emerald-600"
                    >
                        View all →
                    </Link>
                </div>
                {m.todaysFollowups.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">
                        No follow-ups scheduled for today.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {m.todaysFollowups.slice(0, 10).map((lead) => (
                            <li key={lead.id} className="py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {lead.businessName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {lead.phone} ·{' '}
                                        {lead.salesNextFollowupAt
                                            ? formatDateTime(lead.salesNextFollowupAt)
                                            : '—'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <LeadStatusChip status={lead.salesStatus} />
                                    <Link
                                        href={`/sales/leads/${lead.id}`}
                                        className="text-xs rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500"
                                    >
                                        Open
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Recent team activity */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent team activity</h2>
                {m.recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">
                        No calls logged yet. Start working the queue.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {m.recentActivity.map((log) => (
                            <li
                                key={log.id}
                                className="flex items-start gap-3 border-b border-gray-100 last:border-b-0 pb-3 last:pb-0"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <OutcomeChip outcome={log.outcome} />
                                        <Link
                                            href={`/sales/leads/${log.projectId}`}
                                            className="text-sm font-medium text-gray-900 hover:text-emerald-700 truncate"
                                        >
                                            {log.businessName}
                                        </Link>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-1">{log.notes}</p>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {log.salespersonEmail || 'unknown'} · {relativeTime(log.createdAt)}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}

function StatCard({
    label,
    value,
    hint,
    accent,
}: {
    label: string
    value: string | number
    hint?: string
    accent?: 'emerald'
}) {
    return (
        <div
            className={`rounded-xl border p-5 ${
                accent === 'emerald'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
            <div
                className={`text-3xl font-semibold mt-1 ${
                    accent === 'emerald' ? 'text-emerald-700' : 'text-gray-900'
                }`}
            >
                {value}
            </div>
            {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
        </div>
    )
}
