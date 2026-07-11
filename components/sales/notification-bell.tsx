'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { loadNotifications } from '@/app/(sales)/sales/notifications-actions'
import type { NotificationRow, NotificationType } from '@/lib/sales/notifications'
import { relativeTime } from '@/lib/sales/format'

const LABEL: Record<NotificationType, string> = {
    demo_viewed: 'viewed their demo site',
    pitch_viewed: 'viewed their pitch',
    cta_clicked: 'clicked the CTA',
    interest_submitted: 'submitted interest — follow up now',
    claim_started: 'started claiming their site',
    claim_paid: 'paid — 🎉 converted',
    deliverable_ready: 'deliverable is ready to send',
}

function describe(n: NotificationRow): string {
    const name = (n.payload?.businessName as string) || 'A lead'
    return `${name} ${LABEL[n.type]}`
}

export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
    const router = useRouter()
    const [unread, setUnread] = useState(initialUnread)
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<NotificationRow[]>([])
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Live badge: subscribe to inserts for this rep.
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                (payload) => {
                    setUnread((u) => u + 1)
                    const row = payload.new as { type?: NotificationType; payload?: Record<string, unknown> }
                    const name = (row.payload?.businessName as string) || 'A lead'
                    if (row.type) toast(`${name} ${LABEL[row.type]}`)
                },
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    // Close on outside click.
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const toggle = async () => {
        const next = !open
        setOpen(next)
        if (next) {
            setLoading(true)
            try {
                const rows = await loadNotifications()
                setItems(rows)
                setUnread(0)
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={toggle}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {loading && <p className="px-4 py-6 text-center text-sm text-gray-400">Loading…</p>}
                        {!loading && items.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-gray-400">Nothing yet.</p>
                        )}
                        {!loading &&
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => {
                                        setOpen(false)
                                        if (n.projectId) router.push(`/sales/leads/${n.projectId}`)
                                    }}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${n.readAt ? '' : 'bg-emerald-50/40'}`}
                                >
                                    <p className="text-sm text-gray-800">{describe(n)}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    )
}
