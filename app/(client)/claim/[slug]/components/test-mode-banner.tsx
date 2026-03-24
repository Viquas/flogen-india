'use client'

import { AlertTriangle } from 'lucide-react'

export function TestModeBanner() {
    if (process.env.NEXT_PUBLIC_RAZORPAY_MODE !== 'test') return null

    return (
        <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            TEST MODE — No real charges will be made
        </div>
    )
}
