import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { HeroSection } from './components/hero-section'
import { FeaturesGrid } from './components/features-grid'
import { TrustSection } from './components/trust-section'
import { FaqAccordion } from './components/faq-accordion'
import { ExpiredForm } from './components/expired-form'
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

    // Geo-detection: read country from Vercel header
    const headersList = await headers()
    const country = headersList.get('x-vercel-ip-country') || process.env.NEXT_PUBLIC_DEV_COUNTRY || 'IN'
    const initialCurrency = country === 'IN' ? 'INR' as const : 'USD' as const

    // Data fetching
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

    // Check if claim has expired
    const isExpired = project.claim_expires_at
        ? new Date(project.claim_expires_at) < new Date()
        : false

    // Query approved count for trust section
    const { count: approvedCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

    // Expired state: show hero + expired form only
    if (isExpired) {
        return (
            <main className="max-w-lg mx-auto">
                <HeroSection businessName={businessName} screenshotUrl={project.screenshot_url} />
                <ExpiredForm projectId={project.id} businessName={businessName} />
            </main>
        )
    }

    // Active state: full claim landing page
    return (
        <main className="max-w-2xl mx-auto pb-8">
            {/* Hero section with screenshot and business name */}
            <HeroSection businessName={businessName} screenshotUrl={project.screenshot_url} />

            {/* Interactive client sections: countdown, pricing, domain, CTA */}
            <ClaimPageClient
                initialCurrency={initialCurrency}
                expiresAt={project.claim_expires_at || ''}
                businessName={businessName}
            />

            {/* Server-rendered static sections */}
            <FeaturesGrid />
            <TrustSection approvedCount={approvedCount || 0} />
            <FaqAccordion />

            {/* Footer */}
            <footer className="px-4 py-6 text-center text-xs text-gray-400">
                <p>Made with care by Flogen</p>
            </footer>
        </main>
    )
}
