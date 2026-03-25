export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import type { Metadata } from 'next'
import { HeroSection } from './components/hero-section'
import { CustomizationSection } from './components/customization-section'
import { TestimonialsSection } from './components/testimonials-section'
import { FeaturesGrid } from './components/features-grid'
import { TrustSection } from './components/trust-section'
import { FaqAccordion } from './components/faq-accordion'
import { ExpiredForm } from './components/expired-form'
import { TestModeBanner } from './components/test-mode-banner'
import ClaimPageClient from './claim-page-client'

interface ClaimPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ClaimPageProps): Promise<Metadata> {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data: project } = await supabase
        .from('projects')
        .select('business_data, screenshot_url')
        .eq('id', slug)
        .single()

    if (!project) {
        return { title: 'Claim Your Website' }
    }

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || 'Your Business'

    return {
        title: `${businessName} - Your Website is Ready`,
        description: `A professional website has been built for ${businessName}. Claim it before the offer expires.`,
        openGraph: {
            title: `${businessName} - Claim Your Website`,
            description: `A professional website built just for ${businessName}. View it now.`,
            images: project.screenshot_url
                ? [{ url: project.screenshot_url, width: 1280, height: 800, alt: `Website preview for ${businessName}` }]
                : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${businessName} - Your Website is Ready`,
            description: `A professional website built just for ${businessName}.`,
            images: project.screenshot_url ? [project.screenshot_url] : [],
        },
    }
}

export default async function ClaimPage({ params }: ClaimPageProps) {
    const { slug } = await params

    const supabase = createAdminClient()

    const { data: project } = await supabase
        .from('projects')
        .select('id, business_data, generated_code, claim_expires_at, screenshot_url, status')
        .eq('id', slug)
        .single()

    if (!project) {
        notFound()
    }

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || 'Your Business'

    // Check if already paid — route based on status and customization state
    const { data: paidClaim } = await supabase
        .from('claims')
        .select('id, status, plan')
        .eq('project_id', project.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .limit(1)
        .maybeSingle()

    if (paidClaim) {
        if (paidClaim.status === 'completed') {
            redirect(`/claim/${slug}/confirmed`)
        }
        const { data: customization } = await supabase
            .from('customizations')
            .select('id')
            .eq('claim_id', paidClaim.id)
            .maybeSingle()

        if (customization) {
            redirect(`/claim/${slug}/confirmed`)
        }
        redirect(`/claim/${slug}/customize`)
    }

    // Build preview HTML for the hero iframe
    const previewHtml = project.generated_code
        ? constructHtmlBoilerplate(project.generated_code)
        : null

    // Check if claim has expired
    const isExpired = project.claim_expires_at
        ? new Date(project.claim_expires_at) < new Date()
        : false

    // Query approved count for trust section
    const { count: approvedCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

    // Expired state
    if (isExpired) {
        return (
            <main>
                <TestModeBanner />
                <HeroSection businessName={businessName} screenshotUrl={project.screenshot_url} previewUrl={`/preview/${slug}`} previewHtml={previewHtml} />
                <div className="max-w-lg mx-auto">
                    <ExpiredForm projectId={project.id} businessName={businessName} />
                </div>
            </main>
        )
    }

    // Active state: full claim landing page
    return (
        <main className="pb-8">
            <TestModeBanner />
            <HeroSection businessName={businessName} screenshotUrl={project.screenshot_url} previewUrl={`/preview/${slug}`} previewHtml={previewHtml} />

            <ClaimPageClient
                projectId={project.id}
                expiresAt={project.claim_expires_at || ''}
                businessName={businessName}
                slug={slug}
            />

            <CustomizationSection />
            <TestimonialsSection />
            <FeaturesGrid />
            <TrustSection approvedCount={approvedCount || 0} />
            <FaqAccordion />

            <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-[#050304]/20">
                <p>Made with care by Sumosite</p>
            </footer>
        </main>
    )
}
