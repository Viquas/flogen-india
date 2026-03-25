import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DomainClient } from './domain-client'

export const metadata: Metadata = {
    title: 'Domain - Flogen Portal',
}

export default async function PortalDomainPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/portal/login')
    }

    const admin = createAdminClient()

    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id, plan, domain_option, domain_value')
        .eq('auth_user_id', user.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!claim) {
        redirect('/portal/login')
    }

    const { data: project } = await admin
        .from('projects')
        .select('id, slug, business_data')
        .eq('id', claim.project_id)
        .single()

    const businessData = project?.business_data as Record<string, unknown> | null
    const businessName = (businessData?.businessName as string) || 'Your Business'
    const category = (businessData?.category as string) || 'business'

    return (
        <DomainClient
            claimId={claim.id}
            domainOption={claim.domain_option}
            domainValue={claim.domain_value}
            projectSlug={project?.slug || ''}
            businessName={businessName}
            category={category}
        />
    )
}
