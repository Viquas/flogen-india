import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

/** Outreach message data access for the sales workspace timeline. */

export interface OutreachMessageRow {
    id: string
    channel: 'email' | 'whatsapp'
    direction: 'out' | 'in'
    toContact: string | null
    subject: string | null
    body: string | null
    openedAt: string | null
    clickedAt: string | null
    createdAt: string
}

export const getOutreachMessages = cache(async (projectId: string): Promise<OutreachMessageRow[]> => {
    const admin = createAdminClient() as any
    const { data } = await admin
        .from('outreach_messages')
        .select('id, channel, direction, to_contact, subject, body, opened_at, clicked_at, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    return (data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        channel: r.channel as 'email' | 'whatsapp',
        direction: r.direction as 'out' | 'in',
        toContact: (r.to_contact as string | null) ?? null,
        subject: (r.subject as string | null) ?? null,
        body: (r.body as string | null) ?? null,
        openedAt: (r.opened_at as string | null) ?? null,
        clickedAt: (r.clicked_at as string | null) ?? null,
        createdAt: r.created_at as string,
    }))
})

/** How many NEW WhatsApp contacts this rep has messaged today (ban-risk guardrail). */
export async function getTodayWhatsappCount(repId: string): Promise<number> {
    const admin = createAdminClient() as any
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const { count } = await admin
        .from('outreach_messages')
        .select('id', { count: 'exact', head: true })
        .eq('rep_id', repId)
        .eq('channel', 'whatsapp')
        .eq('direction', 'out')
        .gte('created_at', startOfToday)
    return count || 0
}

/** Soft daily cap on new WhatsApp contacts per rep to protect the number. */
export const WHATSAPP_DAILY_SOFT_CAP = 30
