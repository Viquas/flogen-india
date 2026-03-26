import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

// ---------------------------------------------------------------------------
// Funnel event types — superset of original ClaimEventType
// ---------------------------------------------------------------------------

export type FunnelEventType =
  // Original claim tracking events (backward-compatible)
  | 'preview_view'
  | 'claim_page_view'
  | 'cta_click'
  | 'plan_selected'
  | 'payment_initiated'
  | 'payment_completed'
  | 'customization_submitted'
  // New funnel analytics events
  | 'preview.viewed'
  | 'claim.started'
  | 'claim.form_submitted'
  | 'payment.checkout_opened'
  | 'payment.completed'
  | 'payment.failed'
  | 'portal.first_login'
  | 'upsell.viewed'
  | 'upsell.accepted'
  | 'upsell.declined'
  // Scroll depth events
  | 'scroll.25'
  | 'scroll.50'
  | 'scroll.75'
  | 'scroll.100'

export interface TrackEventProperties {
  projectId?: string
  slug?: string
  source?: string
  plan?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Server-side tracking (inserts directly into claim_events table)
// ---------------------------------------------------------------------------

export async function trackEvent(
  eventType: FunnelEventType,
  properties?: TrackEventProperties,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('claim_events').insert({
      site_slug: properties?.slug || properties?.projectId || 'unknown',
      event_type: eventType,
      metadata: (properties ?? {}) as Record<string, Json>,
    })
    if (error) {
      console.error('[FunnelTrack] Server tracking error:', error.message)
    }
  } catch (err) {
    console.error('[FunnelTrack] Unexpected server tracking error:', err)
  }
}

// ---------------------------------------------------------------------------
// Client-side tracking (sends POST to /api/analytics/claim-event)
// ---------------------------------------------------------------------------

export async function trackClientEvent(
  eventType: FunnelEventType,
  properties?: TrackEventProperties,
): Promise<void> {
  try {
    const body = {
      siteSlug: properties?.slug || properties?.projectId || 'unknown',
      eventType,
      metadata: properties ?? {},
    }

    // Use sendBeacon for fire-and-forget when available (survives page unloads)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/claim-event', blob)
      return
    }

    // Fallback to fetch
    await fetch('/api/analytics/claim-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
  } catch {
    // Silent failure — analytics should never break the user flow
  }
}
