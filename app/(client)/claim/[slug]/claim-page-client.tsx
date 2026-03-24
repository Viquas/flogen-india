'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import type { PlanType } from '@/lib/claim-pricing'
import { CountdownTimer } from './components/countdown-timer'
import { PricingSection } from './components/pricing-section'
import { DomainSection, type DomainOption } from './components/domain-section'
import { SummaryCTA } from './components/summary-cta'
import { createRazorpayOrder } from './claim-actions'

interface ClaimPageClientProps {
    projectId: string
    expiresAt: string
    businessName: string
    slug: string
}

export default function ClaimPageClient({
    projectId,
    expiresAt,
    businessName,
    slug,
}: ClaimPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
    const [domainOption, setDomainOption] = useState<DomainOption>('subdomain')
    const [domainValue, setDomainValue] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('payment') === 'failed') {
            setPaymentError('Your previous payment was not completed. You can try again.')
        }
    }, [searchParams])

    const handleProceedToPayment = async () => {
        if (!selectedPlan || isProcessing) return
        setIsProcessing(true)
        setPaymentError(null)

        try {
            const result = await createRazorpayOrder({
                projectId,
                plan: selectedPlan,
            })

            if (!result.success) {
                setPaymentError(result.error)
                setIsProcessing(false)
                return
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                order_id: result.orderId,
                name: 'Flogen',
                description: `${selectedPlan === 'pro' ? 'Pro' : 'Standard'} Website Plan`,
                prefill: { name: businessName },
                handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                    router.push(`/claim/${slug}/confirmed?claimId=${result.claimId}`)
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false)
                    },
                },
                theme: { color: '#2563EB' },
            }

            const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void; on: (event: string, handler: (resp: { error?: { description?: string } }) => void) => void } }).Razorpay(options)
            rzp.on('payment.failed', (response: { error?: { description?: string } }) => {
                setPaymentError(response.error?.description || 'Payment failed. Please try again.')
                setIsProcessing(false)
            })
            rzp.open()
        } catch {
            setPaymentError('Something went wrong. Please try again.')
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-0">
            {/* Countdown timer */}
            <section className="px-4 py-8">
                <CountdownTimer expiresAt={expiresAt} />
            </section>

            {/* Pricing section */}
            <section id="pricing" className="px-4 py-10 scroll-mt-4">
                <PricingSection
                    selectedPlan={selectedPlan}
                    onPlanSelect={setSelectedPlan}
                />
            </section>

            {/* Domain section — only visible after plan selection */}
            {selectedPlan && (
                <section className="px-4 py-10">
                    <div className="max-w-2xl mx-auto">
                        <DomainSection
                            businessName={businessName}
                            selectedOption={domainOption}
                            domainValue={domainValue}
                            onOptionChange={setDomainOption}
                            onDomainValueChange={setDomainValue}
                        />
                    </div>
                </section>
            )}

            {/* Summary CTA — only visible after plan selection */}
            <div className="max-w-2xl mx-auto">
                <SummaryCTA
                    selectedPlan={selectedPlan}
                    domainOption={domainOption}
                    domainValue={domainValue}
                    onProceedToPayment={handleProceedToPayment}
                    isProcessing={isProcessing}
                    paymentError={paymentError}
                />
            </div>

            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </div>
    )
}
