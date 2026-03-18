'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { razorpay } from '@/lib/razorpay'
import { calculateTotalPaise, type Currency, type PlanType } from '@/lib/claim-pricing'
import { z } from 'zod'

const expiredFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Valid email required'),
    phone: z.string().min(7, 'Valid phone number required').max(20),
    projectId: z.string().uuid(),
})

export async function submitExpiredClaimRequest(formData: FormData) {
    const raw = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        projectId: formData.get('projectId'),
    }

    const parsed = expiredFormSchema.safeParse(raw)

    if (!parsed.success) {
        return { success: false as const, errors: parsed.error.flatten().fieldErrors }
    }

    try {
        const supabase = createAdminClient()

        const { error } = await supabase.from('claims').insert({
            project_id: parsed.data.projectId,
            status: 'expired',
            plan: 'standard',
            amount_paise: 0,
            currency: 'INR',
            client_name: parsed.data.name,
            client_email: parsed.data.email,
            client_phone: parsed.data.phone,
            expires_at: new Date().toISOString(),
        })

        if (error) {
            console.error('[ClaimActions]', error)
            return { success: false as const, errors: { form: ['Failed to submit. Please try again.'] } }
        }

        return { success: true as const }
    } catch (error) {
        console.error('[ClaimActions]', error)
        return { success: false as const, errors: { form: ['Failed to submit. Please try again.'] } }
    }
}

// --- Razorpay Order Creation ---

const orderSchema = z.object({
    projectId: z.string().uuid(),
    plan: z.enum(['standard', 'pro']),
    currency: z.enum(['INR', 'USD']),
    domainOption: z.enum(['subdomain', 'existing', 'new']),
    domainValue: z.string().max(253).optional().default(''),
})

export async function createRazorpayOrder(input: {
    projectId: string
    plan: PlanType
    currency: Currency
    domainOption: string
    domainValue: string
}): Promise<
    | { success: true; orderId: string; claimId: string }
    | { success: false; error: string }
> {
    const parsed = orderSchema.safeParse(input)

    if (!parsed.success) {
        return { success: false, error: 'Invalid input. Please check your selections.' }
    }

    const { projectId, plan, currency, domainOption, domainValue } = parsed.data
    const amountPaise = calculateTotalPaise(plan, currency)

    try {
        const supabase = createAdminClient()

        // Idempotency check: reuse existing pending/order_created claim for same project
        const { data: existingClaim } = await supabase
            .from('claims')
            .select('id, razorpay_order_id, status')
            .eq('project_id', projectId)
            .in('status', ['pending', 'order_created'])
            .limit(1)
            .single()

        if (existingClaim?.razorpay_order_id) {
            // Already has a Razorpay order -- return it to avoid double-charge
            return {
                success: true,
                orderId: existingClaim.razorpay_order_id,
                claimId: existingClaim.id,
            }
        }

        // If a pending claim exists without an order, reuse it; otherwise create new
        let claimId: string

        if (existingClaim && !existingClaim.razorpay_order_id) {
            claimId = existingClaim.id
            // Update the existing pending claim with latest selections
            await supabase
                .from('claims')
                .update({
                    plan,
                    currency,
                    amount_paise: amountPaise,
                    domain_option: domainOption,
                    domain_value: domainValue,
                })
                .eq('id', claimId)
        } else {
            // Create new claim record
            const { data: newClaim, error: insertError } = await supabase
                .from('claims')
                .insert({
                    project_id: projectId,
                    plan,
                    currency,
                    amount_paise: amountPaise,
                    status: 'pending',
                    domain_option: domainOption,
                    domain_value: domainValue,
                    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select('id')
                .single()

            if (insertError || !newClaim) {
                console.error('[ClaimActions] Failed to create claim:', insertError)
                return { success: false, error: 'Failed to create order. Please try again.' }
            }

            claimId = newClaim.id
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency,
            receipt: claimId,
            notes: {
                claimId,
                projectId,
                plan,
            },
        })

        // Update claim with Razorpay order ID and set status to order_created
        const { error: updateError } = await supabase
            .from('claims')
            .update({
                razorpay_order_id: order.id,
                status: 'order_created',
            })
            .eq('id', claimId)

        if (updateError) {
            console.error('[ClaimActions] Failed to update claim with order:', updateError)
            // Claim exists, Razorpay order exists -- still return success
            // The webhook will reconcile via receipt/notes
        }

        return {
            success: true,
            orderId: order.id,
            claimId,
        }
    } catch (error) {
        console.error('[ClaimActions] Razorpay order creation failed:', error)
        return { success: false, error: 'Payment setup failed. Please try again.' }
    }
}
