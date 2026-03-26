import { createClient } from '@/lib/supabase/server'
import { ForbiddenError } from './require-admin'

/**
 * Require authenticated portal user session.
 * Throws ForbiddenError if not authenticated.
 */
export async function requirePortalUser(): Promise<{ userId: string; email: string | undefined }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new ForbiddenError('Not authenticated')
  }

  return { userId: user.id, email: user.email }
}
