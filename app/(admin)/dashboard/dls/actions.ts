"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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
}

export async function listDesignLanguages() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('design_languages')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Failed to list design languages:', error)
        return { success: false as const, error: error.message }
    }

    return { success: true as const, data: data as DesignLanguage[] }
}

export async function getDesignLanguage(id: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('design_languages')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Failed to get design language:', error)
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
        console.error('Failed to create design language:', error)
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
}) {
    const supabase = createAdminClient()

    // If setting as default, need to unset existing default for this industry
    if (params.is_default) {
        // Get the industry_tag for this DLS
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

    const { error } = await supabase
        .from('design_languages')
        .update({
            ...params,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) {
        console.error('Failed to update design language:', error)
        return { success: false as const, error: error.message }
    }

    revalidatePath('/dashboard/dls')
    revalidatePath(`/dashboard/dls/${id}`)
    return { success: true as const }
}

export async function deleteDesignLanguage(id: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('design_languages')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Failed to delete design language:', error)
        return { success: false as const, error: error.message }
    }

    revalidatePath('/dashboard/dls')
    return { success: true as const }
}

export async function toggleDefault(id: string, industryTag: string, isDefault: boolean) {
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
        console.error('Failed to toggle default:', error)
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
            console.error('Failed to get default DLS:', error)
        }
        return null
    }

    return data
}
