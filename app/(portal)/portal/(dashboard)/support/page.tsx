import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRazorpayPublicKey, isRazorpayTestMode } from '@/lib/razorpay'
import { SupportClient } from './support-client'

export const metadata: Metadata = {
    title: 'Support - Sumosite Portal',
}

export default async function PortalSupportPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/portal/login')
    }

    const admin = createAdminClient()

    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id, plan, client_email')
        .eq('auth_user_id', user.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!claim) {
        redirect('/portal/login')
    }

    return (
        <SupportClient
            claimId={claim.id}
            clientEmail={claim.client_email || user.email || ''}
            razorpayKeyId={getRazorpayPublicKey()}
            isTestMode={isRazorpayTestMode}
        />
    )
}
