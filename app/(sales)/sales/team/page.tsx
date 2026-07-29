import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamStats } from '@/lib/sales/get-leads'
import { TeamManage } from './team-manage'

export default async function TeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/sales-login')

    const [stats, isAdmin] = await Promise.all([
        getTeamStats(),
        checkIsAdmin(user.id),
    ])

    // Admin section: list all admin/sales members with email resolution
    let members: { userId: string; email: string; role: 'admin' | 'sales' }[] = []
    if (isAdmin) {
        const admin = createAdminClient() as any
        const { data: roles } = await admin
            .from('user_roles')
            .select('id, role')
            .in('role', ['admin', 'sales'])
        const rows = (roles || []) as Array<{ id: string; role: 'admin' | 'sales' }>

        // Resolve emails
        const emails = new Map<string, string>()
        await Promise.all(
            rows.map(async (r) => {
                try {
                    const { data } = await createAdminClient().auth.admin.getUserById(r.id)
                    if (data?.user?.email) emails.set(r.id, data.user.email)
                } catch {
                    /* ignore */
                }
            }),
        )
        members = rows.map((r) => ({
            userId: r.id,
            email: emails.get(r.id) || '(unknown)',
            role: r.role,
        }))
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Leaderboard by conversions. Conversions are counted when a claim is paid.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Salesperson</th>
                            <th className="px-4 py-3">Calls (total)</th>
                            <th className="px-4 py-3">Calls (week)</th>
                            <th className="px-4 py-3">Interested</th>
                            <th className="px-4 py-3">Callbacks</th>
                            <th className="px-4 py-3">Closed</th>
                            <th className="px-4 py-3">Paid conversions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                    No sales team members yet.
                                </td>
                            </tr>
                        )}
                        {stats.map((s) => (
                            <tr
                                key={s.userId}
                                className="border-b border-gray-100 last:border-b-0"
                            >
                                <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                                <td className="px-4 py-3 text-gray-700">{s.callsTotal}</td>
                                <td className="px-4 py-3 text-gray-700">{s.callsWeek}</td>
                                <td className="px-4 py-3 text-gray-700">{s.outcomes.interested}</td>
                                <td className="px-4 py-3 text-gray-700">
                                    {s.outcomes.callback_scheduled}
                                </td>
                                <td className="px-4 py-3 text-gray-700">{s.outcomes.closed}</td>
                                <td className="px-4 py-3 font-semibold text-emerald-700">
                                    {s.conversions}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAdmin && <TeamManage members={members} />}
        </div>
    )
}
