import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { DESIGN_ARCHITECT_PROMPT } from './prompts/design-architect'
import { recordCost, buildCostRecord, getModelId, type CostRecord } from './cost-tracker'
import { GEMINI_FLASH } from './model-ids'
import { pickDesignVariation, type DesignAxis } from './design-variation'

/**
 * Design Architect — Agent 1 of the multi-agent generation pipeline.
 *
 * Takes enriched business data and produces a Design Language Specification (DLS)
 * document containing exact Tailwind classes and hex values for every visual decision.
 *
 * Uses Gemini Flash (same as enricher) for speed and cost efficiency.
 */

// Model selection — mirrors enricher.ts logic (prefer Gemini Flash for structured output)
const openrouter = createOpenAI({
  name: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

function getDLSModel() {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google(GEMINI_FLASH)
  }
  if (process.env.OPENAI_API_KEY) {
    return openai('gpt-4o')
  }
  if (process.env.OPENROUTER_API_KEY) {
    return openrouter('openai/gpt-4o')
  }
  return openai('gpt-4o')
}

export interface DLSResult {
  dls: string
  cost: CostRecord
}

/**
 * Generate a Design Language Specification from enriched business data.
 *
 * @param businessData - Enriched business data with brandIdentity, vibe, designSystem, contentRepository
 * @param businessId - Optional business identifier; when provided, a deterministic design
 *   variation (layout archetype, type pairing, palette source) is injected into the prompt
 *   to reduce template sameness across generated sites.
 * @returns DLS string + cost tracking record
 * @throws If generation fails (caller should handle fallback)
 */
export async function generateDLS(
  businessData: Record<string, unknown>,
  businessId?: string,
): Promise<DLSResult> {
  const brand = businessData.brandIdentity as Record<string, unknown> | undefined
  const vibe = (brand?.vibe as Record<string, unknown>) || {}
  const design = (brand?.designSystem as Record<string, unknown>) || {}
  const core = (brand?.core as Record<string, unknown>) || {}
  const voice = (brand?.voice as Record<string, unknown>) || {}

  const industry = (vibe?.industry as string) || (businessData as any)?.industry || 'General Business'
  const variation: DesignAxis | null = businessId ? pickDesignVariation(industry, businessId) : null
  const variationSection = variation
    ? `\n## DESIGN VARIATION (apply these specific choices to avoid template repetition)\n- **Layout archetype:** ${variation.layoutArchetype}\n- **Type pairing:** ${variation.typePairing}\n- **Palette source:** ${variation.paletteSource === 'photo' ? 'Derive accent colors from the business photo palette if available' : 'Use the industry default palette below'}\n`
    : ''

  // Build a focused context prompt with just the data the Design Architect needs
  const userPrompt = `Create a Design Language Specification for this business:

## Business Identity
- **Name:** ${core?.brandName || businessData.businessName || 'Unknown Business'}
- **Industry:** ${industry}
- **Aesthetic Direction:** ${vibe?.aestheticDirection || 'modern-tech'}
- **Hero Variant:** ${vibe?.heroVariant || 'full-bleed'}
- **Mood:** ${vibe?.mood || 'Professional'}
- **Vibe:** ${vibe?.vibe || 'Modern'}
- **Voice:** ${vibe?.voice || 'Professional'}
- **Visual Cues to USE:** ${((vibe?.visualCues as string[]) || []).join(', ') || 'none specified'}
- **Visual Cues to AVOID:** ${((vibe?.avoidCues as string[]) || []).join(', ') || 'none specified'}
${variationSection}
## Brand Personality
- **Primary:** ${(voice?.personality as Record<string, unknown>)?.primary || 'Professional'}
- **Secondary:** ${(voice?.personality as Record<string, unknown>)?.secondary || 'Modern'}

## Design System Colors (enriched — apply color maturity rules before using)
${formatColors(design)}

## Typography
- **Headings:** ${(design?.typography as any)?.headings?.family || 'Inter'}
- **Body:** ${(design?.typography as any)?.body?.family || 'Inter'}

Produce the DLS document now. Output ONLY the DLS — no markdown fences, no explanations.`

  const model = getDLSModel()

  const { text, usage } = await generateText({
    model,
    system: DESIGN_ARCHITECT_PROMPT,
    prompt: userPrompt,
  })

  const cost = buildCostRecord(usage, getModelId(model), 'design-architect', null)
  // Fire-and-forget cost recording
  recordCost(cost).catch((err) => {
    console.error('[DesignArchitect] Cost recording failed:', err)
  })

  // Clean the output — remove any markdown fences if present
  let dls = text.trim()
  if (dls.startsWith('```')) {
    dls = dls.replace(/^```(?:markdown|text|plaintext)?\n?/, '')
    dls = dls.replace(/\n?```$/, '')
  }

  console.log(`[DesignArchitect] DLS generated (${dls.length} chars, ${usage.totalTokens ?? 0} tokens)`)

  return { dls, cost }
}

/**
 * Format the semantic colors from the design system for the DLS prompt.
 */
function formatColors(design: Record<string, unknown>): string {
  const colors = (design?.colors as Record<string, unknown>)?.semantic as Record<string, Record<string, string>> | undefined
  if (!colors) return 'No colors provided — infer from industry.'

  return Object.entries(colors)
    .map(([key, value]) => `- **${key}:** ${value?.hex || 'not set'}`)
    .join('\n')
}
