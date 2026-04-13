import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LeadStatusChip } from '@/components/sales/lead-status-chip'
import { formatDateTime, relativeTime } from '@/lib/sales/format'
import type { SalesStatus } from '@/lib/sales/get-leads'

interface FollowupRow {
    id: string
    businessName: string
    phone: string | null
    salesStatus: SalesStatus
    followUpAt: string
    overdue: boolean
    lastContactAt: string | null
}

function extractBusinessName(data: any): string {
    return data?.businessName || data?.brandIdentity?.core?.brandName || data?.business_name || 'Unknown business'
}
function extractPhone(data: any): string | null {
    return (
        (typeof data?.operationalData?.contact?.phone === 'string' ? data.operationalData.contact.phone : null) ||
        data?.internationalPhoneNumber ||
        data?.contactInfo?.phone ||
        data?.nationalPhoneNumber ||
        null
    )
}

async function getMyFollowups(userId: string): Promise<FollowupRow[]> {
    const admin = createAdminClient() as any
    const { data } = await admin
        .from('projects')
        .select(
            'id, business_data, sales_status, sales_next_followup_at, sales_last_contact_at',
        )
        .eq('sales_last_contact_by', userId)
        .not('sales_next_followup_at', 'is', null)
        .order('sales_next_followup_at', { ascending: true })
        .limit(200)

    const now = Date.now()
    return (data || []).map((row: any) => ({
        id: row.id,
        businessName: extractBusinessName(row.business_data),
        phone: extractPhone(row.business_data),
        salesStatus: (row.sales_status || 'new') as SalesStatus,
        followUpAt: row.sales_next_followup_at,
        overdue: new Date(row.sales_next_followup_at).getTime() < now,
        lastContactAt: row.sales_last_contact_at,
    }))
}

export default async function FollowupsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/sales-login')

    const followups = await getMyFollowups(user.id)
    const overdue = followups.filter((f) => f.overdue)
    const upcoming = followups.filter((f) => !f.overdue)

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">My follow-ups</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {followups.length} scheduled · {overdue.length} overdue
                </p>
            </div>

            {overdue.length > 0 && (
                <Section title="Overdue" items={overdue} highlight />
            )}
            <Section title="Upcoming" items={upcoming} />
        </div>
    )
}

function Section({
    title,
    items,
    highlight,
}: {
    title: string
    items: FollowupRow[]
    highlight?: boolean
}) {
    return (
        <section
            className={`rounded-xl border p-6 ${
                highlight ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200 bg-white'
            }`}
        >
            <h2
                className={`text-sm font-semibold mb-4 ${
                    highlight ? 'text-rose-700' : 'text-gray-900'
                }`}
            >
                {title} ({items.length})
            </h2>
            {items.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Nothing here.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((f) => (
                        <li
                            key={f.id}
                            className="py-3 flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                    {f.businessName}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {f.phone || 'no phone'} · last called {relativeTime(f.lastContactAt)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <LeadStatusChip status={f.salesStatus} />
                                    <div
                                        className={`text-xs mt-1 ${
                                            f.overdue ? 'text-rose-600' : 'text-gray-500'
                                        }`}
                                    >
                                        {formatDateTime(f.followUpAt)}
                                    </div>
                                </div>
                                <Link
                                    href={`/sales/leads/${f.id}`}
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
    )
}
