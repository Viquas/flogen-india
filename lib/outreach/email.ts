import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { unsubscribeToken } from '@/lib/outreach/unsubscribe-token'

/**
 * Tracked, compliant outbound email for sales outreach.
 *
 * Compliance (Spam Act 2003, AU): every email carries an accurate sender
 * identity (business name + ABN + physical address) and a functional one-click
 * unsubscribe. Suppression is checked by the caller before this runs.
 *
 * Tracking: a 1x1 open pixel and click-wrapped CTA route through /api/track/*,
 * which stamp opened_at / clicked_at on the outreach_messages row.
 */

export function getBaseUrl(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '')
}

interface SenderIdentity {
    name: string
    abn: string
    address: string
}

function senderIdentity(): SenderIdentity {
    return {
        name: process.env.NEXT_PUBLIC_SENDER_NAME || 'Flogen',
        abn: process.env.NEXT_PUBLIC_SENDER_ABN || '',
        address: process.env.NEXT_PUBLIC_SENDER_ADDRESS || '',
    }
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildEmailHtml(params: {
    bodyText: string
    ctaUrl?: string
    ctaLabel?: string
    messageId: string
    to: string
}): string {
    const base = getBaseUrl()
    const sender = senderIdentity()
    const openPixel = `${base}/api/track/open?m=${params.messageId}`
    const unsubUrl = `${base}/unsubscribe?c=${encodeURIComponent(params.to)}&ch=email&t=${unsubscribeToken(params.to)}`

    const paragraphs = params.bodyText
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#1a1614;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('')

    // Absolutize relative CTA paths with the same base as the tracking link so
    // the click route's same-host allowlist always matches.
    const ctaAbsolute = params.ctaUrl?.startsWith('/')
        ? `${base}${params.ctaUrl}`
        : params.ctaUrl

    const ctaBlock =
        ctaAbsolute
            ? `<p style="margin:24px 0;"><a href="${base}/api/track/click?m=${params.messageId}&u=${encodeURIComponent(ctaAbsolute)}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${escapeHtml(params.ctaLabel || 'Take a look')}</a></p>`
            : ''

    const footerBits = [
        sender.name,
        sender.abn ? `ABN ${sender.abn}` : '',
        sender.address,
    ].filter(Boolean).join(' · ')

    return `<!doctype html><html><body style="margin:0;background:#f5f0ea;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
${paragraphs}
${ctaBlock}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
<p style="font-size:12px;color:#999;line-height:1.5;margin:0;">
${escapeHtml(footerBits)}<br/>
You’re receiving this because your business is publicly listed. <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>.
</p>
</div>
<img src="${openPixel}" width="1" height="1" alt="" style="display:none;"/>
</body></html>`
}

export interface SendResult {
    ok: boolean
    messageId?: string
    error?: string
}

/**
 * Persist an outreach_messages row and send the email. Caller is responsible for
 * auth + suppression checks. Returns the outreach_messages id as messageId.
 */
export async function sendTrackedEmail(params: {
    projectId: string
    repId: string | null
    to: string
    subject: string
    bodyText: string
    ctaUrl?: string
    ctaLabel?: string
}): Promise<SendResult> {
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    if (!smtpUser || !smtpPass) {
        return { ok: false, error: 'Email sending is not configured (SMTP_USER/SMTP_PASS).' }
    }

    const admin = createAdminClient() as any

    // Record the outbound message first so tracking pixels/links have an id.
    const { data: row, error: insertErr } = await admin
        .from('outreach_messages')
        .insert({
            project_id: params.projectId,
            rep_id: params.repId,
            channel: 'email',
            direction: 'out',
            to_contact: params.to,
            subject: params.subject,
            body: params.bodyText,
        })
        .select('id')
        .single()

    if (insertErr || !row) {
        return { ok: false, error: 'Could not record the message.' }
    }

    const messageId = row.id as string
    const html = buildEmailHtml({ ...params, messageId })

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass },
        })
        const sender = senderIdentity()
        const info = await transporter.sendMail({
            from: `"${sender.name}" <${smtpUser}>`,
            to: params.to,
            subject: params.subject,
            html,
        })
        await admin.from('outreach_messages').update({ provider_message_id: info.messageId }).eq('id', messageId)
        return { ok: true, messageId }
    } catch (error) {
        logger.discovery.error('sendTrackedEmail failed', {
            error: error instanceof Error ? error.message : String(error),
        })
        return { ok: false, error: 'Failed to send the email. Please try again.' }
    }
}
