import { createAdminClient } from '@/lib/supabase/admin'
import { SYSTEM_PROMPT } from './prompts/system'
import { REVISION_SYSTEM_PROMPT } from './prompts/revision'

interface CachedPrompt {
  content: string
  versionId: string
  fetchedAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const promptCache = new Map<string, CachedPrompt>()

// Fallback prompts when DB is unavailable
const FALLBACK_PROMPTS: Record<string, string> = {
  system: SYSTEM_PROMPT,
  revision: REVISION_SYSTEM_PROMPT,
}

/**
 * Load the active prompt version from the database.
 * Uses in-memory cache with 5-minute TTL.
 * Falls back to file-based constants if DB is unavailable.
 */
export async function getActivePrompt(name: string = 'system'): Promise<{ content: string; versionId: string }> {
  const cached = promptCache.get(name)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { content: cached.content, versionId: cached.versionId }
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('id, content')
      .eq('name', name)
      .eq('is_active', true)
      .single()

    if (data && !error) {
      promptCache.set(name, { content: data.content, versionId: data.id, fetchedAt: Date.now() })
      return { content: data.content, versionId: data.id }
    }
  } catch {
    // DB unavailable -- fall through to fallback
  }

  const fallback = FALLBACK_PROMPTS[name] || FALLBACK_PROMPTS['system']
  return { content: fallback, versionId: `v1-file-${name}` }
}

/**
 * Create a new prompt version in the database.
 * Does NOT set it as active -- call setActiveVersion separately.
 */
export async function createPromptVersion(
  name: string,
  content: string,
  changeNotes?: string
): Promise<{ id: string; version: number } | null> {
  try {
    const supabase = createAdminClient()

    // Get next version number
    const { data: latest } = await supabase
      .from('prompt_versions')
      .select('version')
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (latest?.version ?? 0) + 1

    const { data, error } = await supabase
      .from('prompt_versions')
      .insert({
        name,
        version: nextVersion,
        content,
        is_active: false,
        change_notes: changeNotes ?? null,
      })
      .select('id, version')
      .single()

    if (error) {
      console.error('[PromptManager] Failed to create version:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[PromptManager] Unexpected error creating version:', err)
    return null
  }
}

/**
 * Set a specific prompt version as the active one.
 * Deactivates all other versions of the same name first.
 */
export async function setActiveVersion(name: string, versionId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // Deactivate all versions of this name
    await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('name', name)

    // Activate the specified version
    const { error } = await supabase
      .from('prompt_versions')
      .update({ is_active: true })
      .eq('id', versionId)

    if (error) {
      console.error('[PromptManager] Failed to set active version:', error.message)
      return false
    }

    // Invalidate cache for this prompt name
    promptCache.delete(name)

    return true
  } catch (err) {
    console.error('[PromptManager] Unexpected error setting active version:', err)
    return false
  }
}

/**
 * List all versions of a named prompt, ordered by version descending.
 */
export async function listPromptVersions(name: string): Promise<Array<{
  id: string
  name: string
  version: number
  is_active: boolean
  change_notes: string | null
  created_at: string
}>> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('id, name, version, is_active, change_notes, created_at')
      .eq('name', name)
      .order('version', { ascending: false })

    if (error) {
      console.error('[PromptManager] Failed to list versions:', error.message)
      return []
    }

    return data ?? []
  } catch {
    return []
  }
}

/**
 * Seed initial prompt versions from file-based constants.
 * Safe to call multiple times -- skips if version 1 already exists.
 */
export async function seedInitialPrompts(): Promise<void> {
  try {
    const supabase = createAdminClient()

    for (const [name, content] of Object.entries(FALLBACK_PROMPTS)) {
      // Check if version 1 already exists
      const { data: existing } = await supabase
        .from('prompt_versions')
        .select('id')
        .eq('name', name)
        .eq('version', 1)
        .single()

      if (existing) continue

      // Insert version 1 as active
      await supabase.from('prompt_versions').insert({
        name,
        version: 1,
        content,
        is_active: true,
        change_notes: `Initial version extracted from prompts/${name}.ts`,
      })
    }
  } catch (err) {
    console.error('[PromptManager] Failed to seed initial prompts:', err)
  }
}
