import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ claimId: string }> }
) {
    const { claimId } = await params
    const supabase = createAdminClient()

    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, paid_at, plan, amount_paise, currency')
        .eq('id', claimId)
        .single()

    if (!claim) {
        return Response.json({ error: 'Claim not found' }, { status: 404 })
    }

    return Response.json({
        status: claim.status,
        paidAt: claim.paid_at,
        plan: claim.plan,
        amountPaise: claim.amount_paise,
        currency: claim.currency,
    })
}
