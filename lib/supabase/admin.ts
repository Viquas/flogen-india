import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Do not use the anon key for admin access.')
    }
    const key = supabaseServiceRoleKey

    return createClient<Database>(supabaseUrl!, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
