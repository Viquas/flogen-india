import { generateText, streamText } from 'ai'
import { getModel } from './model-config'

// Model pricing per 1M tokens (input/output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.1-pro-preview': { input: 1.25, output: 5.0 },
  'gemini-2.5-flash-preview-05-20': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'o3': { input: 10.0, output: 40.0 },
  'moonshotai/kimi-k2.5': { input: 0.6, output: 2.4 },
}

export interface GenerationMetrics {
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  durationMs: number
  callType: string
}

function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[modelId] || { input: 2.0, output: 8.0 } // conservative default
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

/**
 * Tracked generateText — wraps AI SDK generateText with cost/latency tracking.
 * Returns both the result and metrics.
 */
export async function trackedGenerateText(
  options: Parameters<typeof generateText>[0] & { callType?: string }
): Promise<{ result: Awaited<ReturnType<typeof generateText>>; metrics: GenerationMetrics }> {
  const start = Date.now()
  const callType = options.callType || 'generate'

  // Remove custom field before passing to AI SDK
  const { callType: _, ...sdkOptions } = options

  const result = await generateText(sdkOptions)
  const durationMs = Date.now() - start

  const modelId = typeof options.model === 'string' ? options.model : (options.model?.modelId || 'unknown')
  const inputTokens = result.usage?.inputTokens || 0
  const outputTokens = result.usage?.outputTokens || 0

  const metrics: GenerationMetrics = {
    model: modelId,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(modelId, inputTokens, outputTokens),
    durationMs,
    callType,
  }

  console.log(`[AI Gateway] ${callType} | model=${modelId} | tokens=${inputTokens}+${outputTokens} | cost=$${metrics.estimatedCostUsd.toFixed(4)} | ${durationMs}ms`)

  return { result, metrics }
}

/**
 * Tracked streamText — wraps AI SDK streamText with cost/latency tracking.
 * Metrics are available after the stream completes.
 */
export function trackedStreamText(
  options: Parameters<typeof streamText>[0] & { callType?: string }
) {
  const start = Date.now()
  const callType = options.callType || 'stream'

  const { callType: _, ...sdkOptions } = options

  const streamResult = streamText(sdkOptions)
  const modelId = typeof options.model === 'string' ? options.model : (options.model?.modelId || 'unknown')

  // Attach metrics promise that resolves when stream completes
  const metricsPromise = streamResult.usage.then((usage) => {
    const durationMs = Date.now() - start
    const inputTokens = usage?.inputTokens || 0
    const outputTokens = usage?.outputTokens || 0

    const metrics: GenerationMetrics = {
      model: modelId,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCost(modelId, inputTokens, outputTokens),
      durationMs,
      callType,
    }

    console.log(`[AI Gateway] ${callType} | model=${modelId} | tokens=${inputTokens}+${outputTokens} | cost=$${metrics.estimatedCostUsd.toFixed(4)} | ${durationMs}ms`)

    return metrics
  })

  return { ...streamResult, metricsPromise }
}

/**
 * Persist generation metrics to the database (fire-and-forget).
 */
export async function persistMetrics(metrics: GenerationMetrics, projectId?: string) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    await supabase.from('generation_costs').insert({
      model: metrics.model,
      call_type: metrics.callType,
      input_tokens: metrics.inputTokens,
      output_tokens: metrics.outputTokens,
      estimated_cost_usd: metrics.estimatedCostUsd,
      duration_ms: metrics.durationMs,
      project_id: projectId || null,
    })
  } catch (error) {
    // Non-fatal: log and continue
    console.error('[AI Gateway] Failed to persist metrics:', error)
  }
}
