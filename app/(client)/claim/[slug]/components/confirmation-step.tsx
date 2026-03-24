'use client'

import { Loader2 } from 'lucide-react'
import type { PlanType } from '@/lib/claim-pricing'
import {
    DISPLAY_PRICING,
    HOSTING_PRICING,
    CURRENCY_SYMBOL,
    getDisplayTotal,
} from '@/lib/claim-pricing'

interface ConfirmationStepProps {
    plan: PlanType
    onConfirm: () => void
    onCancel: () => void
    isProcessing: boolean
}

export function ConfirmationStep({
    plan,
    onConfirm,
    onCancel,
    isProcessing,
}: ConfirmationStepProps) {
    const planLabel = plan === 'pro' ? 'Pro' : 'Standard'

    return (
        <div className="max-w-md mx-auto rounded-2xl border border-[#050304]/10 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#050304] text-center">
                Confirm your plan
            </h3>

            <div className="mt-4 space-y-2 text-sm text-[#050304]/70">
                <div className="flex justify-between">
                    <span>{planLabel} Website</span>
                    <span className="font-medium text-[#050304]">
                        {CURRENCY_SYMBOL}{DISPLAY_PRICING[plan]}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Hosting (monthly)</span>
                    <span className="font-medium text-[#050304]">
                        {CURRENCY_SYMBOL}{HOSTING_PRICING.display}/mo
                    </span>
                </div>
                <div className="border-t border-[#050304]/10 pt-2 flex justify-between font-semibold text-[#050304]">
                    <span>Total due today</span>
                    <span>{getDisplayTotal(plan)}</span>
                </div>
            </div>

            <button
                type="button"
                onClick={onConfirm}
                disabled={isProcessing}
                className="mt-6 w-full py-3 rounded-full bg-[#050304] text-white font-semibold text-sm transition-all hover:bg-[#050304]/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    'Confirm & Pay'
                )}
            </button>

            <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="mt-2 w-full py-2 text-sm text-[#050304]/50 hover:text-[#050304]/70 transition-colors disabled:opacity-40"
            >
                Change Plan
            </button>
        </div>
    )
}
