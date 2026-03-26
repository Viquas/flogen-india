export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { ProgressSteps } from './components/progress-steps'
import CustomizeClient from './customize-client'

interface CustomizePageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Customize Your Website',
        robots: { index: false },
    }
}

export default async function CustomizePage({ params }: CustomizePageProps) {
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

    // Payment gate: only paid/customizing claims can access
    const { data: claim } = await supabase
        .from('claims')
        .select('id, status, plan, client_name, client_email')
        .eq('project_id', project.id)
        .in('status', ['paid', 'customizing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!claim) {
        redirect(`/claim/${slug}`)
    }

    // Check for existing customization
    const { data: customization } = await supabase
        .from('customizations')
        .select('id, status')
        .eq('claim_id', claim.id)
        .maybeSingle()

    if (customization && customization.status !== 'pending') {
        redirect(`/claim/${slug}/confirmed`)
    }

    // Extract pre-fill data from business_data
    const businessData = project.business_data as Record<string, unknown>
    const contactInfo = (businessData?.contactInfo as Record<string, unknown>) || {}

    const prefill = {
        phone: (contactInfo.phone as string) || (contactInfo.formatted_phone_number as string) || '',
        email: (contactInfo.email as string) || '',
        address: (contactInfo.formatted_address as string) || (contactInfo.address as string) || '',
        businessName: (businessData?.businessName as string) || '',
    }

    return (
        <main className="max-w-lg mx-auto px-4 py-8">
            {/* Progress indicator */}
            <div className="mb-8">
                <ProgressSteps currentStep={2} />
            </div>

            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>
                    Customize Your Website
                </h1>
                <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
                    Add your logo, contact details, and preferences to make it yours.
                </p>
            </div>

            {/* Customization form */}
            <CustomizeClient
                claimId={claim.id}
                plan={claim.plan as 'standard' | 'pro'}
                slug={slug}
                prefill={prefill}
                existingCustomization={customization ? { id: customization.id, status: customization.status } : null}
            />
        </main>
    )
}
