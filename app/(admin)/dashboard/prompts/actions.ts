'use server'

import { listPromptVersions, setActiveVersion, createPromptVersion, seedInitialPrompts } from '@/lib/ai/prompt-manager'
import { revalidatePath } from 'next/cache'
import { PROMPT_NAMES } from './types'
import type { PromptVersionRow } from './types'

/**
 * Get all prompt versions grouped by name.
 * Seeds initial prompts if none exist.
 */
export async function getPromptVersions(): Promise<Record<string, PromptVersionRow[]>> {
    // Ensure initial prompts are seeded
    await seedInitialPrompts()

    const result: Record<string, PromptVersionRow[]> = {}
    for (const name of PROMPT_NAMES) {
        result[name] = await listPromptVersions(name)
    }
    return result
}

/**
 * Set a specific prompt version as active.
 */
export async function setActivePromptVersion(
    name: string,
    versionId: string
): Promise<{ success: boolean; error?: string }> {
    const success = await setActiveVersion(name, versionId)
    if (success) {
        revalidatePath('/dashboard/prompts')
        return { success: true }
    }
    return { success: false, error: 'Failed to set active version' }
}

/**
 * Create a new prompt version (does not activate it).
 */
export async function createNewPromptVersion(
    name: string,
    content: string,
    changeNotes: string
): Promise<{ success: boolean; version?: number; error?: string }> {
    const result = await createPromptVersion(name, content, changeNotes)
    if (result) {
        revalidatePath('/dashboard/prompts')
        return { success: true, version: result.version }
    }
    return { success: false, error: 'Failed to create version' }
}
