// Prompt names that the system manages
export const PROMPT_NAMES = ['system', 'revision'] as const

export interface PromptVersionRow {
    id: string
    name: string
    version: number
    is_active: boolean
    change_notes: string | null
    created_at: string
}
