import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CustomizeClient } from './customize-client'

export const metadata: Metadata = {
    title: 'Customize - Flogen Portal',
}

export default async function CustomizePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/portal/login')
    }

    const admin = createAdminClient()

    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id, plan, status, client_name')
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
        .select('id, business_data, slug')
        .eq('id', claim.project_id)
        .single()

    const { data: requests } = await admin
        .from('client_requests')
        .select('id, type, status, content, created_at, updated_at')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false })

    const businessData = project?.business_data as Record<string, unknown> | null
    const businessName = (businessData?.businessName as string) || claim.client_name || 'Your Business'

    // Cast content from Json to the expected shape for the client component
    const mappedRequests = (requests ?? []).map((r) => ({
        ...r,
        content: (r.content ?? { description: '' }) as { description: string; file_urls?: string[] },
    }))

    // Find the most recent logo_upload request to get existing logo URL
    const logoRequest = (requests ?? []).find((r) => r.type === 'logo_upload')
    const logoContent = logoRequest?.content as { logo_url?: string } | null
    const existingLogoUrl = logoContent?.logo_url ?? null

    return (
        <CustomizeClient
            claimId={claim.id}
            projectId={claim.project_id}
            userId={user.id}
            businessName={businessName}
            existingLogoUrl={existingLogoUrl}
            requests={mappedRequests}
        />
    )
}
