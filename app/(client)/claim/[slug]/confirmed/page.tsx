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

    // Require an explicit claimId (the payment redirect always includes it).
    // The previous "most recent paid claim" fallback let anyone who knew the
    // public slug load /confirmed with no params and read the payer's email +
    // claimId — the pair that createAccountAndLogin trusts. No fallback: an
    // unparameterized or mismatched request is sent back to the claim page.
    if (!claimIdParam) {
        redirect(`/claim/${slug}`)
    }

    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, plan, amount_paise, paid_at, client_email')
        .eq('id', claimIdParam)
        .eq('project_id', project.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .maybeSingle()

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
