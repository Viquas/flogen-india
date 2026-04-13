import { createClient } from '@/lib/supabase/server'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { ForbiddenError } from './require-admin'

/**
 * Check whether a user has the `sales` or `admin` role.
 * Queries user_roles table via untyped admin client (bypasses RLS + typed schema).
 * Admin users implicitly have sales access for oversight.
 */
async function hasSalesOrAdminRole(userId: string): Promise<boolean> {
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
            .eq('id', userId)
            .maybeSingle()

        return data?.role === 'sales' || data?.role === 'admin'
    } catch {
        return false
    }
}

/**
 * Require sales (or admin) role for the current session.
 * Fast path: app_metadata.role. Fallback: user_roles table.
 * Throws ForbiddenError if not authorized.
 */
export async function requireSales(): Promise<{ userId: string; isAdmin: boolean }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new ForbiddenError('Not authenticated')
    }

    const metaRole = user.app_metadata?.role
    if (metaRole === 'admin') return { userId: user.id, isAdmin: true }
    if (metaRole === 'sales') return { userId: user.id, isAdmin: false }

    // Fallback: DB lookup
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createRawClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await admin
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (data?.role === 'admin') return { userId: user.id, isAdmin: true }
    if (data?.role === 'sales') return { userId: user.id, isAdmin: false }

    throw new ForbiddenError('Sales access required')
}

/**
 * Non-throwing check for conditional logic.
 */
export async function checkHasSalesAccess(userId: string): Promise<boolean> {
    return hasSalesOrAdminRole(userId)
}
