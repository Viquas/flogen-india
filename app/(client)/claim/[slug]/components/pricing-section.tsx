'use client'

import { ArrowRight, Crown } from 'lucide-react'
import Script from 'next/script'
import {
    DISPLAY_PRICING,
    CURRENCY_SYMBOL,
    HOSTING_PRICING,
    type PlanType,
} from '@/lib/claim-pricing'

interface PricingSectionProps {
    selectedPlan: PlanType | null
    onPlanSelect: (plan: PlanType) => void
    onGetStarted: () => void
    projectId: string
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

const PREMIUM_FEATURES = [
    'Fully custom design',
    'Award-winning aesthetics',
    'High-end SEO strategy',
    'Conversion optimization',
    'Dedicated project manager',
    'Unlimited revisions',
]

function Dot({ className }: { className?: string }) {
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${className}`} />
}

export function PricingSection({
    selectedPlan,
    onPlanSelect,
    onGetStarted,
    projectId,
}: PricingSectionProps) {
    const handleStandardClick = () => {
        if (selectedPlan === 'standard') {
            onGetStarted()
        } else {
            onPlanSelect('standard')
        }
    }

    const handleProClick = () => {
        if (selectedPlan === 'pro') {
            onGetStarted()
        } else {
            onPlanSelect('pro')
        }
    }

    const handlePremiumClick = () => {
        fetch('/api/analytics/claim-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'premium_contact', projectId }),
        }).catch(() => {}) // fire-and-forget
    }

    return (
        <section className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-signifier)] font-light text-[#050304] text-center mb-10">
                Choose your plan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Standard */}
                <div
                    className={`rounded-2xl p-6 cursor-pointer transition-all bg-white border flex flex-col ${
                        selectedPlan === 'standard'
                            ? 'border-[#050304] shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
                            : 'border-[#050304]/8 hover:border-[#050304]/20'
                    }`}
                    onClick={handleStandardClick}
                >
                    <h3 className="text-lg font-bold text-[#050304]">Standard</h3>
                    <div className="mt-3">
                        <span className="text-3xl font-bold text-[#050304]">
                            {CURRENCY_SYMBOL}{DISPLAY_PRICING.standard}
                        </span>
                        <span className="text-sm text-[#050304]/40 ml-1">one-time</span>
                    </div>
                    <p className="text-xs text-[#050304]/25 mt-1">
                        + {CURRENCY_SYMBOL}{HOSTING_PRICING.display}/mo hosting
                    </p>

                    <ul className="mt-6 space-y-3 flex-1">
                        {STANDARD_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-sm text-[#050304]/70">
                                <Dot className="bg-[#050304]/20" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleStandardClick()
                        }}
                        className={`w-full py-3 rounded-full font-semibold transition-all mt-6 text-sm ${
                            selectedPlan === 'standard'
                                ? 'bg-[#050304] text-white'
                                : 'bg-[#050304]/5 text-[#050304] hover:bg-[#050304]/10'
                        }`}
                    >
                        {selectedPlan === 'standard' ? 'Get Started' : 'Select Standard'}
                    </button>
                </div>

                {/* Pro */}
                <div
                    className={`relative rounded-2xl p-6 cursor-pointer transition-all bg-[#050304] border border-[#050304] flex flex-col ${
                        selectedPlan === 'pro' ? 'shadow-[0_4px_32px_rgba(0,0,0,0.2)]' : ''
                    }`}
                    onClick={handleProClick}
                >
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#AF92FF] text-[#050304] text-xs font-semibold px-4 py-1 rounded-full">
                        Recommended
                    </span>

                    <h3 className="text-lg font-bold text-white">Pro</h3>
                    <div className="mt-3">
                        <span className="text-3xl font-bold text-white">
                            {CURRENCY_SYMBOL}{DISPLAY_PRICING.pro}
                        </span>
                        <span className="text-sm text-white/35 ml-1">one-time</span>
                    </div>
                    <p className="text-xs text-white/20 mt-1">
                        + {CURRENCY_SYMBOL}{HOSTING_PRICING.display}/mo hosting
                    </p>

                    <ul className="mt-6 space-y-3 flex-1">
                        {PRO_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                                <Dot className="bg-[#AF92FF]" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleProClick()
                        }}
                        className={`w-full py-3 rounded-full font-semibold transition-all mt-6 text-sm ${
                            selectedPlan === 'pro'
                                ? 'bg-[#AF92FF] text-[#050304]'
                                : 'bg-white/10 text-white hover:bg-white/15'
                        }`}
                    >
                        {selectedPlan === 'pro' ? 'Get Started' : 'Select Pro'}
                    </button>
                </div>

                {/* Premium -- Cal.com popup */}
                <div className="rounded-2xl p-6 bg-white border border-[#050304]/8 flex flex-col">
                    <h3 className="text-lg font-bold text-[#050304] flex items-center gap-2">
                        Premium
                        <Crown className="w-4 h-4 text-[#AF92FF]" strokeWidth={1.5} />
                    </h3>
                    <div className="mt-3">
                        <span className="text-3xl font-bold text-[#050304]">
                            From $3,000
                        </span>
                    </div>
                    <p className="text-xs text-[#050304]/25 mt-1">
                        Custom quote based on scope
                    </p>

                    <ul className="mt-6 space-y-3 flex-1">
                        {PREMIUM_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-sm text-[#050304]/70">
                                <Dot className="bg-[#AF92FF]" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        data-cal-link={process.env.NEXT_PUBLIC_CAL_LINK || 'essodigital/30min'}
                        data-cal-config='{"layout":"month_view"}'
                        onClick={handlePremiumClick}
                        className="w-full py-3 rounded-full font-semibold transition-all mt-6 text-sm bg-[#050304]/5 text-[#050304] hover:bg-[#050304]/10 flex items-center justify-center gap-2"
                    >
                        Contact Us
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <Script
                src="https://app.cal.com/embed/embed.js"
                strategy="lazyOnload"
                onLoad={() => {
                    // @ts-expect-error Cal is injected by CDN script
                    if (typeof Cal !== 'undefined') Cal('init', { origin: 'https://cal.com' })
                }}
            />
        </section>
    )
}
