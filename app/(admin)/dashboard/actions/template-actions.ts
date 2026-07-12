"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { cleanTemplateCode } from '@/lib/ai/generator'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createVersion, softDelete, getVersionHistory, restoreVersion, type VersionConfig } from '@/lib/versioning'
import { createLogger } from '@/lib/logger'
import type { Json } from '@/types/database'

const log = createLogger('template-actions')

const TEMPLATE_VERSION_CONFIG: VersionConfig = {
    tableName: 'templates',
    contentField: 'generated_code',
}

export async function saveTemplate(payload: {
    id?: string // When provided, creates a new version of the existing template
    name: string
    industryTag: string
    rating: number
    generatedCode: string
    businessData?: Json | null
    sourceProjectId?: string
    changeNotes?: string
}) {
    await requireAdmin()
    const supabase = createAdminClient()

    // If an id is provided, create a new version instead of a plain insert
    if (payload.id) {
        const result = await createVersion(
            TEMPLATE_VERSION_CONFIG,
            payload.id,
            {
                name: payload.name,
                industry_tag: payload.industryTag,
                rating: payload.rating,
                generated_code: payload.generatedCode,
                business_data: payload.businessData || null,
                source_project_id: payload.sourceProjectId || null,
            },
            payload.changeNotes,
        )

        if (!result.success) {
            log.error('Failed to create template version', { id: payload.id, error: result.error })
            return { success: false, error: result.error }
        }

        revalidatePath('/dashboard/templates')
        return { success: true, id: (result.data as Record<string, unknown>).id as string, versioned: result.versioned }
    }

    // New template — plain insert
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
        log.error('Failed to save template', { error: error.message })
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/templates')
    return { success: true, id: data.id }
}

export async function saveCleanedTemplate(payload: {
    name: string
    industryTag: string
    rating: number
    generatedCode: string
    businessData?: Json | null
    sourceProjectId?: string
}) {
    await requireAdmin()
    try {
        const cleanedCode = await cleanTemplateCode(payload.generatedCode, payload.industryTag)
        return await saveTemplate({
            ...payload,
            generatedCode: cleanedCode,
        })
    } catch (e) {
        log.error('Failed to clean template code', { error: e instanceof Error ? e.message : String(e) })
        return { success: false, error: String(e) }
    }
}

export async function getTemplates(filters?: {
    industryTag?: string
    minRating?: number
}) {
    const supabase = createAdminClient()

    let query = supabase
        .from('templates')
        .select('id, name, industry_tag, rating, created_at, generated_code, version, is_active')
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
        // If the error is about missing columns (pre-migration), retry without them
        if (error.message.includes('version') || error.message.includes('is_active')) {
            log.debug('Versioning columns not available, falling back', { error: error.message })
            return getTemplatesFallback(filters)
        }
        log.error('Failed to fetch templates', { error: error.message })
        return { success: false, error: error.message }
    }

    // Only return active templates (is_active defaults to true in the schema)
    const filtered = data.filter((t) => t.is_active !== false)

    return { success: true, data: filtered }
}

/** Pre-migration fallback that omits versioning columns from the select */
async function getTemplatesFallback(filters?: {
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
        log.error('Failed to fetch templates (fallback)', { error: error.message })
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
        log.error('Failed to fetch template', { templateId, error: error.message })
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function deleteTemplate(templateId: string) {
    await requireAdmin()
    const result = await softDelete(TEMPLATE_VERSION_CONFIG, templateId)

    if (!result.success) {
        log.error('Failed to delete template', { templateId, error: result.error })
        return { success: false, error: result.error }
    }

    revalidatePath('/dashboard/templates')
    return { success: true, softDeleted: result.softDeleted }
}

/**
 * Get the full version history for a template.
 * Pass the original (root) template id.
 */
export async function getTemplateVersionHistory(templateId: string) {
    const result = await getVersionHistory(TEMPLATE_VERSION_CONFIG, templateId)

    if (!result.success) {
        log.error('Failed to get template version history', { templateId, error: result.error })
        return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
}

/**
 * Restore a specific template version by making it the active one.
 */
export async function restoreTemplateVersion(versionId: string) {
    await requireAdmin()
    const result = await restoreVersion(TEMPLATE_VERSION_CONFIG, versionId)

    if (!result.success) {
        log.error('Failed to restore template version', { versionId, error: result.error })
        return { success: false, error: result.error }
    }

    revalidatePath('/dashboard/templates')
    return { success: true }
}
