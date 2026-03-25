'use client'

import { useState } from 'react'
import Script from 'next/script'
import { toast } from 'sonner'
import {
    Check,
    ChevronDown,
    ChevronUp,
    Headphones,
    Globe,
    Mail,
    MessageCircle,
} from 'lucide-react'

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void }
    }
}

interface SupportClientProps {
    claimId: string
    clientEmail: string
    razorpayKeyId: string
    isTestMode: boolean
}

const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+1234567890'
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@essodigital.com'

const FAQ_ITEMS = [
    {
        question: 'How long does domain setup take?',
        answer: 'Once we receive your DNS records, verification typically takes 24-48 hours. Our agents can guide you through the entire process.',
    },
    {
        question: 'Can I change my website after launch?',
        answer: 'Yes! Submit change requests from the Customize page and our team will update your site.',
    },
    {
        question: 'What if I need more than one change?',
        answer: 'You can submit unlimited change requests. We process them in order and update your site.',
    },
    {
        question: 'How do I get my own domain?',
        answer: 'Visit the Domain page to search for available domains, or connect one you already own.',
    },
    {
        question: "What's included in agent support?",
        answer: 'Our agents handle domain configuration, logo processing, content updates, and any technical issues you encounter.',
    },
]

export function SupportClient({ claimId, clientEmail, razorpayKeyId, isTestMode }: SupportClientProps) {
    const [loading, setLoading] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    async function handlePayment(type: 'agent_support' | 'domain_setup') {
        setLoading(true)

        try {
            const res = await fetch('/api/portal/payments/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            })

            if (!res.ok) {
                const data = await res.json()
                toast.error(data.error || 'Failed to create payment order')
                return
            }

            const { orderId, amount, keyId } = await res.json()

            const options = {
                key: keyId || razorpayKeyId,
                amount,
                currency: 'USD',
                name: 'Esso Digital',
                description: type === 'domain_setup' ? 'Agent Domain Setup' : 'Agent Support',
                order_id: orderId,
                prefill: { email: clientEmail },
                handler: () => {
                    setPaymentSuccess(true)
                    toast.success('Payment successful! Our agents will reach out shortly.')
                },
                modal: {
                    ondismiss: () => {
                        toast.info('Payment cancelled')
                    },
                },
                theme: { color: '#0F172A' },
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (error) {
            console.error('[Support] Payment error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 pb-8">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 font-[family-name:var(--font-signifier)]">
                    Support
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Get expert help or reach out to our team directly
                </p>
            </div>

            {/* Section A: Agent Support Payment Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                {paymentSuccess ? (
                    <PaymentSuccessState />
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Headphones className="w-5 h-5 text-gray-700" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Get Expert Help
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Our agents can assist with domain setup, logo processing, and any customization needs
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">$49</span>
                                    <span className="text-sm text-gray-400">one-time</span>
                                </div>
                                {isTestMode && (
                                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-md">
                                        Test Mode
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* What's included */}
                        <ul className="mt-5 space-y-2.5">
                            {[
                                'Domain configuration and DNS setup',
                                'Logo background removal and optimization',
                                'Website customization assistance',
                                'Priority email and WhatsApp support',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2.5">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-700">{item}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => handlePayment('domain_setup')}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                            >
                                <Globe className="w-4 h-4" />
                                Get Domain Help
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePayment('agent_support')}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                            >
                                <Headphones className="w-4 h-4" />
                                Get General Help
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Section B: Contact Us */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900">Reach Out Directly</h2>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                    We typically respond within 2-4 hours during business hours
                </p>

                <div className="space-y-3">
                    <a
                        href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                        <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                            <p className="text-xs text-gray-500">{SUPPORT_WHATSAPP}</p>
                        </div>
                    </a>

                    <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                        <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-xs text-gray-500">{SUPPORT_EMAIL}</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Section C: FAQ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Questions</h2>
                <div className="space-y-1">
                    {FAQ_ITEMS.map((item) => (
                        <FaqItem key={item.question} question={item.question} answer={item.answer} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function PaymentSuccessState() {
    return (
        <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Payment confirmed!</h2>
            <p className="text-sm text-gray-500 mt-2">
                Our agents will reach out within 2-4 hours via email or WhatsApp
            </p>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <p className="text-sm font-medium text-gray-700 mb-3">
                    You can also reach us directly at:
                </p>
                <div className="space-y-2">
                    <a
                        href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        {SUPPORT_WHATSAPP}
                    </a>
                    <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <Mail className="w-4 h-4 text-blue-600" />
                        {SUPPORT_EMAIL}
                    </a>
                </div>
            </div>
        </div>
    )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors min-h-[44px]"
            >
                <span className="text-sm font-medium text-gray-900">{question}</span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
            </button>
            <div
                className="transition-all duration-200 ease-in-out overflow-hidden"
                style={{ maxHeight: expanded ? '200px' : '0px', opacity: expanded ? 1 : 0 }}
            >
                <p className="text-sm text-gray-600 pb-3 px-2 leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    )
}
