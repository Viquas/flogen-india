"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getProjectRevisions(projectId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('project_revisions')
        .select('id, project_id, version, generated_code, created_at, status')
        .eq('project_id', projectId)
        .order('version', { ascending: false })

    if (error) {
        console.error('Failed to fetch revisions:', error)
        return { success: false as const, error: error.message, data: null }
    }

    return { success: true as const, data: data || [] }
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
