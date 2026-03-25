import { createAdminClient } from './admin'

export async function isAdmin(userId: string): Promise<boolean> {
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .single()
    return data?.role === 'admin'
}
