import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cached claim lookup — deduplicates between layout and page components
 * within the same React render pass.
 */
export const getActiveClaim = cache(async (userId: string) => {
    const admin = createAdminClient()

    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id, plan, status, client_name, client_email')
        .eq('auth_user_id', userId)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return claim
})

export const getClaimProject = cache(async (projectId: string) => {
    const admin = createAdminClient()

    const { data: project } = await admin
        .from('projects')
        .select('id, business_data, generated_code, slug, version')
        .eq('id', projectId)
        .single()

    return project
})
