import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { trackEvent } from '@/lib/analytics/track'
import { notifyProjectRepOnce } from '@/lib/sales/notifications'
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

// Cached project lookup — deduplicates between generateMetadata and page component
const getProjectBySlug = cache(async (slug: string) => {
    const supabase = createAdminClient()
    let { data: project } = await supabase
        .from('projects')
        .select('id, business_data, generated_code, claim_expires_at, screenshot_url, status, slug')
        .eq('slug', slug)
        .single()

    if (!project) {
        const result = await supabase
            .from('projects')
            .select('id, business_data, generated_code, claim_expires_at, screenshot_url, status, slug')
            .eq('id', slug)
            .single()
        project = result.data
    }
    return project
})

export async function generateMetadata({ params }: ClaimPageProps): Promise<Metadata> {
    const { slug } = await params
    const project = await getProjectBySlug(slug)

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

    // Reuses cached query from generateMetadata — no duplicate DB call
    const project = await getProjectBySlug(slug)

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
        // Paid but not completed — stay on main claim page (no redirect to /customize)
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
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <img src="/sumosite-logo-dark.svg" alt="Sumosite" className="h-8" />
                        <a
                            href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@sumosite.com'}`}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
                        >
                            Contact Us
                        </a>
                    </div>
                </header>
                <HeroSection businessName={businessName} screenshotUrl={project.screenshot_url} previewUrl={`/preview/${slug}`} previewHtml={previewHtml} />
                <div className="max-w-lg mx-auto">
                    <ExpiredForm projectId={project.id} businessName={businessName} />
                </div>
            </main>
        )
    }

    // Track claim page view — fire-and-forget
    trackEvent('claim.started', { slug, projectId: project.id }).catch(() => {})
    // Notify the owning sales rep the prospect is on the claim page (first view only).
    notifyProjectRepOnce(project.id, 'claim_started').catch(() => {})

    // Active state: full claim landing page
    return (
        <main className="pb-8">
            <TestModeBanner />
            <header className="sticky top-0 z-50 bg-[#050304]/90 backdrop-blur-md border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <img src="/sumosite-logo.svg" alt="Sumosite" className="h-6" />
                    <a
                        href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@sumosite.com'}`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white/80 hover:text-white border border-white/15 hover:border-white/30 rounded-full transition-colors"
                    >
                        Contact Us
                    </a>
                </div>
            </header>
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
