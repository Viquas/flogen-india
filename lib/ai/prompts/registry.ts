/**
 * Prompt Registry — manages versioned prompt sections.
 * Prompts are decomposed into composable sections that can be versioned independently.
 */

import { SYSTEM_PROMPT } from './system'
import { REVISION_SYSTEM_PROMPT } from './revision'

export interface PromptVersion {
  id: string
  name: string
  content: string
  version: number
  isActive: boolean
  createdAt: string
}

export type PromptSection =
  | 'core-architecture'
  | 'icons'
  | 'ui-components'
  | 'design-system'
  | 'typography'
  | 'colors'
  | 'hero'
  | 'images'
  | 'sections-checklist'
  | 'forbidden-patterns'
  | 'output-format'

// In-memory cache for prompt resolution
let cachedPrompt: { content: string; resolvedAt: number } | null = null
const CACHE_TTL = 60_000 // 1 minute

/**
 * Get the active system prompt.
 * Falls back to the file-based constant if DB is unavailable.
 */
export async function getActiveSystemPrompt(): Promise<string> {
  // Check cache
  if (cachedPrompt && Date.now() - cachedPrompt.resolvedAt < CACHE_TTL) {
    return cachedPrompt.content
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('prompt_versions')
      .select('content')
      .eq('name', 'system')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (data?.content) {
      cachedPrompt = { content: data.content, resolvedAt: Date.now() }
      return data.content
    }
  } catch {
    // DB unavailable — fall through to file-based prompt
  }

  // Fallback to file-based prompt
  cachedPrompt = { content: SYSTEM_PROMPT, resolvedAt: Date.now() }
  return SYSTEM_PROMPT
}

/**
 * Get the active revision prompt.
 */
export async function getActiveRevisionPrompt(): Promise<string> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('prompt_versions')
      .select('content')
      .eq('name', 'revision')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (data?.content) return data.content
  } catch {
    // Fall through
  }

  return REVISION_SYSTEM_PROMPT
}

/**
 * Save a new prompt version (does NOT activate it).
 */
export async function savePromptVersion(
  name: string,
  content: string,
  version: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('prompt_versions')
      .insert({
        name,
        content,
        version,
        is_active: false,
      })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Activate a specific prompt version (and deactivate others with the same name).
 */
export async function activatePromptVersion(
  name: string,
  version: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Deactivate all versions of this prompt
    await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('name', name)

    // Activate the specified version
    const { error } = await supabase
      .from('prompt_versions')
      .update({ is_active: true })
      .eq('name', name)
      .eq('version', version)

    if (error) return { success: false, error: error.message }

    // Clear cache
    cachedPrompt = null

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
