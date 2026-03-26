import { generateText, streamText } from 'ai'
import { getModel, resolveProvider } from './model-config'
import { circuitBreaker } from './circuit-breaker'
import { logger } from '@/lib/logger'

const log = logger.ai.child('gateway')

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

// --- Retry helpers ---

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const JITTER_FACTOR = 0.25

/** HTTP status codes that are transient and worth retrying */
const TRANSIENT_STATUS_CODES = new Set([429, 500, 503])

/** HTTP status codes that are permanent — don't retry */
const PERMANENT_STATUS_CODES = new Set([400, 401, 403])

/**
 * Extract an HTTP status code from an AI SDK error, if present.
 * AI SDK errors may have `status`, `statusCode`, or nested `data.status`.
 */
function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (typeof e.status === 'number') return e.status
    if (typeof e.statusCode === 'number') return e.statusCode
    if (e.data && typeof e.data === 'object') {
      const d = e.data as Record<string, unknown>
      if (typeof d.status === 'number') return d.status
    }
  }
  return undefined
}

function isTransientError(error: unknown): boolean {
  const status = extractStatusCode(error)
  if (status && TRANSIENT_STATUS_CODES.has(status)) return true
  // Network errors (no status code) are transient
  if (status === undefined) {
    const msg = error instanceof Error ? error.message : String(error)
    if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up/i.test(msg)) return true
  }
  return false
}

function isPermanentError(error: unknown): boolean {
  const status = extractStatusCode(error)
  return status !== undefined && PERMANENT_STATUS_CODES.has(status)
}

/** Sleep for ms with ±25% jitter */
function sleepWithJitter(baseMs: number): Promise<void> {
  const jitter = baseMs * JITTER_FACTOR * (2 * Math.random() - 1) // range: -25% to +25%
  const ms = Math.max(0, Math.round(baseMs + jitter))
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Tracked generateText — wraps AI SDK generateText with cost/latency tracking,
 * retry with exponential backoff, and circuit breaker integration.
 */
export async function trackedGenerateText(
  options: Parameters<typeof generateText>[0] & { callType?: string }
): Promise<{ result: Awaited<ReturnType<typeof generateText>>; metrics: GenerationMetrics }> {
  const start = Date.now()
  const callType = options.callType || 'generate'

  // Remove custom field before passing to AI SDK
  const { callType: _, ...sdkOptions } = options

  const modelId = typeof options.model === 'string' ? options.model : (options.model?.modelId || 'unknown')
  const provider = resolveProvider(modelId)

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1)
        log.info('Retrying AI call', { attempt, delayMs, modelId, callType })
        await sleepWithJitter(delayMs)
      }

      const result = await generateText(sdkOptions)
      const durationMs = Date.now() - start

      // Record success to circuit breaker
      circuitBreaker.recordSuccess(provider)

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

      log.info('Generation complete', {
        callType,
        model: modelId,
        inputTokens,
        outputTokens,
        cost: `$${metrics.estimatedCostUsd.toFixed(4)}`,
        durationMs,
        attempts: attempt + 1,
      })

      return { result, metrics }
    } catch (error) {
      lastError = error

      // Record failure to circuit breaker
      circuitBreaker.recordFailure(provider)

      const status = extractStatusCode(error)
      const errorMsg = error instanceof Error ? error.message : String(error)

      // Permanent errors: don't retry
      if (isPermanentError(error)) {
        log.error('Permanent AI error, not retrying', {
          modelId,
          callType,
          status,
          error: errorMsg,
          attempt: attempt + 1,
        })
        break
      }

      // Transient errors: retry if attempts remain
      if (isTransientError(error) && attempt < MAX_RETRIES) {
        log.warn('Transient AI error, will retry', {
          modelId,
          callType,
          status,
          error: errorMsg,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
        })
        continue
      }

      // Unknown error type or out of retries
      log.error('AI call failed', {
        modelId,
        callType,
        status,
        error: errorMsg,
        attempt: attempt + 1,
        retriesExhausted: attempt >= MAX_RETRIES,
      })
      break
    }
  }

  // All retries exhausted or permanent error
  throw lastError
}

/**
 * Tracked streamText — wraps AI SDK streamText with cost/latency tracking.
 * Metrics are available after the stream completes.
 * Note: Streams are not retried (the consumer reads incrementally).
 * Circuit breaker is recorded on stream completion/failure.
 */
export function trackedStreamText(
  options: Parameters<typeof streamText>[0] & { callType?: string }
) {
  const start = Date.now()
  const callType = options.callType || 'stream'

  const { callType: _, ...sdkOptions } = options

  const streamResult = streamText(sdkOptions)
  const modelId = typeof options.model === 'string' ? options.model : (options.model?.modelId || 'unknown')
  const provider = resolveProvider(modelId)

  // Wrap PromiseLike in a real Promise so we can use .catch()
  const metricsPromise = Promise.resolve(streamResult.usage).then((usage) => {
    const durationMs = Date.now() - start
    const inputTokens = usage?.inputTokens || 0
    const outputTokens = usage?.outputTokens || 0

    // Stream completed successfully
    circuitBreaker.recordSuccess(provider)

    const metrics: GenerationMetrics = {
      model: modelId,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCost(modelId, inputTokens, outputTokens),
      durationMs,
      callType,
    }

    log.info('Stream complete', {
      callType,
      model: modelId,
      inputTokens,
      outputTokens,
      cost: `$${metrics.estimatedCostUsd.toFixed(4)}`,
      durationMs,
    })

    return metrics
  }).catch((error) => {
    // Stream failed — record to circuit breaker
    circuitBreaker.recordFailure(provider)
    log.error('Stream failed', {
      modelId,
      callType,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
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
    log.error('Failed to persist metrics', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
