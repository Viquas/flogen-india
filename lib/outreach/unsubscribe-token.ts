import crypto from 'crypto'

/**
 * HMAC token that binds an unsubscribe link to the contact it was issued for.
 * Without it, /unsubscribe?c=<anything> would let anyone suppress arbitrary
 * contacts and silently drain the outreach pipeline.
 */

function unsubscribeSecret(): string {
    return process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export function unsubscribeToken(contact: string): string {
    return crypto
        .createHmac('sha256', unsubscribeSecret())
        .update(contact.trim().toLowerCase())
        .digest('hex')
        .slice(0, 32)
}

export function verifyUnsubscribeToken(contact: string, token: string | undefined | null): boolean {
    if (!token || !unsubscribeSecret()) return false
    const expected = Buffer.from(unsubscribeToken(contact))
    const provided = Buffer.from(token)
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided)
}
