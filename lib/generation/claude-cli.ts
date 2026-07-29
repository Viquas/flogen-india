/**
 * v2.0 — Agentic Claude Generation via Subscription CLI
 *
 * For high-value leads, the local worker shells out to the user's logged-in
 * `claude` CLI (their subscription) to run one strong Claude Sonnet call that
 * produces the full award-grade React site, instead of the Gemini
 * `generateAndSaveWebsite` pipeline. Templates stay for the cron's volume path.
 *
 * COMPLIANCE: the Claude subscription is licensed for interactive/personal
 * use. This path is fine for the user's own low-volume high-value leads; a
 * commercial production backend at volume should switch to the Anthropic API
 * (a localized swap of `runClaudeCLI` for an `@anthropic-ai/sdk` call).
 */
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { CODE_GENERATOR_PROMPT } from '@/lib/ai/prompts/code-generator'
import { selectKnowledge, type SelectedKnowledge } from '@/lib/ai/design-knowledge'
import { rankPhotos } from '@/lib/ai/photo-selection'
import { validateAndAutoFix } from '@/lib/ai/validation'
import { updateProjectWithCode } from '@/lib/ai/project-persistence'
import { createAdminClient } from '@/lib/supabase/admin'

/** Business data shape we generate from — a discovered lead's business_data. Not all fields are present. */
export interface ClaudeBusinessData {
    businessName: string
    industry?: string
    description?: string
    formattedAddress?: string
    contactInfo?: { phone?: string; address?: string; email?: string }
    internationalPhoneNumber?: string
    rating?: number
    userRatingCount?: number
    photos?: Array<{ name: string; widthPx: number; heightPx: number }>
    reviews?: Array<{ text?: string; author?: string }>
    [key: string]: unknown
}

/** Reads design-knowledge/craft/core.md at runtime. Empty string on failure — never blocks generation. */
function readCraftCore(): string {
    try {
        return fs.readFileSync(path.join(process.cwd(), 'design-knowledge/craft/core.md'), 'utf8')
    } catch {
        return ''
    }
}

/**
 * Builds ONE self-contained prompt for the `claude -p` CLI: architecture +
 * contrast rules, craft-core non-negotiables, niche design-knowledge, the
 * real business data (including real Places photo URLs), and a strict
 * closing output instruction. Pure — no I/O beyond the craft-core file read.
 */
