"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { generateAndSaveWebsite, reviseWebsite, updateProjectWithCode } from '@/lib/ai/generator'
import { enrichBusinessData } from '@/lib/ai/enricher'

/**
 * Reset projects stuck in 'generating' status for longer than `minutesThreshold`.
 * Moves them to 'error' so they can be retried via Fix All Errors or manual regeneration.
 */
export async function resetStuckProjects(minutesThreshold = 10) {
    const supabase = createAdminClient()
    const cutoff = new Date(Date.now() - minutesThreshold * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from('projects')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('status', 'generating')
        .lt('updated_at', cutoff)
        .select('id')

    if (error) {
        console.error('Failed to reset stuck projects:', error)
        return { success: false, error: error.message, count: 0 }
    }

    const count = data?.length || 0
    console.log(`[ResetStuck] Reset ${count} projects stuck in generating for >${minutesThreshold}min`)
    revalidatePath('/dashboard')
    return { success: true, count }
}

export async function regenerateProject(projectId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'generating' as const, // Set to generating immediately
            generated_code: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        console.error('Failed to regenerate project:', error)
        return { success: false, error: error.message }
    }

    // Trigger generation in background (fire and forget pattern for server action)
    // In a real production serverless env, this might be terminated, but for "Next Dev" or VPS it's fine.
    // For Vercel, we'd need Inngest or QStash.
    generateAndSaveWebsite(projectId).then(() => {
        console.log(`Regeneration completed for ${projectId}`)
    }).catch(err => {
        console.error(`Regeneration failed for ${projectId}`, err)
    })

    revalidatePath('/dashboard')
    return { success: true }
}

export async function fixWebsiteErrors(projectId: string, rules?: string) {
    const supabase = createAdminClient()

    const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (fetchError || !project) {
        return { success: false, error: "Project not found" }
    }

    // If no code exists at all, do a full regeneration instead of trying to "fix" nothing
    if (!project.generated_code) {
        console.log(`[AutoFix] No code for ${projectId}, running full regeneration...`)
        return regenerateProject(projectId)
    }

    await supabase
        .from('projects')
        .update({ status: 'generating', generation_phase: 'Debugging with o3-mini...' })
        .eq('id', projectId)

    try {
        let currentData = project.business_data

        if (!(currentData as any).$$manifest) {
            console.log(`[AutoFix] Enriching data for project ${projectId}...`);
            try {
                const enriched = await enrichBusinessData(currentData);
                await supabase
                    .from('projects')
                    .update({ business_data: enriched as any })
                    .eq('id', projectId);
                currentData = enriched as any;
            } catch (enrichError) {
                console.error("[AutoFix] Enrichment failed", enrichError);
            }
        }

        const fixPrompt = `Fix ALL runtime errors, syntax errors, React hook violations, and build issues in this code.

STRICT RULES:
1. All React hooks (useState, useEffect, useRef, useMemo, useCallback) MUST be at the TOP LEVEL of the component — NEVER inside loops, conditions, callbacks, or nested functions.
2. All JSX must be valid — no unmatched tags, no unescaped special characters.
3. Ensure 'export default function GeneratedPage()' exists as the main component.
4. Fix any undefined variable references.
5. Preserve ALL design, colors, layout, content, and interactivity.
6. Ensure good contrast and accessibility.`

        const { code, updatedJson } = await reviseWebsite(
            fixPrompt,
            project.generated_code,
            currentData,
            rules,
            'o3-mini'
        )

        await updateProjectWithCode(projectId, code)

        if (updatedJson) {
            await supabase.from('projects').update({ business_data: updatedJson }).eq('id', projectId)
        }

        await supabase.from('projects').update({ generation_phase: null }).eq('id', projectId)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error("[AutoFix] Fix failed for", projectId, e)
        await supabase
            .from('projects')
            .update({ status: 'error', generation_phase: null })
            .eq('id', projectId)
        return { success: false, error: String(e) }
    }
}

