'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

type ActionResult = { success: false; error: string }

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * Sign in with email and password via SSR cookie bridge.
 * On success, redirects to /portal. On failure, returns error message.
 * Never reveals whether the email exists (always "Invalid email or password").
 */
export async function loginWithPassword(input: {
    email: string
    password: string
}): Promise<ActionResult | never> {
    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // setAll called from Server Component context -- ignore
                    }
                },
            },
        }
    )

    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        return { success: false, error: 'Invalid email or password' }
    }

    redirect('/portal')
}

/**
 * Send a password reset email via Supabase.
 * Always returns success to avoid revealing whether the email exists.
 */
export async function sendPasswordReset(email: string): Promise<{ success: true }> {
    const emailSchema = z.string().email()
    const parsed = emailSchema.safeParse(email)

    if (!parsed.success) {
        // Still return success to not reveal info
        return { success: true }
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // setAll called from Server Component context -- ignore
                    }
                },
            },
        }
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${siteUrl}/auth/callback?next=/portal/reset`,
    })

    if (error) {
        console.error('[sendPasswordReset] Error:', error.message)
    }

    return { success: true }
}
