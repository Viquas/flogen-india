'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getRazorpayClient } from '@/lib/razorpay'
import { calculateTotalCents, MAINTENANCE_PRICING, UPSELL_PRICING, CLAIM_WINDOW_DAYS, type PlanType } from '@/lib/claim-pricing'
import { notifyProjectRep } from '@/lib/sales/notifications'
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
            currency: 'USD',
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

// --- Manual-payment interest capture ---

const interestSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.string().email('Valid email required'),
    phone: z.string().trim().min(7, 'Valid phone number required').max(20),
    projectId: z.string().uuid(),
})

/**
 * "Get in touch" submission used when PAYMENT_MODE is 'manual' — there's no online
 * checkout, so the prospect raises their hand and a rep arranges payment offline.
 *
 * Records a pending claim carrying the contact details (so the lead shows up in the
 * sales warm-lead queue and can later be marked paid against the same row) and
 * notifies the assigned rep.
 */
export async function submitInterestRequest(formData: FormData) {
    const parsed = interestSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        projectId: formData.get('projectId'),
    })

    if (!parsed.success) {
        return { success: false as const, errors: parsed.error.flatten().fieldErrors }
    }

    try {
        const supabase = createAdminClient()

        // Already converted? Don't create a stray pending claim (the claim page
        // normally redirects paid projects, but guard the action directly too).
        const { data: paidClaim } = await supabase
            .from('claims')
            .select('id')
            .eq('project_id', parsed.data.projectId)
            .in('status', ['paid', 'customizing', 'completed'])
            .limit(1)
            .maybeSingle()
        if (paidClaim) {
            return { success: true as const }
        }

        // Don't create a second request if this project already has an open claim —
        // update it so the rep sees the latest contact details on one row.
        const { data: existing } = await supabase
            .from('claims')
            .select('id')
            .eq('project_id', parsed.data.projectId)
            .in('status', ['pending', 'order_created'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const contact = {
            client_name: parsed.data.name,
            client_email: parsed.data.email,
            client_phone: parsed.data.phone,
        }

        if (existing) {
            await supabase.from('claims').update(contact).eq('id', existing.id)
        } else {
            const { error } = await supabase.from('claims').insert({
                project_id: parsed.data.projectId,
                status: 'pending',
                plan: 'standard',
                // Manual payment: the real figure is agreed offline, so don't invent one.
                amount_paise: 0,
                currency: 'USD',
                ...contact,
                expires_at: new Date(Date.now() + CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
            })
            if (error) {
                console.error('[ClaimActions] interest request failed:', error)
                return { success: false as const, errors: { form: ['Failed to submit. Please try again.'] } }
            }
        }

        await notifyProjectRep(parsed.data.projectId, 'interest_submitted', {
            email: parsed.data.email,
            phone: parsed.data.phone,
        })

        return { success: true as const }
    } catch (error) {
        console.error('[ClaimActions] interest request failed:', error)
        return { success: false as const, errors: { form: ['Failed to submit. Please try again.'] } }
    }
}

// --- Razorpay Order Creation ---

const orderSchema = z.object({
    projectId: z.string().uuid(),
    plan: z.enum(['standard', 'pro']),
    addMaintenance: z.boolean().optional().default(false),
})

export async function createRazorpayOrder(input: {
    projectId: string
    plan: PlanType
    addMaintenance?: boolean
}): Promise<
    | { success: true; orderId: string; claimId: string }
    | { success: false; error: string }
> {
    const parsed = orderSchema.safeParse(input)

    if (!parsed.success) {
        return { success: false, error: 'Invalid input. Please check your selections.' }
    }

    const { projectId, plan, addMaintenance } = parsed.data
    const amountCents = calculateTotalCents(plan)
    // Maintenance is a recurring monthly add-on billed separately — record the
    // opt-in, but do NOT add it to the one-time Razorpay charge.
    const maintenanceMonthlyCents = addMaintenance ? MAINTENANCE_PRICING[plan].amount : null

    try {
        const supabase = createAdminClient()

        // Guard: never create a new order for a project that already has a
        // successful claim — a paid customer revisiting the claim page must
        // not be able to pay twice.
        const { data: paidClaim } = await supabase
            .from('claims')
            .select('id, status')
            .eq('project_id', projectId)
            .in('status', ['paid', 'customizing', 'completed'])
            .limit(1)
            .maybeSingle()

        if (paidClaim) {
            return { success: false, error: 'This website has already been claimed and paid for.' }
        }

        // Idempotency check: reuse existing pending/order_created claim for same
        // project. maybeSingle + newest-first: .single() errors when concurrent
        // visitors created duplicate pending rows, which made every later call
        // fall through to creating yet another claim.
        const { data: existingClaim } = await supabase
            .from('claims')
            .select('id, razorpay_order_id, status')
            .eq('project_id', projectId)
            .in('status', ['pending', 'order_created'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (existingClaim?.razorpay_order_id) {
            // Already has a Razorpay order -- return it to avoid double-charge.
            // Still capture the latest maintenance choice: it's a separate recurring
            // add-on and doesn't affect the one-time order amount, so re-toggling it
            // before re-confirming must not be lost.
            await supabase
                .from('claims')
                // Cast: maintenance_* columns (migration 20260716000001) are not yet in
                // the generated Supabase types until the DB is migrated + types regenerated.
                .update({
                    maintenance_selected: addMaintenance,
                    maintenance_monthly_cents: maintenanceMonthlyCents,
                } as never)
                .eq('id', existingClaim.id)
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
                // Cast: maintenance_* columns not yet in generated types (see above).
                .update({
                    plan,
                    currency: 'USD',
                    amount_paise: amountCents,
                    maintenance_selected: addMaintenance,
                    maintenance_monthly_cents: maintenanceMonthlyCents,
                } as never)
                .eq('id', claimId)
        } else {
            // Create new claim record
            const { data: newClaim, error: insertError } = await supabase
                .from('claims')
                // Cast: maintenance_* columns not yet in generated types (see above).
                .insert({
                    project_id: projectId,
                    plan,
                    currency: 'USD',
                    amount_paise: amountCents,
                    maintenance_selected: addMaintenance,
                    maintenance_monthly_cents: maintenanceMonthlyCents,
                    status: 'pending',
                    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                } as never)
                .select('id')
                .single()

            if (insertError || !newClaim) {
                console.error('[ClaimActions] Failed to create claim:', insertError)
                return { success: false, error: 'Failed to create order. Please try again.' }
            }

            claimId = newClaim.id
        }

        // Create Razorpay order
        const order = await getRazorpayClient().orders.create({
            amount: amountCents,
            currency: 'USD',
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

// --- Customization Submission ---

const customizationSchema = z.object({
    claimId: z.string().uuid(),
    logoUrl: z.string().min(1, 'Logo is required'),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal('')).optional().default(''),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal('')).optional().default(''),
    phone: z.string().max(20).optional().default(''),
    email: z.string().email().or(z.literal('')).optional().default(''),
    address: z.string().max(500).optional().default(''),
    whatsapp: z.string().regex(/^\+?[0-9\s\-().]{7,20}$/).or(z.literal('')).optional().default(''),
    photoUrls: z.array(z.string()).max(10).optional().default([]),
    notes: z.string().max(1000).optional().default(''),
    wantsBookingSystem: z.boolean().optional().default(false),
    bookingPreferences: z.object({
        serviceTypes: z.array(z.string()).max(10),
        availableDays: z.array(z.string()),
        hours: z.object({ start: z.string(), end: z.string() }),
        bufferMinutes: z.number().min(0).max(120),
    }).nullable().optional().default(null),
})

export async function submitCustomization(
    input: z.infer<typeof customizationSchema>
): Promise<{ success: true } | { success: false; error: string }> {
    const parsed = customizationSchema.safeParse(input)

    if (!parsed.success) {
        const firstError = parsed.error.issues?.[0]?.message || 'Invalid input'
        return { success: false, error: firstError }
    }

    const {
        claimId,
        logoUrl,
        primaryColor,
        secondaryColor,
        phone,
        email,
        address,
        whatsapp,
        photoUrls,
        notes,
        wantsBookingSystem,
        bookingPreferences,
    } = parsed.data

    try {
        const supabase = createAdminClient()

        // Verify claim is paid or customizing
        const { data: claim } = await supabase
            .from('claims')
            .select('id, status')
            .eq('id', claimId)
            .in('status', ['paid', 'customizing'])
            .maybeSingle()

        if (!claim) {
            return { success: false, error: 'Claim not found or not in a valid state.' }
        }

        // Build customization record
        const customizationData = {
            claim_id: claimId,
            logo_url: logoUrl,
            primary_color: primaryColor || null,
            secondary_color: secondaryColor || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            photo_urls: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
            notes: notes || null,
            wants_booking_system: wantsBookingSystem,
            booking_preferences: bookingPreferences ? JSON.stringify(bookingPreferences) : null,
            status: 'pending' as const,
        }

        // Check for existing customization -- update if pending, otherwise insert
        const { data: existing } = await supabase
            .from('customizations')
            .select('id, status')
            .eq('claim_id', claimId)
            .maybeSingle()

        if (existing && existing.status === 'pending') {
            // Update existing pending customization
            const { error: updateError } = await supabase
                .from('customizations')
                .update(customizationData)
                .eq('id', existing.id)

            if (updateError) {
                console.error('[ClaimActions] Failed to update customization:', updateError)
                return { success: false, error: 'Failed to save customization. Please try again.' }
            }
        } else if (!existing) {
            // Insert new customization
            const { error: insertError } = await supabase
                .from('customizations')
                .insert(customizationData)

            if (insertError) {
                console.error('[ClaimActions] Failed to create customization:', insertError)
                return { success: false, error: 'Failed to save customization. Please try again.' }
            }
        } else {
            // Existing customization in non-pending state -- already submitted
            return { success: false, error: 'Customization has already been submitted.' }
        }

        // Update claim status to 'customizing'
        const { error: claimUpdateError } = await supabase
            .from('claims')
            .update({ status: 'customizing' })
            .eq('id', claimId)

        if (claimUpdateError) {
            console.error('[ClaimActions] Failed to update claim status:', claimUpdateError)
            // Non-fatal: customization was saved, status can be reconciled
        }

        console.log('[ClaimActions] Customization submitted for claim:', claimId)

        return { success: true }
    } catch (error) {
        console.error('[ClaimActions] Customization submission failed:', error)
        return { success: false, error: 'Something went wrong. Please try again.' }
    }
}

// --- Upsell Order Creation ---

const upsellOrderSchema = z.object({
    claimId: z.string().uuid(),
})

export async function createUpsellOrder(input: {
    claimId: string
}): Promise<
    | { success: true; orderId: string }
    | { success: false; error: string }
> {
    const parsed = upsellOrderSchema.safeParse(input)

    if (!parsed.success) {
        return { success: false, error: 'Invalid input.' }
    }

    const { claimId } = parsed.data

    try {
        const supabase = createAdminClient()

        // Verify claim is in a valid paid state
        const { data: claim } = await supabase
            .from('claims')
            .select('id, status')
            .eq('id', claimId)
            .in('status', ['paid', 'customizing'])
            .maybeSingle()

        if (!claim) {
            return { success: false, error: 'Claim not found or not eligible for upsell.' }
        }

        const amount = UPSELL_PRICING.strategy_call

        // Create Razorpay order for upsell
        const order = await getRazorpayClient().orders.create({
            amount,
            currency: 'USD',
            receipt: `upsell-${claimId}`,
            notes: {
                claimId,
                type: 'strategy_call',
            },
        })

        console.log('[ClaimActions] Upsell order created:', order.id, 'for claim:', claimId)

        return { success: true, orderId: order.id }
    } catch (error) {
        console.error('[ClaimActions] Upsell order creation failed:', error)
        return { success: false, error: 'Payment setup failed. Please try again.' }
    }
}

// --- Strategy Call Preference ---

export async function updateStrategyCallPreference(
    claimId: string,
    wantsCall: boolean
): Promise<{ success: boolean }> {
    if (!claimId || typeof wantsCall !== 'boolean') {
        return { success: false }
    }

    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('customizations')
            .update({ wants_strategy_call: wantsCall })
            .eq('claim_id', claimId)

        if (error) {
            console.error('[ClaimActions] Failed to update strategy call preference:', error)
            return { success: false }
        }

        console.log('[ClaimActions] Strategy call preference updated for claim:', claimId, '-> wants_call:', wantsCall)

        return { success: true }
    } catch (error) {
        console.error('[ClaimActions] Strategy call preference update failed:', error)
        return { success: false }
    }
}