/**
 * Autonomous Debugging Agent — fixes ALL error/broken projects in batch.
 * Uses o3-mini for cost-effective reasoning-based debugging.
 * Targets both 'error' status (generation failures) AND 'review' status with broken code.
 * Runs concurrently with a configurable concurrency limit.
 */
export async function autoFixAllErrors(dateString?: string) {
    const supabase = createAdminClient()

    // Query projects that need fixing: 'error' status, or 'review' with no generated code
    let query = supabase
        .from('projects')
        .select('id, status, generated_code')
        .in('status', ['error', 'review'])
        .order('created_at', { ascending: false })

    if (dateString) {
        const { startOfDay, endOfDay, parseISO } = await import('date-fns')
        const dayStart = startOfDay(parseISO(dateString)).toISOString()
        const dayEnd = endOfDay(parseISO(dateString)).toISOString()
        query = query.gte('created_at', dayStart).lte('created_at', dayEnd)
    }

    const { data: candidates, error } = await query

    if (error || !candidates) {
        console.error('[AutoFix Agent] Failed to fetch projects:', error)
        return { success: false, error: error?.message || 'No projects found', fixed: 0, failed: 0 }
    }

    // Filter: all 'error' projects + 'review' projects with no code (these definitely need fixing)
    // For 'review' projects WITH code, the inline auto-fix in generateAndSaveWebsite already ran,
    // so we only batch-fix those that are explicitly 'error' or have no code.
    const projectsToFix = candidates.filter(
        p => p.status === 'error' || !p.generated_code
    )

    const total = projectsToFix.length
    console.log(`[AutoFix Agent] Starting autonomous fix for ${total} projects (from ${candidates.length} candidates)...`)

    if (total === 0) {
        return { success: true, fixed: 0, failed: 0, total: 0 }
    }

    const CONCURRENCY = 3
    let fixed = 0
    let failed = 0

    for (let i = 0; i < total; i += CONCURRENCY) {
        const batch = projectsToFix.slice(i, i + CONCURRENCY)
        const results = await Promise.allSettled(
            batch.map(p => fixWebsiteErrors(p.id))
        )
        results.forEach(r => {
            if (r.status === 'fulfilled' && r.value.success) fixed++
            else failed++
        })
        console.log(`[AutoFix Agent] Progress: ${i + batch.length}/${total} (fixed: ${fixed}, failed: ${failed})`)
    }

    console.log(`[AutoFix Agent] Complete. Fixed: ${fixed}, Failed: ${failed}, Total: ${total}`)
    revalidatePath('/dashboard')
    return { success: true, fixed, failed, total }
}

export async function getErrorProjectCount(dateString?: string) {
    const supabase = createAdminClient()

    let query = supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')

    if (dateString) {
        const { startOfDay, endOfDay, parseISO } = await import('date-fns')
        const dayStart = startOfDay(parseISO(dateString)).toISOString()
        const dayEnd = endOfDay(parseISO(dateString)).toISOString()
        query = query.gte('created_at', dayStart).lte('created_at', dayEnd)
    }

    const { count, error } = await query
    if (error) return 0
    return count || 0
}

// FR-07: Batch Actions
export async function regenerateProjects(projectIds: string[]) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'generating' as const,
            generated_code: null,
            updated_at: new Date().toISOString(),
        })
        .in('id', projectIds)

    if (error) {
        console.error('Failed to regenerate projects:', error)
        return { success: false, error: error.message }
    }

    // Trigger generation for each project in background
    projectIds.forEach(id => {
        generateAndSaveWebsite(id).catch(err => {
            console.error(`Batch regeneration failed for ${id}`, err)
        })
    })

    revalidatePath('/dashboard')
    return { success: true, count: projectIds.length }
}

