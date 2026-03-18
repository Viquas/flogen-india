'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Phone } from 'lucide-react'
import {
    CURRENCY_SYMBOL,
    UPSELL_DISPLAY,
    type Currency,
} from '@/lib/claim-pricing'
import { createUpsellOrder, updateStrategyCallPreference } from '../claim-actions'

interface UpsellClientProps {
    claimId: string
    plan: 'standard' | 'pro'
    currency: Currency
    clientName: string
    clientEmail: string
    slug: string
}

export default function UpsellClient({
    claimId,
    plan,
    currency,
    clientName,
    clientEmail,
    slug,
}: UpsellClientProps) {
    const router = useRouter()

    const isPro = plan === 'pro'
    const [hasPaidUpsell, setHasPaidUpsell] = useState(isPro)
    const [showCalendar, setShowCalendar] = useState(isPro)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState<string | null>(null)
    const [isSkipping, setIsSkipping] = useState(false)

    const calLink = process.env.NEXT_PUBLIC_CAL_LINK || ''
    const hasCalLink = calLink.length > 0

    const handleBookStrategyCall = async () => {
        if (isProcessing) return
        setIsProcessing(true)
        setPaymentError(null)

        try {
            const result = await createUpsellOrder({ claimId, currency })

            if (!result.success) {
                setPaymentError(result.error)
                setIsProcessing(false)
                return
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                order_id: result.orderId,
                name: 'Flogen',
                description: 'Strategy Call',
                prefill: {
                    name: clientName,
                    email: clientEmail,
                },
                handler: async () => {
                    // Payment successful -- update preference and show calendar
                    await updateStrategyCallPreference(claimId, true)
                    setHasPaidUpsell(true)
                    setShowCalendar(true)
                    setIsProcessing(false)
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false)
                    },
                },
                theme: { color: '#2563EB' },
            }

            const rzp = new (
                window as unknown as {
                    Razorpay: new (opts: typeof options) => {
                        open: () => void
                        on: (
                            event: string,
                            handler: (resp: { error?: { description?: string } }) => void
                        ) => void
                    }
                }
            ).Razorpay(options)

            rzp.on(
                'payment.failed',
                (response: { error?: { description?: string } }) => {
                    setPaymentError(
                        response.error?.description || 'Payment failed. Please try again.'
                    )
                    setIsProcessing(false)
                }
            )

            rzp.open()
        } catch {
            setPaymentError('Something went wrong. Please try again.')
            setIsProcessing(false)
        }
    }

    const handleSkip = async () => {
        setIsSkipping(true)
        try {
            await updateStrategyCallPreference(claimId, false)
        } catch {
            // Non-critical -- continue to confirmation regardless
        }
        router.push(`/claim/${slug}/confirmed`)
    }

    return (
        <div className="space-y-6">
            {/* Section 1: Upsell offer card */}
            <div
                className="rounded-xl p-6"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: '#EFF6FF' }}
                    >
                        <Phone className="h-5 w-5" style={{ color: '#2563EB' }} />
                    </div>
                    <h1
                        className="text-xl font-bold"
                        style={{ color: '#0F172A' }}
                    >
                        Book a Strategy Call
                    </h1>
                </div>

                {isPro ? (
                    <p className="text-sm mb-4" style={{ color: '#475569' }}>
                        Your Pro plan includes a complimentary strategy call. Book a time
                        that works for you.
                    </p>
                ) : (
                    <>
                        <p className="text-sm mb-4" style={{ color: '#475569' }}>
                            Get expert guidance on making the most of your new website.
                            Our team will walk you through your site, suggest
                            improvements, and help you plan your digital strategy.
                        </p>

                        <div className="flex items-baseline gap-1 mb-1">
                            <span
                                className="text-2xl font-bold"
                                style={{ color: '#0F172A' }}
                            >
                                {CURRENCY_SYMBOL[currency]}
                                {UPSELL_DISPLAY.strategy_call[currency]}
                            </span>
                            {currency === 'INR' && (
                                <span className="text-xs" style={{ color: '#94A3B8' }}>
                                    + GST
                                </span>
                            )}
                        </div>

                        {!hasPaidUpsell && (
                            <button
                                onClick={handleBookStrategyCall}
                                disabled={isProcessing}
                                className="mt-4 w-full rounded-lg py-3 px-6 text-center font-semibold text-white transition-opacity disabled:opacity-50"
                                style={{ backgroundColor: '#2563EB' }}
                            >
                                {isProcessing
                                    ? 'Processing...'
                                    : 'Book Strategy Call'}
                            </button>
                        )}

                        {paymentError && (
                            <p
                                className="mt-2 text-sm text-center"
                                style={{ color: '#DC2626' }}
                            >
                                {paymentError}
                            </p>
                        )}
                    </>
                )}

                {isPro && (
                    <div
                        className="mt-3 rounded-lg px-4 py-2 text-sm font-medium"
                        style={{
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                        }}
                    >
                        Included free with your Pro plan
                    </div>
                )}
            </div>

            {/* Section 2: Cal.com iframe */}
            {showCalendar && (
                <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid #E2E8F0' }}
                >
                    {hasCalLink ? (
                        <iframe
                            src={`https://cal.com/${calLink}?embed=true&layout=month_view&name=${encodeURIComponent(clientName || '')}&email=${encodeURIComponent(clientEmail || '')}`}
                            width="100%"
                            height={600}
                            style={{ border: 'none' }}
                            loading="lazy"
                            title="Book a Strategy Call"
                        />
                    ) : (
                        <div className="p-6 text-center">
                            <p
                                className="text-sm mb-4"
                                style={{ color: '#475569' }}
                            >
                                Strategy call booking is being set up. We&apos;ll
                                reach out to schedule your call.
                            </p>
                            <button
                                onClick={() =>
                                    router.push(`/claim/${slug}/confirmed`)
                                }
                                className="rounded-lg py-3 px-6 font-semibold text-white"
                                style={{ backgroundColor: '#2563EB' }}
                            >
                                Continue to confirmation
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Skip link -- always visible */}
            <button
                onClick={handleSkip}
                disabled={isSkipping}
                className="w-full rounded-lg py-3 px-6 text-center font-medium transition-opacity disabled:opacity-50"
                style={{
                    border: '1px solid #D1D5DB',
                    color: '#4B5563',
                    backgroundColor: 'transparent',
                }}
            >
                {isSkipping
                    ? 'Redirecting...'
                    : hasPaidUpsell && !isPro
                        ? 'Continue to confirmation'
                        : isPro && showCalendar
                            ? 'Skip booking, continue to confirmation'
                            : 'No thanks, continue to confirmation'}
            </button>

            {/* Razorpay checkout.js -- only needed for Standard plan */}
            {!isPro && (
                <Script
                    src="https://checkout.razorpay.com/v1/checkout.js"
                    strategy="lazyOnload"
                />
            )}
        </div>
    )
}
