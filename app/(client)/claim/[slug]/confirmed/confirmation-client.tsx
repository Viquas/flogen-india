'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, Clock, Palette, Eye, Mail, Rocket,
  MessageCircle, Loader2, KeyRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CURRENCY_SYMBOL, DISPLAY_PRICING, type PlanType } from '@/lib/claim-pricing'
import { AccountSetup } from './account-setup'

interface ConfirmationClientProps {
  claimId: string
  initialStatus: string
  businessName: string
  plan: string
  amountPaise: number
  paidAt: string | null
  slug: string
  email: string | null
}

const CONFIRMED_STATUSES = ['paid', 'customizing', 'completed']
const MAX_POLLS = 20
const POLL_INTERVAL_MS = 3000

interface TimelineStep {
  icon: LucideIcon
  label: string
  description: string
  status: 'complete' | 'next' | 'upcoming'
}

const TIMELINE_STEPS: TimelineStep[] = [
  { icon: CheckCircle, label: 'Payment Confirmed', description: 'Your payment has been received', status: 'complete' },
  { icon: KeyRound, label: 'Set Up Your Account', description: 'Create your password to access the portal', status: 'next' },
  { icon: Palette, label: 'Customization', description: 'Share your logo, colors, and content', status: 'upcoming' },
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
  paidAt,
  slug: _slug,
  email: initialEmail,
}: ConfirmationClientProps) {
  const [isVerified, setIsVerified] = useState(CONFIRMED_STATUSES.includes(initialStatus))
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(initialEmail)
  const [pollCount, setPollCount] = useState(0)
  const [isPolling, setIsPolling] = useState(!CONFIRMED_STATUSES.includes(initialStatus))

  const verify = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/${claimId}/verify`, { method: 'POST' })
      if (!res.ok) return false

      const data = await res.json()
      if (data.verified) {
        setIsVerified(true)
        setVerifiedEmail(data.email || initialEmail)
        setIsPolling(false)
        return true
      }
    } catch {
      // Network error -- keep polling
    }
    return false
  }, [claimId, initialEmail])

  // Dual verification polling
  useEffect(() => {
    if (isVerified) return

    // First call fires immediately on mount
    let cancelled = false

    async function poll() {
      const verified = await verify()
      if (verified || cancelled) return

      // Start interval polling
      let count = 1
      const timer = setInterval(async () => {
        if (cancelled) {
          clearInterval(timer)
          return
        }

        count++
        setPollCount(count)

        const result = await verify()
        if (result || count >= MAX_POLLS) {
          clearInterval(timer)
          if (!result) {
            setIsPolling(false)
          }
        }
      }, POLL_INTERVAL_MS)
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [isVerified, verify])

  const isTimeout = !isVerified && !isPolling && pollCount > 0

  const symbol = CURRENCY_SYMBOL
  const planType = plan as PlanType
  const planDisplay = DISPLAY_PRICING[planType] || ''

  // --- Verifying state ---
  if (isPolling) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[#0F172A] mb-2">Confirming your payment...</h1>
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
              <span className="text-gray-500">{new Date(paidAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Account Setup -- PROMINENT primary CTA */}
      {verifiedEmail && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Set Up Your Account</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create your password to access your website portal and manage your site.
          </p>
          <AccountSetup email={verifiedEmail} claimId={claimId} />
        </div>
      )}

      {/* Section 4: Vertical timeline */}
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

      {/* Section 5: What to do in the meantime */}
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

      {/* Section 6: Support contact */}
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
          href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@sumosite.com'}`}
          className="flex items-center gap-3 text-sm text-[#2563EB] hover:text-blue-700"
        >
          <Mail className="w-5 h-5" />
          <span>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@sumosite.com'}</span>
        </a>
      </div>
    </div>
  )
}
