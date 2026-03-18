import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

export type ClaimEventType =
  | 'preview_view'
  | 'claim_page_view'
  | 'cta_click'
  | 'plan_selected'
  | 'payment_initiated'
  | 'payment_completed'
  | 'customization_submitted'

interface TrackEventParams {
  siteSlug: string
  eventType: ClaimEventType
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, Json>
}

/**
 * Track a claim funnel event. Fire-and-forget safe -- errors are logged, not thrown.
 * Use for server-side tracking (SSR pages, webhooks, server actions).
 */
export async function trackClaimEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('claim_events').insert({
      site_slug: params.siteSlug,
      event_type: params.eventType,
      ip: params.ip ?? null,
      user_agent: params.userAgent ?? null,
      metadata: params.metadata ?? {},
    })
    if (error) {
      console.error('[ClaimTracking] Failed to track event:', error.message)
    }
  } catch (err) {
    console.error('[ClaimTracking] Unexpected error tracking event:', err)
  }
}
