import { createClient } from '@/lib/supabase/server'
import { createClient as createRawClient } from '@supabase/supabase-js'

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Query user_roles table via untyped admin client (bypasses RLS + typed schema).
 * Table created by 003_rbac.sql migration.
 */
async function hasAdminRole(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  try {
    const admin = createRawClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    return !!data
  } catch {
    return false
  }
}

/**
 * Require admin role for the current session.
 * Checks app_metadata.role first (fast), falls back to user_roles table.
 * Throws ForbiddenError if not admin.
 */
export async function requireAdmin(): Promise<{ isAdmin: true; userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new ForbiddenError('Not authenticated')
  }

  // Fast path: check app_metadata role (set via Supabase dashboard)
  if (user.app_metadata?.role === 'admin') {
    return { isAdmin: true, userId: user.id }
  }

  // Fallback: check user_roles table
  const isAdmin = await hasAdminRole(user.id)
  if (!isAdmin) {
    throw new ForbiddenError('Admin access required')
  }

  return { isAdmin: true, userId: user.id }
}

/**
 * Non-throwing version for conditional checks.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  return hasAdminRole(userId)
}
