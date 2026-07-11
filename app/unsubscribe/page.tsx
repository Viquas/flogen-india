import { addSuppression } from '@/lib/outreach/suppression'

export const dynamic = 'force-dynamic'

interface UnsubscribePageProps {
    searchParams: Promise<{ c?: string; ch?: string }>
}

/**
 * Functional one-click unsubscribe (Spam Act 2003 requirement). Processing on
 * load — no login, no fee — writes the contact to the global suppression table,
 * which every send path checks. Channel 'any' by default blocks email + WhatsApp.
 */
export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
    const { c, ch } = await searchParams
    const channel = ch === 'email' || ch === 'whatsapp' ? ch : 'any'

    let done = false
    if (c) {
        await addSuppression({ contact: c, channel, reason: 'unsubscribe', source: 'unsubscribe_link' })
        done = true
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 text-center">
                {done ? (
                    <>
                        <h1 className="text-xl font-semibold text-gray-900">You’ve been unsubscribed</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            {c} will no longer receive messages from us. It can take a moment to take effect
                            across all systems.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-semibold text-gray-900">Unsubscribe</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            This unsubscribe link is missing its details. Please use the link from the email you
                            received.
                        </p>
                    </>
                )}
            </div>
        </main>
    )
}
