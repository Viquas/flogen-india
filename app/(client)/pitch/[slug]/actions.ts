'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackPitchEvent } from '@/lib/pitch-tracking'
import { notifyProjectRep } from '@/lib/sales/notifications'

const interestSchema = z.object({
    projectId: z.string().uuid(),
    slug: z.string().min(1).max(200),
    name: z.string().trim().max(100).optional().default(''),
    email: z.string().email().or(z.literal('')).optional().default(''),
    phone: z.string().trim().max(30).optional().default(''),
    preferredTime: z.string().trim().max(80).optional().default(''),
})

export type InterestInput = z.input<typeof interestSchema>

async function requestMeta() {
    const h = await headers()
    return {
        ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: h.get('user-agent') || null,
    }
}

/** "Let's do it" submission — captures intent (email/phone) and pings the rep. */
export async function submitInterest(
    input: InterestInput,
): Promise<{ success: boolean; message?: string }> {
    const parsed = interestSchema.safeParse(input)
    if (!parsed.success) return { success: false, message: 'Please check your details and try again.' }
    const { projectId, slug, name, email, phone, preferredTime } = parsed.data

    if (!email && !phone) {
        return { success: false, message: 'Add an email or phone number so we can reach you.' }
    }

    try {
        const admin = createAdminClient() as any
        const { error } = await admin.from('interests').insert({
            project_id: projectId,
            name: name || null,
            email: email || null,
            phone: phone || null,
            preferred_time: preferredTime || null,
        })
        if (error) return { success: false, message: 'Something went wrong. Please try again.' }

        const meta = await requestMeta()
        await trackPitchEvent({ slug, type: 'interest_submitted', ...meta, metadata: { name, email, phone } })
        await notifyProjectRep(projectId, 'interest_submitted', { name, email, phone })
        return { success: true }
    } catch {
        return { success: false, message: 'Something went wrong. Please try again.' }
    }
}

/** Fired when the prospect opens the "Let's do it" form. */
export async function trackPitchCta(slug: string, projectId: string): Promise<void> {
    const meta = await requestMeta()
    await trackPitchEvent({ slug, type: 'cta_click', ...meta })
    await notifyProjectRep(projectId, 'cta_clicked')
}
