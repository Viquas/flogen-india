'use client'

import { useActionState } from 'react'
import { CheckCircle } from 'lucide-react'
import { submitInterestRequest } from '../claim-actions'

interface InterestFormProps {
    projectId: string
    businessName: string
}

type FormState = {
    success: boolean
    errors?: Record<string, string[]>
} | null

const INPUT_CLASS =
    'w-full px-4 py-3 rounded-lg border border-gray-300 text-[#050304] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AF92FF] focus:border-transparent'

/**
 * Manual-payment CTA: instead of an online checkout the prospect asks us to get in
 * touch, and a rep arranges payment offline. Shown when PAYMENT_MODE is 'manual'.
 */
export function InterestForm({ projectId, businessName }: InterestFormProps) {
    const [state, formAction, isPending] = useActionState<FormState, FormData>(
        async (_prev, formData) => submitInterestRequest(formData),
        null,
    )

    if (state?.success) {
        return (
            <div className="max-w-md mx-auto text-center py-10">
                <CheckCircle className="text-emerald-500 w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#050304]">Thanks — we&apos;ll be in touch</h2>
                <p className="mt-2 text-gray-500">
                    We&apos;ve got your details and will reach out shortly to walk you through
                    {' '}{businessName}&apos;s new site and get it live.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[#050304]">Want this site for {businessName}?</h2>
                <p className="mt-2 text-gray-500">
                    Leave your details and we&apos;ll get in touch to finish the setup and get you live.
                </p>
            </div>

            <form action={formAction} className="mt-8 space-y-4">
                <input type="hidden" name="projectId" value={projectId} />

                <div>
                    <input type="text" name="name" required placeholder="Your name" className={INPUT_CLASS} />
                    {state?.errors?.name && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.name[0]}</p>
                    )}
                </div>

                <div>
                    <input type="email" name="email" required placeholder="your@email.com" className={INPUT_CLASS} />
                    {state?.errors?.email && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
                    )}
                </div>

                <div>
                    <input type="tel" name="phone" required placeholder="+91 98765 43210" className={INPUT_CLASS} />
                    {state?.errors?.phone && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.phone[0]}</p>
                    )}
                </div>

                {state?.errors?.form && <p className="text-red-500 text-sm">{state.errors.form[0]}</p>}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3.5 rounded-full bg-[#AF92FF] text-[#050304] font-semibold text-sm transition-all hover:bg-[#C4B1FF] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Sending…' : 'Get in touch'}
                </button>
                <p className="text-center text-xs text-gray-400">
                    No payment now — we&apos;ll walk you through it first.
                </p>
            </form>
        </div>
    )
}
