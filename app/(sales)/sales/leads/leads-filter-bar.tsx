'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { STATUS_LABELS } from '@/components/sales/lead-status-chip'
import type { SalesStatus } from '@/lib/sales/get-leads'

const STATUS_ORDER: SalesStatus[] = [
    'new',
    'attempted',
    'in_conversation',
    'interested',
    'closed',
    'not_interested',
    'do_not_call',
]

export function LeadsFilterBar() {
    const router = useRouter()
    const params = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const currentStatus = params.get('status') || ''
    const currentSearch = params.get('q') || ''
    const currentIndustry = params.get('industry') || ''
    const currentFollowup = params.get('followup') || ''

    function update(next: Record<string, string | null>) {
        const u = new URLSearchParams(params.toString())
        for (const [k, v] of Object.entries(next)) {
            if (v === null || v === '') u.delete(k)
            else u.set(k, v)
        }
        startTransition(() => {
            router.replace(`/sales/leads?${u.toString()}`)
        })
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                type="search"
                defaultValue={currentSearch}
                placeholder="Search name or phone..."
                onChange={(e) => update({ q: e.target.value })}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 w-64"
            />
            <select
                value={currentStatus}
                onChange={(e) => update({ status: e.target.value || null })}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
            >
                <option value="">All statuses</option>
                {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                    </option>
                ))}
            </select>
            <input
                type="text"
                defaultValue={currentIndustry}
                placeholder="Industry"
                onChange={(e) => update({ industry: e.target.value })}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 w-40"
            />
            <select
                value={currentFollowup}
                onChange={(e) => update({ followup: e.target.value || null })}
                className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
            >
                <option value="">All leads</option>
                <option value="yes">Has follow-up</option>
                <option value="no">No follow-up</option>
            </select>
            {isPending && <span className="text-xs text-gray-400">Updating...</span>}
        </div>
    )
}
