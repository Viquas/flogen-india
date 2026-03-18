import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCost } from './pricing'

export type CallType = 'generation' | 'enrichment' | 'revision' | 'auto_fix' | 'refinement' | 'template_swap' | 'stream-generation' | 'template-generation'

export interface CostRecord {
  project_id: string | null
  model: string
  call_type: CallType
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  prompt_version_id?: string | null
}

/**
 * Record a cost entry for an AI call. Fire-and-forget safe -- errors are logged, not thrown.
 */
export async function recordCost(record: CostRecord): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('generation_costs').insert({
      project_id: record.project_id,
      model: record.model,
      call_type: record.call_type,
      input_tokens: record.input_tokens,
      output_tokens: record.output_tokens,
      total_tokens: record.total_tokens,
      estimated_cost_usd: record.estimated_cost_usd,
      prompt_version_id: record.prompt_version_id ?? null,
    })
    if (error) {
      console.error('[CostTracker] Failed to record cost:', error.message)
    }
  } catch (err) {
    console.error('[CostTracker] Unexpected error recording cost:', err)
  }
}

/**
 * Helper to build a CostRecord from AI SDK usage data.
 * Usage object has { inputTokens, outputTokens, totalTokens } (AI SDK naming).
 */
export function buildCostRecord(
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number },
  model: string,
  callType: CallType,
  projectId: string | null,
  promptVersionId?: string | null
): CostRecord {
  const inputTokens = usage.inputTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  const totalTokens = usage.totalTokens ?? (inputTokens + outputTokens)
  return {
    project_id: projectId,
    model,
    call_type: callType,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    estimated_cost_usd: calculateCost(model, inputTokens, outputTokens),
    prompt_version_id: promptVersionId ?? null,
  }
}

/**
 * Helper to extract a model ID string from a provider model instance.
 * AI SDK model objects have modelId property.
 */
export function getModelId(model: unknown): string {
  if (model && typeof model === 'object') {
    const m = model as Record<string, unknown>
    if (typeof m.modelId === 'string') return m.modelId
    if (typeof m.id === 'string') return m.id
  }
  return 'unknown'
}
