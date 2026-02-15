import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If service role key is missing, warn but fallback to anon key (which will fail for admin tasks)
    // This helps in development if the key isn't set up yet but some parts might still work
    if (!supabaseServiceRoleKey) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will likely fail.')
    }

    // Default to anon key if service role is missing, to prevent immediate crash if not used for sensitive ops
    // But for admin ops, we really need the service role key.
    const key = supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createClient<Database>(supabaseUrl!, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
