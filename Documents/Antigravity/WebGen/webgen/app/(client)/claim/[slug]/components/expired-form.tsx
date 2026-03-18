'use client'

import { useActionState } from 'react'
import { Clock, CheckCircle } from 'lucide-react'
import { submitExpiredClaimRequest } from '../claim-actions'

interface ExpiredFormProps {
    projectId: string
    businessName: string
}

type FormState = {
    success: boolean
    errors?: Record<string, string[]>
} | null

const INPUT_CLASS =
    'w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent'

export function ExpiredForm({ projectId, businessName }: ExpiredFormProps) {
    const [state, formAction, isPending] = useActionState<FormState, FormData>(
        async (_prevState, formData) => {
            return await submitExpiredClaimRequest(formData)
        },
        null,
    )

    if (state?.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center">
                <CheckCircle className="text-green-500 w-12 h-12 mb-4" />
                <h2 className="text-2xl font-bold text-[#0F172A]">
                    Request Submitted!
                </h2>
                <p className="mt-2 text-gray-500">
                    We&apos;ll be in touch soon.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center">
            <Clock className="text-red-500 w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold text-[#0F172A]">
                This Offer Has Expired
            </h2>
            <p className="mt-2 text-gray-500 max-w-md">
                The claim window for {businessName} has closed. Request a new
                website and we&apos;ll get back to you.
            </p>

            <form action={formAction} className="mt-8 w-full max-w-sm space-y-4">
                <input type="hidden" name="projectId" value={projectId} />

                <div className="text-left">
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="Your name"
                        className={INPUT_CLASS}
                    />
                    {state?.errors?.name && (
                        <p className="text-red-500 text-sm mt-1">
                            {state.errors.name[0]}
                        </p>
                    )}
                </div>

                <div className="text-left">
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="your@email.com"
                        className={INPUT_CLASS}
                    />
                    {state?.errors?.email && (
                        <p className="text-red-500 text-sm mt-1">
                            {state.errors.email[0]}
                        </p>
                    )}
                </div>

                <div className="text-left">
                    <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+91 98765 43210"
                        className={INPUT_CLASS}
                    />
                    {state?.errors?.phone && (
                        <p className="text-red-500 text-sm mt-1">
                            {state.errors.phone[0]}
                        </p>
                    )}
                </div>

                {state?.errors?.form && (
                    <p className="text-red-500 text-sm">
                        {state.errors.form[0]}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Submitting...' : 'Request a New Website'}
                </button>
            </form>
        </div>
    )
}
