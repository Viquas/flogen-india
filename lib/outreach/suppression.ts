import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Global suppression list — the compliance backbone (Spam Act 2003). Checked
 * before every email/WhatsApp send. A contact suppressed on 'any' blocks all
 * channels; a channel-specific suppression blocks only that channel.
 */

export type SuppressionChannel = 'email' | 'whatsapp' | 'any'
export type SuppressionReason = 'unsubscribe' | 'stop' | 'complaint' | 'bounce' | 'manual'

/** Normalise a contact: emails lowercased/trimmed; phones reduced to digits (+ prefix kept). */
export function normalizeContact(contact: string, channel: 'email' | 'whatsapp'): string {
    const c = contact.trim()
    if (channel === 'email') return c.toLowerCase()
    // phone: keep leading + then digits only
    const hasPlus = c.startsWith('+')
    const digits = c.replace(/\D/g, '')
    return hasPlus ? `+${digits}` : digits
}

export async function isSuppressed(contact: string, channel: 'email' | 'whatsapp'): Promise<boolean> {
    if (!contact) return false
    const norm = normalizeContact(contact, channel)
    try {
        const admin = createAdminClient() as any
        const { data } = await admin
            .from('suppression')
            .select('id')
            .eq('contact', norm)
            .in('channel', [channel, 'any'])
            .limit(1)
        return !!(data && data.length > 0)
    } catch (error) {
        // Fail closed would block all sends on a transient error; fail open but log.
        logger.discovery.error('isSuppressed check failed', {
            error: error instanceof Error ? error.message : String(error),
        })
        return false
    }
}

export async function addSuppression(params: {
    contact: string
    channel: SuppressionChannel
    reason: SuppressionReason
    source?: string
}): Promise<void> {
    // 'any' must normalize the same way isSuppressed() will later normalize the
    // lookup (email vs phone), or the exact-match .eq() never finds the row —
    // e.g. "+61 412 345 678" stored with spaces would never block "+61412345678".
    const chForNorm: 'email' | 'whatsapp' =
        params.channel === 'any'
            ? (params.contact.includes('@') ? 'email' : 'whatsapp')
            : params.channel
    const norm = normalizeContact(params.contact, chForNorm)
    try {
        const admin = createAdminClient() as any
        // Upsert on (contact, channel) so repeated STOP/unsubscribe is idempotent.
        await admin
            .from('suppression')
            .upsert(
                { contact: norm, channel: params.channel, reason: params.reason, source: params.source ?? null },
                { onConflict: 'contact,channel', ignoreDuplicates: true },
            )
    } catch (error) {
        logger.discovery.error('addSuppression failed', {
            error: error instanceof Error ? error.message : String(error),
        })
    }
}
