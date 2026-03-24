'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

type ActionResult = { success: false; error: string }

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

/**
 * Update the user's password after PKCE callback sets the session.
 * The auth callback route exchanges the code for a session before redirecting here,
 * so createClient() already has the authenticated session via cookies.
 */
export async function updatePassword(password: string): Promise<ActionResult | never> {
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: parsed.data,
    })

    if (error) {
        return { success: false, error: error.message }
    }

    redirect('/portal')
}
