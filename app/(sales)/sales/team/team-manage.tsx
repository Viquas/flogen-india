'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, UserPlus } from 'lucide-react'
import { addSalesperson, removeSalesperson } from '../actions'

interface Member {
    userId: string
    email: string
    role: 'admin' | 'sales'
}

export function TeamManage({ members }: { members: Member[] }) {
    const [email, setEmail] = useState('')
    const [isPending, startTransition] = useTransition()

    function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return
        startTransition(async () => {
            const res = await addSalesperson({ email: email.trim() })
            if (res.success) {
                toast.success('Sales role granted')
                setEmail('')
            } else {
                toast.error(res.error)
            }
        })
    }

    function handleRemove(userId: string, memberEmail: string) {
        if (!confirm(`Remove sales access for ${memberEmail}?`)) return
        startTransition(async () => {
            const res = await removeSalesperson({ userId })
            if (res.success) toast.success('Sales role removed')
            else toast.error(res.error)
        })
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Manage team (admin)</h2>

            <form onSubmit={handleAdd} className="flex gap-2 mb-5">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="new-salesperson@company.com"
                    className="flex-1 h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                    <UserPlus className="h-4 w-4" />
                    Grant
                </button>
            </form>

            <ul className="divide-y divide-gray-100">
                {members.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-400">No team members yet.</li>
                )}
                {members.map((m) => (
                    <li key={m.userId} className="py-3 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-medium text-gray-900">{m.email}</div>
                            <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                        </div>
                        {m.role === 'sales' && (
                            <button
                                type="button"
                                onClick={() => handleRemove(m.userId, m.email)}
                                className="text-gray-400 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-colors"
                                aria-label={`Remove ${m.email}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            <p className="text-xs text-gray-400 mt-4">
                To add a salesperson, they must first create an auth account (via Supabase dashboard or a
                shared signup flow). Then grant them the sales role here.
            </p>
        </div>
    )
}
