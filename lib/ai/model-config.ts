import { generateText } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { circuitBreaker } from './circuit-breaker'
import { GEMINI_FLASH } from './model-ids'
import { logger } from '@/lib/logger'

const log = logger.ai.child('model-config')

// Configure OpenRouter if key is present
export const openrouter = createOpenAI({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
})

/**
 * Identify the provider name from a model ID string.
 * Used as the circuit breaker key.
 */
export function resolveProvider(modelId: string): string {
    if (modelId.startsWith('gemini-')) return 'google'
    if (modelId.startsWith('gpt-') || modelId.startsWith('o3-') || modelId === 'o3') return 'openai'
    // Anything routed through OpenRouter (slash-separated IDs like "moonshotai/kimi-k2.5")
    if (modelId.includes('/')) return 'openrouter'
    // Fallback heuristic
    if (process.env.OPENROUTER_API_KEY) return 'openrouter'
    return 'openai'
}

interface FallbackEntry {
    provider: string
    modelId: string
    available: boolean
}

/**
 * Build the ordered fallback chain based on available API keys.
 */
function buildFallbackChain(): FallbackEntry[] {
    const chain: FallbackEntry[] = []

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        chain.push({ provider: 'google', modelId: GEMINI_FLASH, available: true })
    }
    if (process.env.OPENROUTER_API_KEY) {
        chain.push({ provider: 'openrouter', modelId: 'moonshotai/kimi-k2.5', available: true })
    }
    chain.push({ provider: 'openai', modelId: 'o3', available: !!process.env.OPENAI_API_KEY })

    return chain
}

/**
 * Instantiate an AI SDK model from a provider + modelId pair.
 */
function createModel(provider: string, modelId: string) {
    switch (provider) {
        case 'google':
            return google(modelId)
        case 'openrouter':
            return openrouter(modelId)
        case 'openai':
        default:
            return openai(modelId)
    }
}

/**
 * Run generateText with automatic provider fallback.
 *
 * Tries the requested model first (if any), then each provider in the fallback
 * chain, moving on when a call throws (e.g. Gemini free-tier quota 429). Records
 * success/failure to the circuit breaker so repeated failures also steer future
 * getModel() picks. Throws the last error only if EVERY provider fails.
 *
 * This is what makes generation resilient: without it, a quota-limited primary
 * provider fails the whole job because the direct generateText call never retries.
 */
export async function generateTextWithFallback(
    requestedModel: string | undefined,
    params: Omit<Parameters<typeof generateText>[0], 'model'>,
): Promise<{ text: string; usage: Awaited<ReturnType<typeof generateText>>['usage']; modelIdUsed: string }> {
    const attempts: Array<{ provider: string; modelId: string }> = []
    if (requestedModel && requestedModel !== 'default') {
        attempts.push({ provider: resolveProvider(requestedModel), modelId: requestedModel })
    }
    for (const entry of buildFallbackChain()) {
        if (entry.available && !attempts.some(a => a.modelId === entry.modelId)) {
            attempts.push({ provider: entry.provider, modelId: entry.modelId })
        }
    }

    let lastError: unknown
    for (const attempt of attempts) {
        try {
            const model = createModel(attempt.provider, attempt.modelId)
            const result = await generateText({ ...params, model } as Parameters<typeof generateText>[0])
            circuitBreaker.recordSuccess(attempt.provider)
            return { text: result.text, usage: result.usage, modelIdUsed: attempt.modelId }
        } catch (err) {
            circuitBreaker.recordFailure(attempt.provider)
            log.warn('Generation attempt failed, trying next provider', {
                provider: attempt.provider,
                modelId: attempt.modelId,
                error: err instanceof Error ? err.message : String(err),
            })
            lastError = err
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error('All AI providers failed for generateText')
}

// Select model based on available keys, with circuit breaker fallback
export const getModel = (modelId?: string) => {
    // If a specific model is requested
    if (modelId && modelId !== 'default') {
        const provider = resolveProvider(modelId)

        if (circuitBreaker.canUse(provider)) {
            // Google Gemini models
            if (modelId.startsWith('gemini-')) return google(modelId)
            // OpenAI models
            if (modelId.startsWith('gpt-') || modelId.startsWith('o3-') || modelId === 'o3') return openai(modelId)
            // OpenRouter models (if key exists)
            if (process.env.OPENROUTER_API_KEY) return openrouter(modelId)
        } else {
            log.warn('Requested provider circuit is open, falling through to fallback chain', {
                provider,
                modelId,
            })
        }
        // If the requested provider is tripped, fall through to fallback chain below
    }

    // Default fallback chain with circuit breaker awareness
    const chain = buildFallbackChain()

    // Try each provider in order, skipping tripped circuits
    for (const entry of chain) {
        if (entry.available && circuitBreaker.canUse(entry.provider)) {
            return createModel(entry.provider, entry.modelId)
        }
    }

    // All providers tripped: use the one that failed least recently
    const leastRecentlyFailed = chain
        .filter((e) => e.available)
        .sort((a, b) => circuitBreaker.getLastFailureAt(a.provider) - circuitBreaker.getLastFailureAt(b.provider))[0]

    if (leastRecentlyFailed) {
        log.warn('All providers tripped, using least-recently-failed', {
            provider: leastRecentlyFailed.provider,
            modelId: leastRecentlyFailed.modelId,
        })
        return createModel(leastRecentlyFailed.provider, leastRecentlyFailed.modelId)
    }

    // Absolute last resort (shouldn't happen if at least one key is configured)
    log.error('No available providers, returning openai o3 as last resort')
    return openai('o3')
}
