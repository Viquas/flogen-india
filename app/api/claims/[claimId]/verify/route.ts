import { createAdminClient } from '@/lib/supabase/admin'
import { getRazorpayClient } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ claimId: string }> }
) {
    const { claimId } = await params

    if (!claimId) {
        return Response.json({ error: 'Missing claimId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Step 1: Query claim by ID
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, razorpay_order_id, client_email')
        .eq('id', claimId)
        .single()

    if (!claim) {
        return Response.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Step 2: If already in a paid/post-paid state, return immediately
    if (claim.status === 'paid' || claim.status === 'customizing' || claim.status === 'completed') {
        return Response.json({
            verified: true,
            status: claim.status,
            email: claim.client_email,
        })
    }

    // Step 3: If claim has a Razorpay order, check with Razorpay API
    if (!claim.razorpay_order_id) {
        return Response.json({ verified: false, status: claim.status })
    }

    try {
        // Step 4: Fetch payments for this order from Razorpay API
        const paymentsResponse = await getRazorpayClient().orders.fetchPayments(claim.razorpay_order_id)
        const items = paymentsResponse?.items || []

        // Step 5: Find a captured payment
        const captured = items.find(
            (p: { status: string }) => p.status === 'captured'
        )

        if (!captured) {
            return Response.json({ verified: false, status: claim.status })
        }

        // Step 6: Update claim in DB (idempotent with status guard)
        const clientName = (captured.notes as Record<string, string>)?.name
            || (captured.email ? captured.email.split('@')[0] : null)

        // Idempotency guard: only pre-paid states may transition to paid.
        // 'cancelled' is included because a failed attempt (payment.failed
        // webhook) followed by a successful retry on the same order must
        // still be able to reach 'paid'.
        const { data: updated } = await supabase
            .from('claims')
            .update({
                status: 'paid',
                razorpay_payment_id: captured.id,
                paid_at: new Date().toISOString(),
                client_email: captured.email || null,
                client_phone: captured.contact ? String(captured.contact) : null,
                client_name: clientName || null,
            })
            .eq('id', claim.id)
            .in('status', ['order_created', 'cancelled'])
            .select('status')

        if (!updated || updated.length === 0) {
            // Update matched no rows — re-read so we report the real state
            // instead of claiming 'paid' when the transition didn't happen.
            const { data: current } = await supabase
                .from('claims')
                .select('status, client_email')
                .eq('id', claim.id)
                .single()
            const nowPaid = current?.status === 'paid'
                || current?.status === 'customizing'
                || current?.status === 'completed'
            return Response.json({
                verified: nowPaid,
                status: current?.status ?? claim.status,
                email: current?.client_email ?? claim.client_email,
            })
        }

        // Step 7: Return verified
        return Response.json({
            verified: true,
            status: 'paid',
            email: captured.email,
        })
    } catch (error) {
        console.error('[Verify] Razorpay API call failed:', error)
        // If Razorpay API fails, fall back to current DB status
        return Response.json({ verified: false, status: claim.status })
    }
}
