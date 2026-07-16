'use client'

import { useState } from 'react'
import { Loader2, X, Check, Shield, Zap, Wrench, BarChart3, Bug, Search } from 'lucide-react'
import type { PlanType } from '@/lib/claim-pricing'
import {
    DISPLAY_PRICING,
    HOSTING_PRICING,
    MAINTENANCE_PRICING,
    CURRENCY_SYMBOL,
    getDisplayTotal,
} from '@/lib/claim-pricing'

const MAINTENANCE_BENEFITS = [
    { icon: Wrench, label: 'Monthly content & design updates' },
    { icon: Zap, label: 'Performance monitoring' },
    { icon: Shield, label: 'Security patches & backups' },
    { icon: Bug, label: 'Priority bug fixes (24h)' },
    { icon: Search, label: 'SEO health checks' },
    { icon: BarChart3, label: 'Analytics reporting' },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={isProcessing ? undefined : onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-[420px] rounded-2xl bg-[#050304] text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    {!isProcessing && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    )}

                    <p className="text-xs font-medium text-[#AF92FF] tracking-wide uppercase">Order Summary</p>
                    <h3 className="text-xl font-bold text-white mt-1">
                        {planLabel} Plan
                    </h3>
                </div>

                {/* Line items */}
                <div className="px-6 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">{planLabel} Website</span>
                        <span className="font-semibold text-white">
                            {CURRENCY_SYMBOL}{DISPLAY_PRICING[plan]}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Hosting</span>
                        <span className="text-white/80">
                            {CURRENCY_SYMBOL}{HOSTING_PRICING[plan].display}/mo
                        </span>
                    </div>
                    {addMaintenance && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Maintenance Pack</span>
                            <span className="text-white/80">
                                {CURRENCY_SYMBOL}{MAINTENANCE_PRICING[plan].display}/mo
                            </span>
                        </div>
                    )}
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">Due today</span>
                        <span className="text-lg font-bold text-white">{getDisplayTotal(plan)}</span>
                    </div>
                </div>

                {/* Maintenance upsell */}
                <div className="px-6 mt-5">
                    <button
                        type="button"
                        onClick={() => setAddMaintenance(!addMaintenance)}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                            addMaintenance
                                ? 'border-[#AF92FF]/50 bg-[#AF92FF]/8'
                                : 'border-white/8 hover:border-white/15 bg-white/3'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                    Maintenance Pack
                                </span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#AF92FF]/15 text-[#AF92FF]">
                                    {CURRENCY_SYMBOL}{MAINTENANCE_PRICING[plan].display}/mo
                                </span>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                addMaintenance
                                    ? 'bg-[#AF92FF] border-[#AF92FF]'
                                    : 'border-white/20'
                            }`}>
                                {addMaintenance && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {MAINTENANCE_BENEFITS.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2 text-xs text-white/40">
                                    <Icon className="w-3 h-3 text-[#AF92FF]/60 shrink-0" />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </button>
                </div>

                {/* Actions */}
                <div className="px-6 pt-5 pb-6 space-y-2">
                    <button
                        type="button"
                        onClick={() => onConfirm(addMaintenance)}
                        disabled={isProcessing}
                        className="w-full py-3.5 rounded-full bg-[#AF92FF] text-[#050304] font-semibold text-sm transition-all hover:bg-[#C4B1FF] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        className="w-full py-2.5 text-sm text-white/30 hover:text-white/50 transition-colors disabled:opacity-40"
                    >
                        Change Plan
                    </button>
                </div>
            </div>
        </div>
    )
}
