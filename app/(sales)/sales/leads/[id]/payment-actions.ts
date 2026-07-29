'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireSales } from '@/lib/auth/require-sales'
import { createAdminClient } from '@/lib/supabase/admin'
import { CLAIM_WINDOW_DAYS } from '@/lib/claim-pricing'

/**
 * Manual payment tracking.
 *
 * With PAYMENT_MODE='manual' there's no Razorpay webhook to stamp claims.paid_at —
 * but paid_at is the ground truth for the whole sales layer (conversion metrics,
 * the follow-up queue's "exclude paid" rule, and the VickyOS revenue figures). So a
 * rep records the payment here and everything downstream keeps working unchanged.
 *
 * A manual payment is identifiable by `paid_at IS NOT NULL AND razorpay_payment_id
 * IS NULL`. Amount is left at 0 rather than invented — the figure is agreed offline,
 * so revenue totals intentionally don't count manual deals until that's captured.
 */

const markPaidSchema = z.object({ projectId: z.string().uuid() })

export async function markLeadPaid(
    input: z.input<typeof markPaidSchema>,
): Promise<{ ok: boolean; error?: string; alreadyPaid?: boolean }> {
    await requireSales()
    const parsed = markPaidSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'Invalid lead.' }
    const { projectId } = parsed.data

    const supabase = createAdminClient() as any
    const nowIso = new Date().toISOString()

    // Already recorded? Idempotent — never double-stamp or overwrite a real payment.
    const { data: paid } = await supabase
        .from('claims')
        .select('id')
        .eq('project_id', projectId)
        .not('paid_at', 'is', null)
        .limit(1)
        .maybeSingle()
    if (paid) return { ok: true, alreadyPaid: true }

    // Reuse the open claim if the prospect already submitted interest, so contact
    // details captured on the claim page are preserved on the same row.
    const { data: open } = await supabase
        .from('claims')
        .select('id')
        .eq('project_id', projectId)
        .in('status', ['pending', 'order_created'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (open) {
        const { error } = await supabase
            .from('claims')
            .update({ status: 'paid', paid_at: nowIso })
            .eq('id', open.id)
        if (error) return { ok: false, error: 'Could not record the payment.' }
    } else {
        const { error } = await supabase.from('claims').insert({
            project_id: projectId,
            status: 'paid',
            plan: 'standard',
            amount_paise: 0,
            currency: 'USD',
            paid_at: nowIso,
            expires_at: new Date(Date.now() + CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        })
        if (error) return { ok: false, error: 'Could not record the payment.' }
    }

    revalidatePath(`/sales/leads/${projectId}`)
    revalidatePath('/sales/followups')
    revalidatePath('/sales')
    return { ok: true }
}
