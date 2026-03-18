'use server'

import { createAdminClient } from '@/lib/supabase/admin'
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
