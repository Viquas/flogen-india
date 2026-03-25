'use client'

import { useState } from 'react'
import { Loader2, X, Check } from 'lucide-react'
import type { PlanType } from '@/lib/claim-pricing'
import {
    DISPLAY_PRICING,
    HOSTING_PRICING,
    CURRENCY_SYMBOL,
    getDisplayTotal,
} from '@/lib/claim-pricing'

const MAINTENANCE_PRICE = 149
const MAINTENANCE_BENEFITS = [
    'Monthly content & design updates',
    'Performance monitoring & optimization',
    'Security patches & backups',
    'Priority bug fixes (24h response)',
    'SEO health checks & adjustments',
    'Analytics reporting',
]

interface ConfirmationStepProps {
    plan: PlanType
    onConfirm: (addMaintenance: boolean) => void
    onCancel: () => void
    isProcessing: boolean
}

export function ConfirmationStep({
    plan,
    onConfirm,
    onCancel,
    isProcessing,
}: ConfirmationStepProps) {
    const [addMaintenance, setAddMaintenance] = useState(false)
    const planLabel = plan === 'pro' ? 'Pro' : 'Standard'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={isProcessing ? undefined : onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                {!isProcessing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-[#050304]/30 hover:text-[#050304]/60 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                <h3 className="text-lg font-bold text-[#050304] text-center">
                    Confirm your plan
                </h3>

                {/* Order summary */}
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
                            {CURRENCY_SYMBOL}{HOSTING_PRICING[plan].display}/mo
                        </span>
                    </div>
                    {addMaintenance && (
                        <div className="flex justify-between">
                            <span>Maintenance pack (monthly)</span>
                            <span className="font-medium text-[#050304]">
                                {CURRENCY_SYMBOL}{MAINTENANCE_PRICE}/mo
                            </span>
                        </div>
                    )}
                    <div className="border-t border-[#050304]/10 pt-2 flex justify-between font-semibold text-[#050304]">
                        <span>Total due today</span>
                        <span>{getDisplayTotal(plan)}</span>
                    </div>
                </div>

                {/* Maintenance pack upsell */}
                <div className="mt-5">
                    <button
                        type="button"
                        onClick={() => setAddMaintenance(!addMaintenance)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                            addMaintenance
                                ? 'border-[#AF92FF] bg-[#AF92FF]/5'
                                : 'border-[#050304]/8 hover:border-[#050304]/15'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-semibold text-[#050304]">
                                    Add Maintenance Pack
                                </span>
                                <span className="ml-2 text-sm text-[#050304]/50">
                                    {CURRENCY_SYMBOL}{MAINTENANCE_PRICE}/mo
                                </span>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                addMaintenance
                                    ? 'bg-[#AF92FF] border-[#AF92FF]'
                                    : 'border-[#050304]/20'
                            }`}>
                                {addMaintenance && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                        </div>
                        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {MAINTENANCE_BENEFITS.map((benefit) => (
                                <li key={benefit} className="flex items-start gap-1.5 text-xs text-[#050304]/50">
                                    <span className="w-1 h-1 rounded-full bg-[#AF92FF] shrink-0 mt-1.5" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => onConfirm(addMaintenance)}
                    disabled={isProcessing}
                    className="mt-5 w-full py-3 rounded-full bg-[#050304] text-white font-semibold text-sm transition-all hover:bg-[#050304]/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
    )
}
