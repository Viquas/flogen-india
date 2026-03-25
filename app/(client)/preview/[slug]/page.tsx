export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { injectCtaBar } from '@/lib/cta-injector'
import { CLAIM_WINDOW_DAYS } from '@/lib/claim-pricing'
import { addDays } from 'date-fns'
import type { Metadata } from 'next'

interface PreviewPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data: project } = await supabase
        .from('projects')
        .select('business_data, screenshot_url')
        .eq('id', slug)
        .single()

    if (!project) {
        return { title: 'Preview' }
    }

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || 'Your Business'

    return {
        title: `${businessName} - Website Preview`,
        description: `A professional website built for ${businessName}. Claim it before the offer expires.`,
        openGraph: {
            title: `${businessName} - Website Preview`,
            description: `A professional website built just for ${businessName}.`,
            images: project.screenshot_url
                ? [{ url: project.screenshot_url, width: 1280, height: 800, alt: `Website preview for ${businessName}` }]
                : [],
            type: 'website',
        },
    }
}

export default async function PreviewPage({ params }: PreviewPageProps) {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data: project } = await supabase
        .from('projects')
        .select('id, business_data, generated_code, claim_expires_at')
        .eq('id', slug)
        .single()

    if (!project || !project.generated_code) {
        notFound()
    }

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || 'Your Business'

    const baseHtml = constructHtmlBoilerplate(project.generated_code)
    const expiresAt = project.claim_expires_at
        || addDays(new Date(), CLAIM_WINDOW_DAYS).toISOString()

    const injectedHtml = injectCtaBar(baseHtml, {
        businessName,
        claimUrl: `/claim/${slug}`,
        expiresAt,
        siteSlug: slug,
    })

    return (
        <iframe
            srcDoc={injectedHtml}
            className="fixed inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
            title={`Website preview for ${businessName}`}
        />
    )
}