export async function deployProjects(projectIds: string[]) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'deployed' as const,
            updated_at: new Date().toISOString(),
        })
        .in('id', projectIds)

    if (error) {
        console.error('Failed to deploy projects:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, count: projectIds.length }
}

export async function approveProject(projectId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'approved' as const,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        console.error('Failed to approve project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function getProjectsByDate(dateString: string) {
    const { startOfDay, endOfDay, parseISO } = await import('date-fns')
    const supabase = createAdminClient()

    const dayStart = startOfDay(parseISO(dateString)).toISOString()
    const dayEnd = endOfDay(parseISO(dateString)).toISOString()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch projects by date:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getProjectById(projectId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (error) {
        console.error('Failed to fetch project by id:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getRecentProjects(limit = 50) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch recent projects:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getProjectRevisions(projectId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch project revisions:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function restoreProjectRevision(projectId: string, revisionId: string) {
    const supabase = createAdminClient()

    // Fetch the revision
    const { data: revision, error: fetchError } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('id', revisionId)
        .eq('project_id', projectId) // safety check
        .single()

    if (fetchError || !revision) {
        return { success: false, error: 'Revision not found' }
    }

    // Use the existing save function which will automatically snapshot the CURRENT state
    // before we rollback! This ensures we never lose data.
    if (!revision.generated_code) {
        return { success: false, error: 'Revision has no generated code' }
    }

    const { updateProjectWithCode } = await import('@/lib/ai/generator')
    const updateResult = await updateProjectWithCode(projectId, revision.generated_code)

    if (!updateResult.success) {
        return { success: false, error: 'Failed to restore revision' }
    }

    revalidatePath(`/editor?id=${projectId}`)
    return { success: true }
}

// --- TEMPLATE ACTIONS ---

export async function saveTemplate(payload: {
    name: string
    industryTag: string
    rating: number
    generatedCode: string
    businessData?: any
    sourceProjectId?: string
}) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('templates')
        .insert({
            name: payload.name,
            industry_tag: payload.industryTag,
            rating: payload.rating,
            generated_code: payload.generatedCode,
            business_data: payload.businessData || null,
            source_project_id: payload.sourceProjectId || null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Failed to save template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/templates')
    return { success: true, id: data.id }
}

export async function getTemplates(filters?: {
    industryTag?: string
    minRating?: number
}) {
    const supabase = createAdminClient()

    let query = supabase
        .from('templates')
        .select('id, name, industry_tag, rating, created_at, generated_code')
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })

    if (filters?.industryTag) {
        query = query.eq('industry_tag', filters.industryTag)
    }
    if (filters?.minRating) {
        query = query.gte('rating', filters.minRating)
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch templates:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getTemplateById(templateId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (error) {
        console.error('Failed to fetch template:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function deleteTemplate(templateId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

    if (error) {
        console.error('Failed to delete template:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/templates')
    return { success: true }
}

/**
 * Returns a map of { "YYYY-MM-DD": projectCount } for every day in the
 * given month that has at least one project. Used by the CalendarNav to
 * render activity dots without a full page reload when navigating months.
 */
export async function getMonthActivityCounts(
    year: number,
    month: number // 1-indexed (1 = January)
): Promise<Record<string, number>> {
    const supabase = createAdminClient()

    const { startOfMonth, endOfMonth } = await import('date-fns')
    const monthDate = new Date(year, month - 1, 1)
    const from = startOfMonth(monthDate).toISOString()
    const to = endOfMonth(monthDate).toISOString()

    const { data, error } = await supabase
        .from('projects')
        .select('created_at')
        .gte('created_at', from)
        .lte('created_at', to)

    if (error || !data) {
        console.error('[CalendarActivity] Failed to fetch month counts:', error?.message)
        return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data) {
        // Truncate ISO timestamp to just the date portion
        const dateKey = row.created_at.slice(0, 10)
        counts[dateKey] = (counts[dateKey] ?? 0) + 1
    }
    return counts
}

export async function searchProjects(query: string) {
    const supabase = createAdminClient()

    // Sanitize query: strip characters that could break PostgREST filter syntax
    const sanitized = query.replace(/[%_\\(),.'":;]/g, '').trim()
    if (!sanitized) {
        return { success: true, data: [] }
    }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`business_data->>businessName.ilike.%${sanitized}%,business_data->brandIdentity->core->>brandName.ilike.%${sanitized}%,business_data->>description.ilike.%${sanitized}%`)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Failed to search projects:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}
