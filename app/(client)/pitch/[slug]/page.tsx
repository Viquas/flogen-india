import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPitchContent } from '@/lib/pitch-content'
import type { AutomationPlan } from '@/lib/automation-plan/schema'
import { trackPitchEvent, getPitchViewCount } from '@/lib/pitch-tracking'
import { notifyProjectRep } from '@/lib/sales/notifications'
import { PitchClient } from './pitch-client'

interface PitchPageProps {
    params: Promise<{ slug: string }>
}

// Cached lookup — dedupes between generateMetadata and the page render.
// Cast to any: pitch_angle is a new column not yet in the generated types
// (same pattern as lib/sales/get-leads.ts).
const getProjectBySlug = cache(async (slug: string) => {
    const supabase = createAdminClient() as any
    let { data: project } = await supabase
        .from('projects')
        .select('id, business_data, slug, pitch_angle, screenshot_url, status, automation_plan')
        .eq('slug', slug)
        .maybeSingle()

    if (!project) {
        const result = await supabase
            .from('projects')
            .select('id, business_data, slug, pitch_angle, screenshot_url, status, automation_plan')
            .eq('id', slug)
            .maybeSingle()
        project = result.data
    }
    return project
})

export async function generateMetadata({ params }: PitchPageProps): Promise<Metadata> {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) return { title: 'A better way to run your business' }

    const content = buildPitchContent(project as never)
    return {
        title: `${content.businessName} — automate the busywork`,
        description: content.subhead,
        openGraph: {
            title: content.headline,
            description: content.subhead,
            images: project.screenshot_url
                ? [{ url: project.screenshot_url, width: 1280, height: 800, alt: content.businessName }]
                : [],
            type: 'website',
        },
    }
}

export default async function PitchPage({ params }: PitchPageProps) {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) notFound()

    const content = buildPitchContent(project as never)

    // First pitch view is a strong intent signal — notify the rep once.
    getPitchViewCount(slug)
        .then((count) => {
            if (count === 0) notifyProjectRep(project.id, 'pitch_viewed').catch(() => {})
        })
        .catch(() => {})
    trackPitchEvent({ slug, type: 'pitch_view' }).catch(() => {})

    return (
        <PitchClient
            projectId={project.id}
            slug={slug}
            content={content}
            screenshotUrl={project.screenshot_url}
            plan={(project.automation_plan as AutomationPlan | null) ?? null}
        />
    )
}
