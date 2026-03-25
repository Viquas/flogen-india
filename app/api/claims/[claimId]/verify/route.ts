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

        await supabase
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
            .eq('status', 'order_created') // idempotency guard

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
