import { addSuppression } from '@/lib/outreach/suppression'
import { verifyUnsubscribeToken } from '@/lib/outreach/unsubscribe-token'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface UnsubscribePageProps {
    searchParams: Promise<{ c?: string; ch?: string; t?: string }>
}

/**
 * Was the contact ever actually messaged by us? Legacy unsubscribe links
 * (sent before tokens existed) carry no HMAC, so honour them only when the
 * contact appears in the outbound log — otherwise /unsubscribe?c=<anything>
 * lets anyone mass-suppress arbitrary prospects.
 */
async function wasContacted(contact: string): Promise<boolean> {
    try {
        const admin = createAdminClient() as any
        const { data } = await admin
            .from('outreach_messages')
            .select('id')
            .eq('to_contact', contact)
            .eq('direction', 'out')
            .limit(1)
        return !!(data && data.length > 0)
    } catch {
        // On a transient DB error, honour the request — compliance beats abuse
        // prevention when we can't tell the difference.
        return true
    }
}

/**
 * Functional one-click unsubscribe (Spam Act 2003 requirement). Processing on
 * load — no login, no fee — writes the contact to the global suppression table,
 * which every send path checks. Channel 'any' by default blocks email + WhatsApp.
 */
export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
    const { c, ch, t } = await searchParams
    const channel = ch === 'email' || ch === 'whatsapp' ? ch : 'any'

    let done = false
    let invalid = false
    if (c) {
        const authorized = verifyUnsubscribeToken(c, t) || (await wasContacted(c))
        if (authorized) {
            await addSuppression({ contact: c, channel, reason: 'unsubscribe', source: 'unsubscribe_link' })
            done = true
        } else {
            invalid = true
        }
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
                ) : invalid ? (
                    <>
                        <h1 className="text-xl font-semibold text-gray-900">Link not recognised</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            We couldn’t verify this unsubscribe link. Please use the link from the email you
                            received, or reply to that email and we’ll remove you manually.
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
