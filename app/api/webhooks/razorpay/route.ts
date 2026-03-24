import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { razorpayWebhookSecret } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
    // 1. Read raw body FIRST -- never call request.json() before this
    const rawBody = await request.text()

    // 2. Extract signature
    const signature = request.headers.get('x-razorpay-signature')
    if (!signature) {
        console.error('[Webhook] Missing x-razorpay-signature header')
        return new Response('Missing signature', { status: 401 })
    }

    // 3. Verify HMAC-SHA256 with timing-safe comparison
    if (!razorpayWebhookSecret) {
        console.error('[Webhook] Webhook secret not configured for current mode')
        return new Response('Server configuration error', { status: 500 })
    }

    const expected = crypto
        .createHmac('sha256', razorpayWebhookSecret)
        .update(rawBody)
        .digest('hex')

    try {
        const sigBuffer = Buffer.from(signature, 'hex')
        const expBuffer = Buffer.from(expected, 'hex')
        if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
            console.error('[Webhook] Signature mismatch')
            return new Response('Invalid signature', { status: 401 })
        }
    } catch {
        // If signature is not valid hex, Buffer.from will produce different length
        console.error('[Webhook] Signature verification error (malformed signature)')
        return new Response('Invalid signature', { status: 401 })
    }

    // 4. Parse body AFTER verification
    const event = JSON.parse(rawBody)

    // 5. Extract event ID for deduplication
    const eventId = request.headers.get('x-razorpay-event-id')

    // 6. Idempotency check -- skip if already processed
    if (eventId) {
        const supabase = createAdminClient()
        const { data: existing } = await supabase
            .from('claims')
            .select('id')
            .eq('webhook_event_id', eventId)
            .maybeSingle()

        if (existing) {
            console.log('[Webhook] Event already processed:', eventId)
            return Response.json({ status: 'already_processed' })
        }
    }

    // 7. Route by event type
    const eventType: string = event.event
    const payment = event.payload?.payment?.entity

    if (!payment) {
        console.error('[Webhook] No payment entity in payload')
        return Response.json({ status: 'invalid_payload' }, { status: 400 })
    }

    // 8. Handle event with error wrapping -- return 500 on failure so Razorpay retries
    try {
        if (eventType === 'payment.captured') {
            await handlePaymentCaptured(payment, eventId)
        } else if (eventType === 'payment.failed') {
            await handlePaymentFailed(payment, eventId)
        } else {
            console.log('[Webhook] Ignoring event type:', eventType)
            return Response.json({ status: 'ignored' })
        }
    } catch (error) {
        console.error('[Webhook] Handler failed:', error)
        console.error('[Webhook] Payment object for manual reconciliation:', JSON.stringify(payment))
        return Response.json({ status: 'handler_error' }, { status: 500 })
    }

    // 9. Return success
    return Response.json({ status: 'ok' })
}

async function handlePaymentCaptured(
    payment: {
        id: string
        order_id: string
        amount: number
        currency: string
        method: string
        email: string
        contact: string
        notes: Record<string, string>
    },
    eventId: string | null
) {
    const supabase = createAdminClient()

    // Find claim by razorpay_order_id
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status')
        .eq('razorpay_order_id', payment.order_id)
        .single()

    if (!claim) {
        throw new Error('No claim found for order: ' + payment.order_id)
    }

    // Status guard: only transition from order_created -> paid
    if (claim.status !== 'order_created') {
        console.log('[Webhook] Claim already processed, status:', claim.status)
        return
    }

    // Derive client_name from payment notes or email prefix
    const clientName = payment.notes?.name
        || (payment.email ? payment.email.split('@')[0] : null)

    // Update claim to paid with contact info from Razorpay payload
    await supabase
        .from('claims')
        .update({
            status: 'paid',
            razorpay_payment_id: payment.id,
            paid_at: new Date().toISOString(),
            webhook_event_id: eventId,
            client_name: clientName || null,
            client_email: payment.email || null,
            client_phone: payment.contact || null,
        })
        .eq('id', claim.id)

    console.log('[Webhook] Claim marked as paid:', claim.id)
}

async function handlePaymentFailed(
    payment: {
        id: string
        order_id: string
        error_code: string | null
        error_description: string | null
    },
    eventId: string | null
) {
    const supabase = createAdminClient()

    const { data: claim } = await supabase
        .from('claims')
        .select('id, status')
        .eq('razorpay_order_id', payment.order_id)
        .single()

    if (!claim) {
        throw new Error('No claim found for failed payment, order: ' + payment.order_id)
    }

    // Only update if still in order_created state
    if (claim.status !== 'order_created') {
        console.log('[Webhook] Claim already processed for failed payment, status:', claim.status)
        return
    }

    await supabase
        .from('claims')
        .update({
            status: 'cancelled',
            webhook_event_id: eventId,
        })
        .eq('id', claim.id)

    console.log('[Webhook] Claim cancelled due to failed payment:', claim.id, payment.error_code, payment.error_description)
}
