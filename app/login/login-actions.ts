'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/roles'

export async function loginAsAdmin(email: string, password: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    })

    if (error) {
        return { error: 'Invalid email or password' }
    }

    if (!data.user) {
        return { error: 'Authentication failed' }
    }

    const admin = await isAdmin(data.user.id)
    if (!admin) {
        await supabase.auth.signOut()
        return { error: 'You do not have admin access' }
    }

    redirect('/dashboard')
}

export async function logoutAdmin() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
