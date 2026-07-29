'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkHasSalesAccess } from '@/lib/auth/require-sales'

export async function loginAsSales(email: string, password: string) {
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

    const allowed = await checkHasSalesAccess(data.user.id)
    if (!allowed) {
        await supabase.auth.signOut()
        return { error: 'You do not have sales access' }
    }

    redirect('/sales')
}

export async function logoutSales() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/sales-login')
}
