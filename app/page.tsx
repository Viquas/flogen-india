import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/roles'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const admin = await isAdmin(user.id)
        if (admin) redirect('/dashboard')
    }

    redirect('/login')
}
