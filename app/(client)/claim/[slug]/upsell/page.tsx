export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackEvent } from '@/lib/analytics/track'
import type { Metadata } from 'next'
import { ProgressSteps } from '../customize/components/progress-steps'
import UpsellClient from './upsell-client'

interface UpsellPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Strategy Call - Boost Your Website',
        robots: { index: false },
    }
}

export default async function UpsellPage({ params }: UpsellPageProps) {
    const { slug } = await params

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

    // Payment gate: only paid/customizing/completed claims can access
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, plan, currency, client_name, client_email')
        .eq('project_id', project.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!claim) {
        redirect(`/claim/${slug}`)
    }

    // Customization-existence guard: must have submitted customization form first
    const { data: customization } = await supabase
        .from('customizations')
        .select('id')
        .eq('claim_id', claim.id)
        .maybeSingle()

    if (!customization) {
        redirect(`/claim/${slug}/customize`)
    }

    // Track upsell page view — fire-and-forget
    trackEvent('upsell.viewed', { slug, projectId: project.id, plan: claim.plan }).catch(() => {})

    // Currency is always USD
    const currency = 'USD' as const

    // Extract client info for Cal.com prefill
    const clientName = (claim.client_name as string) || ''
    const clientEmail = (claim.client_email as string) || ''
    const plan = (claim.plan as 'standard' | 'pro') || 'standard'

    return (
        <main className="max-w-lg mx-auto px-4 py-8">
            {/* Progress indicator */}
            <div className="mb-8">
                <ProgressSteps currentStep={2} />
            </div>

            {/* Upsell content */}
            <UpsellClient
                claimId={claim.id}
                plan={plan}
                currency={currency}
                clientName={clientName}
                clientEmail={clientEmail}
                slug={slug}
            />
        </main>
    )
}
