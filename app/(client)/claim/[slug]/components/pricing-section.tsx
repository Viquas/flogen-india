'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import {
    DISPLAY_PRICING,
    CURRENCY_SYMBOL,
    HOSTING_PRICING,
    type Currency,
    type PlanType,
} from '@/lib/claim-pricing'

interface PricingSectionProps {
    initialCurrency: Currency
    selectedPlan: PlanType | null
    onPlanSelect: (plan: PlanType) => void
    onCurrencyChange: (currency: Currency) => void
}

const STANDARD_FEATURES = [
    'Custom website design',
    'Mobile responsive',
    'SEO optimized',
    'Contact form',
    'Free subdomain',
]

const PRO_FEATURES = [
    'Everything in Standard',
    'Booking system',
    'Priority support',
    'Strategy call included',
    'Advanced SEO',
    'Analytics dashboard',
    'Premium hosting',
]

export function PricingSection({
    initialCurrency,
    selectedPlan,
    onPlanSelect,
    onCurrencyChange,
}: PricingSectionProps) {
    const [currency, setCurrency] = useState<Currency>(initialCurrency)

    function handleCurrencyChange(newCurrency: Currency) {
        setCurrency(newCurrency)
        onCurrencyChange(newCurrency)
    }

    return (
        <section>
            <h2 className="text-xl font-bold text-[#0F172A] text-center mb-2">
                Choose Your Plan
            </h2>

            {/* Currency toggle */}
            <div className="flex justify-center mt-4">
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                    {(['INR', 'USD'] as const).map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => handleCurrencyChange(c)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currency === c
                                    ? 'bg-[#2563EB] text-white'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {CURRENCY_SYMBOL[c]} {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {/* Standard card */}
                <div
                    className={`border rounded-2xl p-6 cursor-pointer transition-all ${
                        selectedPlan === 'standard'
                            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20'
                            : 'border-gray-200'
                    }`}
                    onClick={() => onPlanSelect('standard')}
                >
                    <h3 className="text-lg font-bold text-[#0F172A]">Standard</h3>
                    <div className="mt-3">
                        <span className="text-3xl sm:text-4xl font-bold text-[#0F172A]">
                            {CURRENCY_SYMBOL[currency]}{DISPLAY_PRICING.standard[currency]}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">one-time</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        + {CURRENCY_SYMBOL[currency]}{HOSTING_PRICING[currency].display}/mo hosting
                    </p>

                    <ul className="mt-5 space-y-3">
                        {STANDARD_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="text-[#2563EB] w-4 h-4 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={() => onPlanSelect('standard')}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors mt-6 ${
                            selectedPlan === 'standard'
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
                        }`}
                    >
                        {selectedPlan === 'standard' ? 'Selected' : 'Select Standard'}
                    </button>
                </div>

                {/* Pro card */}
                <div
                    className={`relative border-2 border-[#2563EB] rounded-2xl p-6 cursor-pointer transition-all ${
                        selectedPlan === 'pro' ? 'ring-2 ring-[#2563EB]/20' : ''
                    }`}
                    onClick={() => onPlanSelect('pro')}
                >
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Recommended
                    </span>

                    <h3 className="text-lg font-bold text-[#0F172A]">Pro</h3>
                    <div className="mt-3">
                        <span className="text-3xl sm:text-4xl font-bold text-[#0F172A]">
                            {CURRENCY_SYMBOL[currency]}{DISPLAY_PRICING.pro[currency]}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">one-time</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        + {CURRENCY_SYMBOL[currency]}{HOSTING_PRICING[currency].display}/mo hosting
                    </p>

                    <ul className="mt-5 space-y-3">
                        {PRO_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="text-[#2563EB] w-4 h-4 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={() => onPlanSelect('pro')}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors mt-6 ${
                            selectedPlan === 'pro'
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-gray-100 text-[#0F172A] hover:bg-gray-200'
                        }`}
                    >
                        {selectedPlan === 'pro' ? 'Selected' : 'Select Pro'}
                    </button>
                </div>
            </div>
        </section>
    )
}
