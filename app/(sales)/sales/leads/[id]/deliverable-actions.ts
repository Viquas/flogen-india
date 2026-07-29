'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireSales } from '@/lib/auth/require-sales'
import { createAdminClient } from '@/lib/supabase/admin'
import { generationQueue } from '@/lib/queue'

const ProjectIdSchema = z.string().uuid()

/**
 * Queue website generation for a promoted sales lead — on the SAME project row
 * (no fork), so pool/assigned_to/lead_list_id and the CRM history stay intact.
 * The queue moves projects.status lead → queued → generating → review, all of
 * which remain visible in the sales workspace.
 */
export async function generateWebsiteForLead(projectId: string): Promise<{ ok: boolean; error?: string }> {
    await requireSales()
    const id = ProjectIdSchema.parse(projectId)

    const admin = createAdminClient() as any
    const { data: project } = await admin
        .from('projects')
        .select('id, status, pool')
        .eq('id', id)
        .maybeSingle()

    if (!project) return { ok: false, error: 'Lead not found' }
    if (project.pool === 'automation') {
        return { ok: false, error: 'Automation leads get a plan, not a website demo' }
    }
    if (!['lead', 'error'].includes(project.status as string)) {
        return { ok: false, error: `Already ${project.status}` }
    }

    await generationQueue.add(id, undefined, undefined, 1)
    revalidatePath(`/sales/leads/${id}`)
    return { ok: true }
}

/**
 * Queue automation-plan generation for an automation-pool lead. Drives
 * projects.plan_status only — the lead's CRM status is untouched.
 */
export async function generatePlanForLead(projectId: string): Promise<{ ok: boolean; error?: string }> {
    await requireSales()
    const id = ProjectIdSchema.parse(projectId)

    const admin = createAdminClient() as any
    const { data: project } = await admin
        .from('projects')
        .select('id, pool, plan_status')
        .eq('id', id)
        .maybeSingle()

    if (!project) return { ok: false, error: 'Lead not found' }
    if (project.pool !== 'automation') {
        return { ok: false, error: 'Plans are for automation-pool leads' }
    }
    if (['queued', 'generating'].includes((project.plan_status as string) || '')) {
        return { ok: false, error: 'Plan is already generating' }
    }

    try {
        await generationQueue.addPlanJob(id)
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Failed to queue plan' }
    }
    revalidatePath(`/sales/leads/${id}`)
    return { ok: true }
}

/**
 * Render + upload the presentation PDF for a lead (either stream) and store
 * its public URL on the project.
 */
export async function exportPresentationPdf(projectId: string): Promise<{ ok: boolean; url?: string; error?: string }> {
    await requireSales()
    const id = ProjectIdSchema.parse(projectId)

    const admin = createAdminClient() as any
    const { data: project } = await admin
        .from('projects')
        .select('id, slug, pool')
        .eq('id', id)
        .maybeSingle()

    if (!project?.slug) return { ok: false, error: 'Lead has no shareable slug yet' }

    const path =
        project.pool === 'automation'
            ? `/pitch/${project.slug}/presentation`
            : `/claim/${project.slug}/presentation`

    try {
        const { renderPresentationPdf } = await import('@/lib/presentations/pdf')
        const { url } = await renderPresentationPdf(path, id)
        await admin.from('projects').update({ presentation_url: url }).eq('id', id)
        revalidatePath(`/sales/leads/${id}`)
        return { ok: true, url }
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'PDF export failed' }
    }
}
