import { trackClaimEvent, type ClaimEventType } from '@/lib/claim-tracking'
import { headers } from 'next/headers'

const VALID_EVENTS: string[] = [
  // Original events
  'preview_view', 'claim_page_view', 'cta_click',
  'plan_selected', 'payment_initiated', 'payment_completed',
  'customization_submitted',
  // Funnel analytics events
  'preview.viewed', 'claim.started', 'claim.form_submitted',
  'payment.checkout_opened', 'payment.completed', 'payment.failed',
  'portal.first_login',
  'upsell.viewed', 'upsell.accepted', 'upsell.declined',
  // Scroll depth events
  'scroll.25', 'scroll.50', 'scroll.75', 'scroll.100',
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { siteSlug, eventType, metadata } = body

    if (!siteSlug || !eventType || !VALID_EVENTS.includes(eventType)) {
      return Response.json({ error: 'Invalid event' }, { status: 400 })
    }

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = headersList.get('user-agent') || null

    await trackClaimEvent({ siteSlug, eventType, ip, userAgent, metadata })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}

/**
 * GET handler for cross-origin event tracking via Image pixel or sendBeacon.
 * Accepts query params: ?slug=xxx&event=preview_view
 * Returns a 1x1 transparent GIF so browsers treat it as an image load.
 * Also sets CORS headers for cross-origin beacon compatibility.
 */
export async function GET(request: Request) {
  // CORS headers for cross-origin requests from generated sites
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store, no-cache',
  }

  try {
    const { searchParams } = new URL(request.url)
    const siteSlug = searchParams.get('slug')
    const eventType = searchParams.get('event') as ClaimEventType | null

    if (!siteSlug || !eventType || !VALID_EVENTS.includes(eventType)) {
      // Return pixel anyway (don't break the image load)
      return new Response(TRANSPARENT_GIF, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'image/gif' },
      })
    }

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = headersList.get('user-agent') || null

    // Fire-and-forget -- do not block the pixel response
    trackClaimEvent({ siteSlug, eventType, ip, userAgent }).catch(() => {})

    // Return 1x1 transparent GIF
    return new Response(TRANSPARENT_GIF, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'image/gif' },
    })
  } catch {
    return new Response(TRANSPARENT_GIF, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'image/gif' },
    })
  }
}

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)
