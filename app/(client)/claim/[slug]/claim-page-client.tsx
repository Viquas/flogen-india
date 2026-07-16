'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import type { PlanType } from '@/lib/claim-pricing'
import { trackClientEvent } from '@/lib/analytics/track'
import { CountdownTimer } from './components/countdown-timer'
import { PricingSection } from './components/pricing-section'
import { ConfirmationStep } from './components/confirmation-step'
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
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('payment') === 'failed') {
            setPaymentError('Your previous payment was not completed. You can try again.')
        }
    }, [searchParams])

    const handlePlanSelect = (plan: PlanType) => {
        setSelectedPlan(plan)
        setShowConfirmation(true)
        setPaymentError(null)
        trackClientEvent('claim.form_submitted', { slug, projectId, plan })
    }

    const handleGetStarted = () => {
        if (!selectedPlan) return
        setShowConfirmation(true)
        setPaymentError(null)
    }

    const handleProceedToPayment = async (addMaintenance?: boolean) => {
        if (!selectedPlan || isProcessing) return
        setIsProcessing(true)
        setPaymentError(null)

        try {
            const result = await createRazorpayOrder({
                projectId,
                plan: selectedPlan,
                addMaintenance: addMaintenance ?? false,
            })

            if (!result.success) {
                setPaymentError(result.error)
                setIsProcessing(false)
                return
            }

            const razorpayMode = process.env.NEXT_PUBLIC_RAZORPAY_MODE || 'test'
            const razorpayKey = razorpayMode === 'test'
                ? process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID
                : process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID

            const options = {
                key: razorpayKey,
                order_id: result.orderId,
                name: 'Sumosite',
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
                trackClientEvent('payment.failed', { slug, projectId, plan: selectedPlan })
            })
            rzp.open()
            trackClientEvent('payment.checkout_opened', { slug, projectId, plan: selectedPlan })
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
                    onPlanSelect={handlePlanSelect}
                    onGetStarted={handleGetStarted}
                    projectId={projectId}
                />
            </section>

            {/* Confirmation step -- visible after clicking "Get Started" */}
            {showConfirmation && selectedPlan && (
                <ConfirmationStep
                    plan={selectedPlan}
                    onConfirm={handleProceedToPayment}
                    onCancel={() => setShowConfirmation(false)}
                    isProcessing={isProcessing}
                />
            )}

            {/* Payment error */}
            {paymentError && (
                <div className="max-w-md mx-auto px-4">
                    <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg py-3 px-4">
                        {paymentError}
                    </p>
                </div>
            )}

            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </div>
    )
}
