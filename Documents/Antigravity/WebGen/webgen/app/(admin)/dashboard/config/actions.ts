"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getConfiguration(key: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('configurations')
        .select('value')
        .eq('key', key)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // Not found
            return { success: true, value: null }
        }
        console.error('Failed to get configuration:', error)
        return { success: false, error: error.message }
    }

    return { success: true, value: data.value }
}

export async function saveConfiguration(key: string, value: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('configurations')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) {
        console.error('Failed to save configuration:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/config')
    return { success: true }
}
