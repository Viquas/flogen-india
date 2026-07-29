import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Pitch funnel tracking — mirror of lib/claim-tracking.ts for the automation
 * ("Let's do it") flow. Fire-and-forget: tracking must never break the
 * prospect-facing page or form.
 */

export type PitchEventType = 'pitch_view' | 'cta_click' | 'interest_submitted'

export async function trackPitchEvent(params: {
    slug: string
    type: PitchEventType
    ip?: string | null
    userAgent?: string | null
    metadata?: Record<string, unknown>
}): Promise<void> {
    try {
        const admin = createAdminClient() as any
        await admin.from('pitch_events').insert({
            site_slug: params.slug,
            event_type: params.type,
            ip: params.ip ?? null,
            user_agent: params.userAgent ?? null,
            metadata: params.metadata ?? null,
        })
    } catch (error) {
        logger.discovery.error('trackPitchEvent failed', {
            type: params.type,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/** Count of unique-ish pitch views for a slug (intent signal). */
export async function getPitchViewCount(slug: string): Promise<number> {
    try {
        const admin = createAdminClient() as any
        const { count } = await admin
            .from('pitch_events')
            .select('id', { count: 'exact', head: true })
            .eq('site_slug', slug)
            .eq('event_type', 'pitch_view')
        return count || 0
    } catch {
        return 0
    }
}
