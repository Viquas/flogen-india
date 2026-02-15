"use server"

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function regenerateProject(projectId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'queued' as const,
            generated_code: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

    if (error) {
        console.error('Failed to regenerate project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

// FR-07: Batch Actions
export async function regenerateProjects(projectIds: string[]) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('projects')
        .update({
            status: 'queued' as const,
            generated_code: null,
            updated_at: new Date().toISOString(),
        })
        .in('id', projectIds)

    if (error) {
        console.error('Failed to regenerate projects:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
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

    revalidatePath('/')
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
