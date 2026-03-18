'use client'

import { Lock } from 'lucide-react'
import type { DomainOption } from './domain-section'
import {
    DISPLAY_PRICING,
    CURRENCY_SYMBOL,
    HOSTING_PRICING,
    GST_DISPLAY,
    getDisplayTotal,
    type Currency,
    type PlanType,
} from '@/lib/claim-pricing'

interface SummaryCTAProps {
    selectedPlan: PlanType | null
    currency: Currency
    domainOption: DomainOption
    domainValue: string
    onProceedToPayment: () => void
    isProcessing?: boolean
    paymentError?: string | null
}

function getDomainLabel(option: DomainOption, value: string): string {
    switch (option) {
        case 'subdomain':
            return 'Free subdomain included'
        case 'existing':
            return value ? `Connect domain: ${value}` : 'Connect your domain'
        case 'new':
            return 'Domain purchase: setup during onboarding'
    }
}

export function SummaryCTA({
    selectedPlan,
    currency,
    domainOption,
    domainValue,
    onProceedToPayment,
    isProcessing = false,
    paymentError = null,
}: SummaryCTAProps) {
    if (!selectedPlan) {
        return null
    }

    const planLabel = selectedPlan === 'standard' ? 'Standard' : 'Pro'
    const planPrice = DISPLAY_PRICING[selectedPlan][currency]
    const symbol = CURRENCY_SYMBOL[currency]
    const hostingDisplay = HOSTING_PRICING[currency].display

    return (
        <section className="px-4 py-6 bg-white border-t border-gray-100">
            {/* Line items */}
            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{planLabel} Plan</span>
                    <span className="text-sm font-semibold text-[#0F172A]">
                        {symbol}{planPrice}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Domain</span>
                    <span className="text-sm text-gray-500">
                        {getDomainLabel(domainOption, domainValue)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hosting</span>
                    <span className="text-sm text-gray-500">
                        {symbol}{hostingDisplay}/month
                    </span>
                </div>

                {/* GST line item -- INR only */}
                {currency === 'INR' && GST_DISPLAY[selectedPlan].INR && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">GST (18%)</span>
                        <span className="text-sm text-gray-500">
                            {symbol}{GST_DISPLAY[selectedPlan].INR}
                        </span>
                    </div>
                )}

                <hr className="border-gray-100" />

                {/* Total -- includes plan + hosting + GST(INR) */}
                <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-gray-600">Total</span>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-[#0F172A]">
                            {symbol}{getDisplayTotal(selectedPlan, currency)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment error banner */}
            {paymentError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {paymentError}
                </div>
            )}

            {/* CTA button */}
            <button
                type="button"
                onClick={onProceedToPayment}
                disabled={isProcessing}
                className="w-full py-4 bg-[#2563EB] text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </button>

            {/* Trust text */}
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center mt-2">
                <Lock className="w-3 h-3" />
                Secure payment via Razorpay
            </p>
        </section>
    )
}
