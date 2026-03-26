"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { reviseWebsite, updateProjectWithCode } from '@/lib/ai/generator'
import { enrichBusinessData } from '@/lib/ai/enricher'
import { regenerateProject } from './generation-actions'

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
        .update({ status: 'generating' })
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
            'gemini-3-flash-preview'
        )

        await updateProjectWithCode(projectId, code)

        if (updatedJson) {
            await supabase.from('projects').update({ business_data: updatedJson }).eq('id', projectId)
        }

        // generation_phase column removed
        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error("[AutoFix] Fix failed for", projectId, e)
        await supabase
            .from('projects')
            .update({ status: 'error' })
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
