/**
 * POST /api/presentations/[projectId]
 *
 * Renders the project's presentation deck to PDF (automation pool →
 * /pitch/{slug}/presentation, website pool → /claim/{slug}/presentation),
 * uploads it to Supabase Storage, stamps projects.presentation_url and
 * returns { url }. Sales (or admin) only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSales } from '@/lib/auth/require-sales'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderPresentationPdf } from '@/lib/presentations/pdf'

export const maxDuration = 300

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        await requireSales()
    } catch {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 }
        )
    }

    const { projectId } = await params

    // Cast to any: pool is a new column not yet in the generated types
    // (same pattern as app/(client)/pitch/[slug]/page.tsx).
    const supabase = createAdminClient() as any
    const { data: project, error } = await supabase
        .from('projects')
        .select('id, slug, pool')
        .eq('id', projectId)
        .maybeSingle()

    if (error || !project) {
        return NextResponse.json(
            { error: 'Project not found', code: 'NOT_FOUND' },
            { status: 404 }
        )
    }

    // Deck routes resolve by slug with an id fallback — mirror that here.
    const slugOrId = project.slug || project.id
    const path =
        project.pool === 'automation'
            ? `/pitch/${slugOrId}/presentation`
            : `/claim/${slugOrId}/presentation`

    try {
        const { url } = await renderPresentationPdf(path, projectId)

        const { error: updateError } = await supabase
            .from('projects')
            .update({ presentation_url: url })
            .eq('id', projectId)
        if (updateError) {
            return NextResponse.json(
                { error: `PDF rendered but saving failed: ${updateError.message}`, code: 'UPDATE_FAILED' },
                { status: 500 }
            )
        }

        return NextResponse.json({ url })
    } catch (err) {
        return NextResponse.json(
            {
                error: err instanceof Error ? err.message : 'Presentation render failed',
                code: 'RENDER_FAILED',
            },
            { status: 500 }
        )
    }
}
