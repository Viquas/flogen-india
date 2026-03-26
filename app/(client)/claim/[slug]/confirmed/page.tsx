export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent } from '@/lib/analytics/track'
import type { Metadata } from 'next'
import { ConfirmationClient } from './confirmation-client'
import { TestModeBanner } from '../components/test-mode-banner'

interface ConfirmedPageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ claimId?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Payment Confirmed - Your Website is Being Prepared',
        description: 'Your payment has been received. Your website is being customized and prepared for launch.',
        robots: { index: false },
    }
}

export default async function ConfirmedPage({ params, searchParams }: ConfirmedPageProps) {
    const { slug } = await params
    const { claimId: claimIdParam } = await searchParams

    const supabase = createAdminClient()

    // Try slug first, then fall back to UUID id
    let { data: project } = await supabase
        .from('projects')
        .select('id, business_data')
        .eq('slug', slug)
        .single()

    if (!project) {
        const result = await supabase
            .from('projects')
            .select('id, business_data')
            .eq('id', slug)
            .single()
        project = result.data
    }

    if (!project) {
        notFound()
    }

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || 'Your Business'

    // Find the most recent paid/order_created claim for this project
    // Use claimId from search params if available, otherwise find latest
    let claim
    if (claimIdParam) {
        const { data } = await supabase
            .from('claims')
            .select('id, status, plan, amount_paise, paid_at, client_email')
            .eq('id', claimIdParam)
            .eq('project_id', project.id)
            .single()
        claim = data
    }

    if (!claim) {
        // Fallback: find most recent non-expired claim
        const { data } = await supabase
            .from('claims')
            .select('id, status, plan, amount_paise, paid_at, client_email')
            .eq('project_id', project.id)
            .in('status', ['order_created', 'paid', 'customizing', 'completed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        claim = data
    }

    // If no valid claim found, redirect back to claim page
    if (!claim) {
        redirect(`/claim/${slug}`)
    }

    // Track payment completion — fire-and-forget
    trackEvent('payment.completed', { slug, projectId: project.id, plan: claim.plan }).catch(() => {})

    return (
        <main className="max-w-lg mx-auto px-4 py-8">
            <TestModeBanner />
            <ConfirmationClient
                claimId={claim.id}
                initialStatus={claim.status}
                businessName={businessName}
                plan={claim.plan}
                amountPaise={claim.amount_paise}
                paidAt={claim.paid_at}
                slug={slug}
                email={claim.client_email}
            />
        </main>
    )
}
