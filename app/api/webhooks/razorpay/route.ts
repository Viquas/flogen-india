import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { razorpayWebhookSecret } from '@/lib/razorpay'
import { notifyProjectRep } from '@/lib/sales/notifications'

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

async function handleAgentPayment(
    payment: {
        id: string
        order_id: string
        amount: number
        notes: Record<string, string>
    },
    eventId: string | null
) {
    const supabase = createAdminClient()

    const claimId = payment.notes?.claim_id
    const projectId = payment.notes?.project_id
    const authUserId = payment.notes?.auth_user_id
    const paymentType = payment.notes?.type

    if (!claimId || !projectId || !authUserId) {
        throw new Error(
            `Agent payment missing required notes: claim_id=${claimId}, project_id=${projectId}, auth_user_id=${authUserId}`
        )
    }

    // Determine request type based on payment type
    const requestType = paymentType === 'domain_setup' ? 'domain_setup' : 'agent_call'

    // Razorpay delivers webhooks at-least-once and this path never writes
    // webhook_event_id (the claims-based dedup), so dedupe on the payment id
    // to avoid queueing duplicate requests for a single charge.
    const { data: existingRequest } = await supabase
        .from('client_requests')
        .select('id')
        .eq('claim_id', claimId)
        .eq('content->>payment_id', payment.id)
        .maybeSingle()

    if (existingRequest) {
        console.log('[Webhook] Agent payment already processed:', payment.id)
        return
    }

    await supabase
        .from('client_requests')
        .insert({
            claim_id: claimId,
            project_id: projectId,
            auth_user_id: authUserId,
            type: requestType,
            status: 'pending',
            content: {
                description: 'Agent support requested via $49 payment',
                payment_id: payment.id,
                payment_amount: payment.amount,
                payment_type: paymentType,
            },
        })

    console.log('[Webhook] Agent payment processed:', payment.id, 'type:', paymentType)
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
    // Check if this is an agent payment -- handle separately and return early
    const paymentType = payment.notes?.type
    if (paymentType === 'agent_support' || paymentType === 'domain_setup') {
        await handleAgentPayment(payment, eventId)
        return
    }

    const supabase = createAdminClient()

    // Find claim by razorpay_order_id
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, project_id')
        .eq('razorpay_order_id', payment.order_id)
        .single()

    if (!claim) {
        throw new Error('No claim found for order: ' + payment.order_id)
    }

    // Status guard: allow order_created -> paid, and also cancelled -> paid.
    // Razorpay Checkout lets a customer retry a declined attempt on the SAME
    // order_id: payment.failed fires first (claim -> cancelled), then a
    // successful retry fires payment.captured — that capture must still win,
    // or the customer is charged while the claim stays cancelled forever.
    if (claim.status !== 'order_created' && claim.status !== 'cancelled') {
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

    // Notify the owning sales rep of the conversion (highest-value signal).
    if (claim.project_id) {
        await notifyProjectRep(claim.project_id, 'claim_paid', { amountPaise: payment.amount }).catch(() => {})
    }
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
