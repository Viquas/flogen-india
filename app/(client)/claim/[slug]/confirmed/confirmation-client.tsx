'use client'

import { useState, useEffect } from 'react'
import {
    CheckCircle, Clock, Palette, Eye, Mail, Rocket,
    MessageCircle, Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CURRENCY_SYMBOL, DISPLAY_PRICING, type PlanType } from '@/lib/claim-pricing'

interface ConfirmationClientProps {
    claimId: string
    initialStatus: string
    businessName: string
    plan: string
    amountPaise: number
    currency: string
    paidAt: string | null
    slug: string
}

const CONFIRMED_STATUSES = ['paid', 'customizing', 'completed']
const MAX_POLLS = 15 // 15 * 2s = 30s

interface TimelineStep {
    icon: LucideIcon
    label: string
    description: string
    status: 'complete' | 'next' | 'upcoming'
}

const TIMELINE_STEPS: TimelineStep[] = [
    { icon: CheckCircle, label: 'Payment Confirmed', description: 'Your payment has been received', status: 'complete' },
    { icon: Palette, label: 'Customization', description: 'Share your logo, colors, and content', status: 'next' },
    { icon: Eye, label: 'Updating Your Site', description: 'We\'ll apply your customizations', status: 'upcoming' },
    { icon: Mail, label: 'Preview Email', description: 'Review your updated website before launch', status: 'upcoming' },
    { icon: Rocket, label: 'Go Live', description: 'Your website goes live with your domain', status: 'upcoming' },
]

export function ConfirmationClient({
    claimId,
    initialStatus,
    businessName,
    plan,
    amountPaise: _amountPaise,
    currency,
    paidAt,
    slug: _slug,
}: ConfirmationClientProps) {
    const [status, setStatus] = useState(initialStatus)
    const [pollCount, setPollCount] = useState(0)

    const isConfirmed = CONFIRMED_STATUSES.includes(status)
    const isPolling = !isConfirmed && pollCount < MAX_POLLS
    const isTimeout = !isConfirmed && pollCount >= MAX_POLLS

    // Polling: check status every 2s until confirmed or exhausted
    useEffect(() => {
        if (isConfirmed || pollCount >= MAX_POLLS) return

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/claims/${claimId}/status`)
                if (res.ok) {
                    const data = await res.json()
                    setStatus(data.status)
                }
            } catch {
                // Network error -- keep polling
            }
            setPollCount(prev => prev + 1)
        }, 2000)

        return () => clearTimeout(timer)
    }, [claimId, isConfirmed, pollCount])

    const symbol = CURRENCY_SYMBOL
    const planType = plan as PlanType
    const planDisplay = DISPLAY_PRICING[planType] || ''

    // --- Verifying state ---
    if (isPolling) {
        return (
            <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-bold text-[#0F172A] mb-2">Verifying Payment...</h1>
                <p className="text-gray-500">This usually takes a few seconds. Please don&apos;t close this page.</p>
            </div>
        )
    }

    // --- Timeout state ---
    if (isTimeout) {
        return (
            <div>
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-[#0F172A] mb-2">Payment Received</h1>
                    <p className="text-gray-500 mb-4">We&apos;re processing your payment. You&apos;ll receive a confirmation shortly.</p>
                    <p className="text-sm text-gray-400">If you have any questions, contact our support team below.</p>
                </div>
                <SupportSection />
            </div>
        )
    }

    // --- Confirmed state ---
    return (
        <div>
            {/* Section 1: Success header */}
            <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Payment Confirmed!</h1>
                <p className="text-gray-500">Your website for <strong>{businessName}</strong> is being prepared.</p>
            </div>

            {/* Section 2: Order summary card */}
            <div className="bg-[#F8FAFC] rounded-xl p-5 mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Summary</h2>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{plan === 'pro' ? 'Pro' : 'Standard'} Plan</span>
                        <span className="font-semibold text-[#0F172A]">{symbol}{planDisplay}</span>
                    </div>
                    {paidAt && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Paid on</span>
                            <span className="text-gray-500">{new Date(paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 3: Vertical timeline */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-[#0F172A] mb-4">What Happens Next</h2>
                <div className="space-y-0">
                    {TIMELINE_STEPS.map((step, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    step.status === 'complete' ? 'bg-green-100' :
                                    step.status === 'next' ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                    <step.icon className={`w-5 h-5 ${
                                        step.status === 'complete' ? 'text-green-600' :
                                        step.status === 'next' ? 'text-[#2563EB]' : 'text-gray-400'
                                    }`} />
                                </div>
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div className={`w-0.5 h-8 ${
                                        step.status === 'complete' ? 'bg-green-200' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                            <div className="pt-2 pb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold text-sm ${
                                        step.status === 'complete' ? 'text-green-700' :
                                        step.status === 'next' ? 'text-[#0F172A]' : 'text-gray-400'
                                    }`}>{step.label}</h3>
                                    {step.status === 'next' && (
                                        <span className="text-xs bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded-full font-medium">Up next</span>
                                    )}
                                </div>
                                <p className={`text-sm ${step.status === 'upcoming' ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 4: What to do in the meantime */}
            <div className="bg-[#F8FAFC] rounded-xl p-5 mb-8">
                <h2 className="text-lg font-bold text-[#0F172A] mb-3">What to Do in the Meantime</h2>
                <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-gray-600">
                        <span className="text-[#2563EB] font-bold">1.</span>
                        <span>Gather your business logo (PNG or JPG, high resolution)</span>
                    </li>
                    <li className="flex gap-3 text-sm text-gray-600">
                        <span className="text-[#2563EB] font-bold">2.</span>
                        <span>Prepare 5-10 photos of your business, team, or products</span>
                    </li>
                    <li className="flex gap-3 text-sm text-gray-600">
                        <span className="text-[#2563EB] font-bold">3.</span>
                        <span>Review your website content and note any text changes</span>
                    </li>
                    <li className="flex gap-3 text-sm text-gray-600">
                        <span className="text-[#2563EB] font-bold">4.</span>
                        <span>Think about your preferred brand colors</span>
                    </li>
                </ul>
            </div>

            {/* Section 5: Support contact */}
            <SupportSection />
        </div>
    )
}

function SupportSection() {
    return (
        <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-bold text-[#0F172A] mb-3">Need Help?</h2>
            <p className="text-sm text-gray-500 mb-4">Our team is here to help you through the process.</p>
            <div className="space-y-3">
                <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '919999999999'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-green-700 hover:text-green-800"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat on WhatsApp</span>
                </a>
                <a
                    href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flogen.ai'}`}
                    className="flex items-center gap-3 text-sm text-[#2563EB] hover:text-blue-700"
                >
                    <Mail className="w-5 h-5" />
                    <span>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flogen.ai'}</span>
                </a>
            </div>
        </div>
    )
}
