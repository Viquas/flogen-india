'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireSales } from '@/lib/auth/require-sales'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrackedEmail } from '@/lib/outreach/email'
import { isSuppressed, addSuppression } from '@/lib/outreach/suppression'
import { getTodayWhatsappCount, WHATSAPP_DAILY_SOFT_CAP } from '@/lib/sales/outreach'

const emailSchema = z.object({
    projectId: z.string().uuid(),
    to: z.string().email(),
    subject: z.string().trim().min(1).max(200),
    bodyText: z.string().trim().min(1).max(8000),
    // Absolute URL or app-relative path (relative is preferred: the email lib
    // absolutizes it with getBaseUrl() so tracked redirects stay on-host)
    ctaUrl: z.union([z.string().url(), z.string().regex(/^\/(?!\/)/)]).optional(),
    ctaLabel: z.string().trim().max(60).optional(),
})

export async function sendLeadEmail(
    input: z.input<typeof emailSchema>,
): Promise<{ ok: boolean; error?: string }> {
    const { userId } = await requireSales()
    const parsed = emailSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Please check the email fields.' }
    const { projectId, to, subject, bodyText, ctaUrl, ctaLabel } = parsed.data

    // Compliance gate: never send to a suppressed address.
    if (await isSuppressed(to, 'email')) {
        return { ok: false, error: 'This contact has unsubscribed and cannot be emailed.' }
    }

    // Sequence rails (cold-outreach policy): max 3 emails per lead, spaced
    // at least 3 days apart.
    const admin = createAdminClient() as any
    const { data: priorEmails } = await admin
        .from('outreach_messages')
        .select('created_at')
        .eq('project_id', projectId)
        .eq('channel', 'email')
        .eq('direction', 'out')
        .order('created_at', { ascending: false })

    const sentCount = priorEmails?.length ?? 0
    if (sentCount >= 3) {
        return { ok: false, error: 'Sequence limit reached — this lead has already received 3 emails.' }
    }
    if (sentCount > 0) {
        const lastSent = new Date(priorEmails[0].created_at).getTime()
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000
        if (Date.now() - lastSent < threeDaysMs) {
            const daysLeft = Math.ceil((lastSent + threeDaysMs - Date.now()) / (24 * 60 * 60 * 1000))
            return { ok: false, error: `Too soon — follow-ups must be spaced 3+ days apart (try again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}).` }
        }
    }

    const res = await sendTrackedEmail({ projectId, repId: userId, to, subject, bodyText, ctaUrl, ctaLabel })
    if (!res.ok) return { ok: false, error: res.error }

    revalidatePath(`/sales/leads/${projectId}`)
    return { ok: true }
}

const whatsappSchema = z.object({
    projectId: z.string().uuid(),
    to: z.string().trim().min(5).max(30),
    body: z.string().trim().max(4000).optional().default(''),
})

/**
 * Log a WhatsApp click-to-chat touch (the rep sends from their own WhatsApp; we
 * only record it). Returns the rep's updated daily count for the soft-cap warning.
 */
export async function logWhatsappTouch(
    input: z.input<typeof whatsappSchema>,
): Promise<{ ok: boolean; error?: string; count?: number; cap?: number }> {
    const { userId } = await requireSales()
    const parsed = whatsappSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Invalid WhatsApp details.' }
    const { projectId, to, body } = parsed.data

    if (await isSuppressed(to, 'whatsapp')) {
        return { ok: false, error: 'This contact has opted out and cannot be messaged.' }
    }

    const admin = createAdminClient() as any
    const { error } = await admin.from('outreach_messages').insert({
        project_id: projectId,
        rep_id: userId,
        channel: 'whatsapp',
        direction: 'out',
        to_contact: to,
        body: body || null,
    })
    if (error) return { ok: false, error: 'Could not log the WhatsApp touch.' }

    const count = await getTodayWhatsappCount(userId)
    revalidatePath(`/sales/leads/${projectId}`)
    return { ok: true, count, cap: WHATSAPP_DAILY_SOFT_CAP }
}

const suppressSchema = z.object({
    projectId: z.string().uuid(),
    contact: z.string().trim().min(3).max(200),
    channel: z.enum(['email', 'whatsapp', 'any']),
})

/** Rep marks a contact as opted-out (e.g. after a "STOP" reply). */
export async function suppressContact(
    input: z.input<typeof suppressSchema>,
): Promise<{ ok: boolean }> {
    await requireSales()
    const parsed = suppressSchema.safeParse(input)
    if (!parsed.success) return { ok: false }
    await addSuppression({
        contact: parsed.data.contact,
        channel: parsed.data.channel,
        reason: 'stop',
        source: 'rep_marked',
    })
    revalidatePath(`/sales/leads/${parsed.data.projectId}`)
    return { ok: true }
}
