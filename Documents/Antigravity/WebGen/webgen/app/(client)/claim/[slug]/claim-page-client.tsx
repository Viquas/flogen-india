'use client'

import { useState } from 'react'
import type { Currency, PlanType } from '@/lib/claim-pricing'
import { CountdownTimer } from './components/countdown-timer'
import { PricingSection } from './components/pricing-section'
import { DomainSection, type DomainOption } from './components/domain-section'
import { SummaryCTA } from './components/summary-cta'

interface ClaimPageClientProps {
    initialCurrency: Currency
    expiresAt: string
    businessName: string
}

export default function ClaimPageClient({
    initialCurrency,
    expiresAt,
    businessName,
}: ClaimPageClientProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
    const [currency, setCurrency] = useState<Currency>(initialCurrency)
    const [domainOption, setDomainOption] = useState<DomainOption>('subdomain')
    const [domainValue, setDomainValue] = useState('')

    const handleProceedToPayment = () => {
        // Phase 8: Razorpay checkout integration
        console.log('[Claim] Proceed to payment:', { selectedPlan, currency, domainOption, domainValue })
        alert('Payment integration coming in Phase 8!')
    }

    return (
        <div className="space-y-0">
            {/* Countdown timer */}
            <section className="px-4 py-6 text-center">
                <CountdownTimer expiresAt={expiresAt} />
            </section>

            {/* Pricing section with currency toggle */}
            <section className="px-4 py-8">
                <PricingSection
                    initialCurrency={initialCurrency}
                    selectedPlan={selectedPlan}
                    onPlanSelect={setSelectedPlan}
                    onCurrencyChange={setCurrency}
                />
            </section>

            {/* Domain section -- only visible after plan selection */}
            {selectedPlan && (
                <section className="px-4 py-8 bg-[#F8FAFC]">
                    <DomainSection
                        businessName={businessName}
                        selectedOption={domainOption}
                        domainValue={domainValue}
                        onOptionChange={setDomainOption}
                        onDomainValueChange={setDomainValue}
                    />
                </section>
            )}

            {/* Summary CTA -- only visible after plan selection */}
            <SummaryCTA
                selectedPlan={selectedPlan}
                currency={currency}
                domainOption={domainOption}
                domainValue={domainValue}
                onProceedToPayment={handleProceedToPayment}
            />
        </div>
    )
}
