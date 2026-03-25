import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { deriveSiteStatus } from '@/lib/portal/status'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = {
    title: 'Dashboard - Flogen Portal',
}

export default async function PortalDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/portal/login')
    }

    const admin = createAdminClient()

    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id, plan, status, client_name, client_email')
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
        .select('id, business_data, generated_code, slug, version, updated_at')
        .eq('id', claim.project_id)
        .single()

    const businessData = project?.business_data as Record<string, unknown> | null
    const businessName = (businessData?.businessName as string) || claim.client_name || 'Your Business'

    const previewHtml = project?.generated_code
        ? constructHtmlBoilerplate(project.generated_code)
        : ''

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const previewUrl = `${siteUrl}/preview/${project?.id}`
    const displayUrl = previewUrl

    const { count: pendingRequests } = await admin
        .from('client_requests')
        .select('id', { count: 'exact', head: true })
        .eq('auth_user_id', user.id)
        .eq('status', 'pending')

    const { count: inProgressRequests } = await admin
        .from('client_requests')
        .select('id', { count: 'exact', head: true })
        .eq('auth_user_id', user.id)
        .eq('status', 'in_progress')

    const status = deriveSiteStatus({
        pendingRequestCount: pendingRequests ?? 0,
        inProgressRequestCount: inProgressRequests ?? 0,
    })

    return (
        <DashboardClient
            previewHtml={previewHtml}
            businessName={businessName}
            previewUrl={previewUrl}
            displayUrl={displayUrl}
            plan={claim.plan}
            status={status}
            updatedAt={project?.updated_at ?? null}
        />
    )
}