export function buildClaudePrompt(
    businessData: ClaudeBusinessData,
    knowledge?: { archetypes?: SelectedKnowledge['archetypes']; dlsBlock?: string; exemplarBlock?: string },
): string {
    const craftCore = readCraftCore()

    const industry = businessData.industry || 'General Business'
    const phone = businessData.contactInfo?.phone || businessData.internationalPhoneNumber || ''
    const address = businessData.formattedAddress || businessData.contactInfo?.address || ''
    const rating = businessData.rating != null ? `${businessData.rating}/5` : ''
    const reviewCount = businessData.userRatingCount != null ? `${businessData.userRatingCount} reviews` : ''

    const reviewLines = (businessData.reviews || [])
        .filter(r => r && r.text)
        .slice(0, 5)
        .map(r => `- "${r.text}"${r.author ? ` — ${r.author}` : ''}`)
        .join('\n')

    const ranked = businessData.photos && businessData.photos.length > 0 ? rankPhotos(businessData.photos) : []
    const photosBlock = ranked.length > 0
        ? `\n## REAL BUSINESS PHOTOS (actual photos of THIS business — these beat any stock image)\nUse photo #1 for the hero. Spread at least 2-3 of the remaining photos across the page (about section, gallery/collage, service imagery) so the site unmistakably shows THEIR business, not stock.\n${ranked.slice(0, 8).map((p, i) => `${i + 1}. ${p.url} (${p.widthPx}x${p.heightPx})`).join('\n')}`
        : ''

    const businessBlock = `## BUSINESS DATA (use EXACTLY — do not invent facts)
Business Name: ${businessData.businessName}
Industry/Category: ${industry}
${businessData.description ? `Description: ${businessData.description}` : ''}
${address ? `Address: ${address}` : ''}
${phone ? `Phone: ${phone}` : ''}
${rating ? `Rating: ${rating}${reviewCount ? ` (${reviewCount})` : ''}` : ''}
${reviewLines ? `Real customer reviews (use as testimonials — exact quotes, don't paraphrase):\n${reviewLines}` : ''}
${photosBlock}

Market: Australia. This site must read as award-grade, custom-built work — it is used as proof-of-work in cold outreach to sell website redesign services to the business owner. It must be good enough to make them want what you built.`

    const knowledgeBlock = knowledge?.dlsBlock || knowledge?.exemplarBlock
        ? `\n\n## DESIGN KNOWLEDGE\n${knowledge?.dlsBlock || ''}\n${knowledge?.exemplarBlock || ''}`
        : ''

    return [
        CODE_GENERATOR_PROMPT,
        craftCore ? `\n\n## CRAFT CORE — NON-NEGOTIABLES\n${craftCore}` : '',
        knowledgeBlock,
        `\n\n${businessBlock}`,
        `\n\nOutput ONLY the single-file React component \`export default function GeneratedPage()\`. No prose, no markdown fences.`,
    ].join('')
}

/** Strips ```tsx / ```jsx / ```typescript / ```javascript / ``` code fences if present. Leaves clean code untouched. */
export function stripCodeFences(s: string): string {
    let code = s.trim()
    if (code.startsWith('```')) {
        code = code.replace(/^```(?:tsx|typescript|jsx|javascript)?\n?/, '')
        code = code.replace(/\n?```$/, '')
    }
    return code.trim()
}

export interface RunClaudeCLIOptions {
    model?: string
    timeoutMs?: number
}

/**
 * Shells out to the user's logged-in `claude` CLI (subscription auth, no API
 * key) in non-interactive print mode, writes `prompt` to stdin, and resolves
 * with stdout. Rejects with an actionable message on missing binary,
 * non-zero exit, or timeout.
 */
export function runClaudeCLI(prompt: string, opts: RunClaudeCLIOptions = {}): Promise<string> {
    const model = opts.model ?? 'sonnet'
    const timeoutMs = opts.timeoutMs ?? 300_000

    return new Promise((resolve, reject) => {
        const child = spawn('claude', [
            '-p',
            '--model', model,
            '--output-format', 'text',
            '--disallowed-tools', 'Bash', 'Edit', 'Write', 'Read', 'WebFetch', 'WebSearch',
        ])

        let stdout = ''
        let stderr = ''
        let settled = false

        const timer = setTimeout(() => {
            if (settled) return
            settled = true
            child.kill()
            reject(new Error(`claude CLI timed out after ${timeoutMs}ms`))
        }, timeoutMs)

        child.stdout?.setEncoding('utf8')
        child.stdout?.on('data', (chunk: string) => {
            stdout += chunk
        })
        child.stderr?.setEncoding('utf8')
        child.stderr?.on('data', (chunk: string) => {
            stderr += chunk
        })

        child.on('error', (err: NodeJS.ErrnoException) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            if (err.code === 'ENOENT') {
                reject(new Error('claude CLI not found — install Claude Code and log in, or run the worker with --gemini'))
            } else {
                reject(new Error(`claude CLI failed to start: ${err.message}`))
            }
        })

        child.on('close', (code: number | null) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            if (code === 0) {
                resolve(stdout)
            } else {
                reject(new Error(`claude CLI exited with code ${code}: ${stderr.trim() || '(no stderr)'}`))
            }
        })

        child.stdin?.write(prompt)
        child.stdin?.end()
    })
}

/**
 * Full v2 generation pipeline for a single project: load business data,
 * select design knowledge, build the prompt, run it through the Claude CLI,
 * strip fences, validate/auto-fix, and persist. Mirrors the save/status
 * writes of generateAndSaveWebsite's template path (lib/ai/generator.ts).
 */
export async function generateSiteViaClaude(
    projectId: string,
): Promise<{ success: boolean; error?: string; code?: string }> {
    const supabase = createAdminClient()

    try {
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('business_data')
            .eq('id', projectId)
            .single()

        if (fetchError || !project) {
            return { success: false, error: 'Project not found' }
        }

        const businessData = project.business_data as unknown as ClaudeBusinessData

        let knowledge: SelectedKnowledge | undefined
        try {
            knowledge = selectKnowledge(String(businessData?.industry || 'business'), projectId)
        } catch (e) {
            knowledge = undefined
        }

        const prompt = buildClaudePrompt(businessData, knowledge)
        const rawOutput = await runClaudeCLI(prompt)
        const code = stripCodeFences(rawOutput)

        const { code: validatedCode, fixFailed } = await validateAndAutoFix(code, businessData, projectId, supabase)

        if (fixFailed) {
            await supabase
                .from('projects')
                .update({ generated_code: validatedCode, status: 'error' as const, updated_at: new Date().toISOString() })
                .eq('id', projectId)
            return { success: false, error: 'Auto-fix failed after 2 attempts' }
        }

        const updateResult = await updateProjectWithCode(projectId, validatedCode)
        if (!updateResult.success) {
            await supabase.from('projects').update({ status: 'error' as const }).eq('id', projectId)
            return { success: false, error: updateResult.error }
        }

        return { success: true, code: validatedCode }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown generation error'
        await supabase.from('projects').update({ status: 'error' as const }).eq('id', projectId)
        return { success: false, error: message }
    }
}
