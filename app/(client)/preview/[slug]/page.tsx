import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { injectCtaBar } from '@/lib/cta-injector'
import { CLAIM_WINDOW_DAYS } from '@/lib/claim-pricing'
import { trackEvent } from '@/lib/analytics/track'
import { addDays } from 'date-fns'
import type { Metadata } from 'next'

interface PreviewPageProps {
    params: Promise<{ slug: string }>
}

// Cached project lookup — deduplicates between generateMetadata and page component
const getPreviewProject = cache(async (slug: string) => {
    const supabase = createAdminClient()
    let { data: project } = await supabase
        .from('projects')
        .select('id, business_data, generated_code, claim_expires_at, screenshot_url')
        .eq('slug', slug)
        .single()

    if (!project) {
        const result = await supabase
            .from('projects')
            .select('id, business_data, generated_code, claim_expires_at, screenshot_url')
            .eq('id', slug)
            .single()
        project = result.data
    }
    return project
})

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
    const { slug } = await params
    const project = await getPreviewProject(slug)

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

    // Reuses cached query from generateMetadata — no duplicate DB call
    const project = await getPreviewProject(slug)

    if (!project || !project.generated_code) {
        notFound()
    }

    // Fire-and-forget — don't block render
    trackEvent('preview.viewed', { slug, projectId: project.id }).catch(() => {})

    const businessData = project.business_data as Record<string, unknown>
    const businessName = (businessData?.businessName as string) || 'Your Business'

    // The preview iframe is sandboxed WITHOUT allow-same-origin, so code inside it
    // cannot read window.parent.location.origin (throws) and window.location.origin
    // is "null" for a srcdoc iframe. Inject an ABSOLUTE runtime URL from the request
    // host so the preview runtime always loads; otherwise it resolves to
    // "null/preview-runtime.js" and the page renders blank.
    const h = await headers()
    const host = h.get('host') || ''
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
    const runtimeUrl = host ? `${proto}://${host}/preview-runtime.js` : '/preview-runtime.js'

    const baseHtml = constructHtmlBoilerplate(project.generated_code, { runtimeUrl })
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
            sandbox="allow-scripts allow-top-navigation-by-user-activation"
            title={`Website preview for ${businessName}`}
        />
    )
}
