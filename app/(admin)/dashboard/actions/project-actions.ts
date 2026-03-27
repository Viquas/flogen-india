"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
// Admin auth guard removed — single-operator dashboard, no login flow

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

/**
 * Save code changes from Edit Mode (inline text/image edits).
 * Uses updateProjectWithCode which snapshots the previous version as a revision.
 */
export async function saveEditModeChanges(projectId: string, newCode: string) {
    const { updateProjectWithCode } = await import('@/lib/ai/generator')
    const result = await updateProjectWithCode(projectId, newCode)

    if (!result.success) {
        console.error('[EditMode] Failed to save changes:', result.error)
        return { success: false, error: result.error || 'Failed to save' }
    }

    revalidatePath(`/editor?id=${projectId}`)
    return { success: true }
}
