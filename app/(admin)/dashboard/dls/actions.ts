"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createVersion, softDelete, getVersionHistory, restoreVersion, type VersionConfig } from '@/lib/versioning'
import { createLogger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/require-admin'

const log = createLogger('dls-actions')

const DLS_VERSION_CONFIG: VersionConfig = {
    tableName: 'design_languages',
    contentField: 'content',
}

export type DesignLanguage = {
    id: string
    name: string
    industry_tag: string | null
    content: string
    source: 'manual' | 'stitch' | 'auto-generated' | 'url-extracted'
    stitch_project_id: string | null
    is_default: boolean
    created_at: string
    updated_at: string
    version?: number
    parent_id?: string | null
    change_notes?: string | null
    is_active?: boolean
}

export async function listDesignLanguages() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('design_languages')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) {
        log.error('Failed to list design languages', { error: error.message })
        return { success: false as const, error: error.message }
    }

    // Only return active DLS entries (is_active defaults to true in the schema)
    const filtered = data.filter((d) => d.is_active !== false)

    return { success: true as const, data: filtered as DesignLanguage[] }
}

export async function getDesignLanguage(id: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('design_languages')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        log.error('Failed to get design language', { id, error: error.message })
        return { success: false as const, error: error.message }
    }

    return { success: true as const, data: data as DesignLanguage }
}

export async function createDesignLanguage(params: {
    name: string
    industry_tag?: string
    content: string
    source?: 'manual' | 'stitch' | 'auto-generated' | 'url-extracted'
    stitch_project_id?: string
    is_default?: boolean
}) {
    await requireAdmin()
    const supabase = createAdminClient()

    // If setting as default, unset any existing default for this industry
    if (params.is_default && params.industry_tag) {
        await supabase
            .from('design_languages')
            .update({ is_default: false })
            .eq('industry_tag', params.industry_tag)
            .eq('is_default', true)
    }

    const { data, error } = await supabase
        .from('design_languages')
        .insert({
            name: params.name,
            industry_tag: params.industry_tag || null,
            content: params.content,
            source: params.source || 'manual',
            stitch_project_id: params.stitch_project_id || null,
            is_default: params.is_default || false,
        })
        .select()
        .single()

    if (error) {
        log.error('Failed to create design language', { error: error.message })
        return { success: false as const, error: error.message }
    }

    revalidatePath('/dashboard/dls')
    return { success: true as const, data: data as DesignLanguage }
}

export async function updateDesignLanguage(id: string, params: {
    name?: string
    industry_tag?: string
    content?: string
    is_default?: boolean
    changeNotes?: string
}) {
    await requireAdmin()
    const supabase = createAdminClient()

    // If setting as default, need to unset existing default for this industry
    if (params.is_default) {
        const industryTag = params.industry_tag
        if (industryTag) {
            await supabase
                .from('design_languages')
                .update({ is_default: false })
                .eq('industry_tag', industryTag)
                .eq('is_default', true)
                .neq('id', id)
        }
    }

    // Extract changeNotes before passing updates to versioning
    const { changeNotes, ...updates } = params

    // Use versioning to create a new version instead of in-place update
    const result = await createVersion<DesignLanguage>(
        DLS_VERSION_CONFIG,
        id,
        updates,
        changeNotes,
    )

    if (!result.success) {
        log.error('Failed to update design language', { id, error: result.error })
        return { success: false as const, error: result.error }
    }

    revalidatePath('/dashboard/dls')
    revalidatePath(`/dashboard/dls/${id}`)

    // If a new versioned row was created, also revalidate that path
    if (result.versioned && result.data?.id) {
        revalidatePath(`/dashboard/dls/${result.data.id}`)
    }

    return { success: true as const }
}

export async function deleteDesignLanguage(id: string) {
    await requireAdmin()
    const result = await softDelete(DLS_VERSION_CONFIG, id)

    if (!result.success) {
        log.error('Failed to delete design language', { id, error: result.error })
        return { success: false as const, error: result.error }
    }

    revalidatePath('/dashboard/dls')
    return { success: true as const }
}

export async function toggleDefault(id: string, industryTag: string, isDefault: boolean) {
    await requireAdmin()
    const supabase = createAdminClient()

    if (isDefault) {
        // Unset any existing default for this industry
        await supabase
            .from('design_languages')
            .update({ is_default: false })
            .eq('industry_tag', industryTag)
            .eq('is_default', true)
    }

    const { error } = await supabase
        .from('design_languages')
        .update({ is_default: isDefault, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        log.error('Failed to toggle default', { id, error: error.message })
        return { success: false as const, error: error.message }
    }

    revalidatePath('/dashboard/dls')
    return { success: true as const }
}

/**
 * Find the default DLS for an industry. Used by the generation pipeline.
 */
export async function getDefaultDLSForIndustry(industryTag: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('design_languages')
        .select('id, content')
        .eq('industry_tag', industryTag)
        .eq('is_default', true)
        .single()

    if (error) {
        // PGRST116 = not found, which is expected
        if (error.code !== 'PGRST116') {
            log.error('Failed to get default DLS', { industryTag, error: error.message })
        }
        return null
    }

    return data
}

/**
 * Get the full version history for a design language.
 * Pass the original (root) DLS id.
 */
export async function getDLSVersionHistory(dlsId: string) {
    const result = await getVersionHistory<DesignLanguage>(DLS_VERSION_CONFIG, dlsId)

    if (!result.success) {
        log.error('Failed to get DLS version history', { dlsId, error: result.error })
        return { success: false as const, error: result.error }
    }

    return { success: true as const, data: result.data }
}

/**
 * Restore a specific DLS version by making it the active one.
 */
export async function restoreDLSVersion(versionId: string) {
    await requireAdmin()
    const result = await restoreVersion(DLS_VERSION_CONFIG, versionId)

    if (!result.success) {
        log.error('Failed to restore DLS version', { versionId, error: result.error })
        return { success: false as const, error: result.error }
    }

    revalidatePath('/dashboard/dls')
    return { success: true as const }
}
