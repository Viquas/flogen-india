'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type ActionResult =
  | { success: true }
  | { success: false; error: string; existingUser?: boolean }

/**
 * Create a Supabase Auth account for the claim client and auto-login via SSR cookie bridge.
 *
 * Flow:
 * 1. Verify email matches claim's payment email
 * 2. Check if claim already has an auth user linked
 * 3. Attempt auth.admin.createUser (catches "already registered" for duplicate detection)
 * 4. Link auth user to claim
 * 5. Auto-login via signInWithPassword with SSR cookie bridge
 */
export async function createAccountAndLogin(input: {
  claimId: string
  email: string
  password: string
}): Promise<ActionResult> {
  const supabase = createAdminClient()

  // 1. Verify email matches the claim's payment email
  const { data: claim } = await supabase
    .from('claims')
    .select('id, client_email, auth_user_id')
    .eq('id', input.claimId)
    .in('status', ['paid', 'customizing', 'completed'])
    .single()

  if (!claim) {
    return { success: false, error: 'Claim not found or not paid' }
  }

  if (claim.client_email !== input.email) {
    return { success: false, error: 'Email does not match payment email' }
  }

  // 2. Check if account already linked to this claim
  if (claim.auth_user_id) {
    return {
      success: false,
      error: 'Account already exists for this claim',
      existingUser: true,
    }
  }

  // 3. Attempt to create auth user (duplicate detection via error message)
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { source: 'claim', claim_id: input.claimId },
  })

  if (error) {
    // Handle "already registered" gracefully
    if (
      error.message.includes('already registered') ||
      error.message.includes('already been registered')
    ) {
      return {
        success: false,
        error: 'An account with this email already exists. Please log in instead.',
        existingUser: true,
      }
    }
    return { success: false, error: error.message }
  }

  if (!newUser?.user) {
    return { success: false, error: 'Failed to create account' }
  }

  // 4. Link auth user to claim
  await supabase
    .from('claims')
    .update({ auth_user_id: newUser.user.id })
    .eq('id', claim.id)

  // 5. Auto-login via SSR client with cookie bridge
  try {
    const cookieStore = await cookies()
    const portalClient = createServerClient(
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

    await portalClient.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })
  } catch (loginError) {
    // User was created successfully. If auto-login fails, they can log in manually.
    console.error('[confirmed-actions] Auto-login failed:', loginError)
  }

  return { success: true }
}

/**
 * Login an existing Supabase Auth account via SSR cookie bridge.
 * Used when returning user is detected (existingUser flag from createAccountAndLogin).
 */
export async function loginExistingAccount(input: {
  email: string
  password: string
}): Promise<ActionResult> {
  const cookieStore = await cookies()
  const portalClient = createServerClient(
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

  const { error } = await portalClient.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    return { success: false, error: 'Invalid email or password' }
  }

  return { success: true }
}
