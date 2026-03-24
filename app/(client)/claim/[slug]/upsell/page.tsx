import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Fetch project
    const { data: project } = await supabase
        .from('projects')
        .select('id, business_data')
        .eq('id', slug)
        .single()

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
