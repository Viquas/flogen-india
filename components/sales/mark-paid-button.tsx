'use client'

import { useState, useTransition } from 'react'
import { BadgeCheck, Loader2 } from 'lucide-react'
import { markLeadPaid } from '@/app/(sales)/sales/leads/[id]/payment-actions'

interface MarkPaidButtonProps {
    projectId: string
    businessName: string
    isPaid: boolean
}

/**
 * Records an offline payment (PAYMENT_MODE='manual'). Stamps claims.paid_at, which
 * is what drives conversion metrics and removes the lead from the follow-up queue.
 * Confirms first — marking paid by mistake inflates conversions and silently drops
 * the lead out of follow-ups.
 */
export function MarkPaidButton({ projectId, businessName, isPaid }: MarkPaidButtonProps) {
    const [paid, setPaid] = useState(isPaid)
    const [confirming, setConfirming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    if (paid) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                <BadgeCheck className="h-3.5 w-3.5" /> Paid
            </span>
        )
    }

    const confirm = () => {
        setError(null)
        startTransition(async () => {
            const res = await markLeadPaid({ projectId })
            if (res.ok) {
                setPaid(true)
                setConfirming(false)
            } else {
                setError(res.error || 'Could not record the payment.')
            }
        })
    }

    if (confirming) {
        return (
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Mark {businessName} as paid?</span>
                    <button
                        onClick={confirm}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 text-xs rounded-md bg-emerald-600 px-2.5 py-1.5 text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Confirm
                    </button>
                    <button
                        onClick={() => setConfirming(false)}
                        disabled={isPending}
                        className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        )
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 text-xs rounded-md border border-gray-200 px-2.5 py-1.5 text-gray-700 hover:bg-gray-50"
        >
            <BadgeCheck className="h-3.5 w-3.5" /> Mark as paid
        </button>
    )
}
