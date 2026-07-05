import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('buildFallbackChain cost-guard', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'fake'
    process.env.OPENROUTER_API_KEY = 'fake'
    process.env.OPENAI_API_KEY = 'fake'
  })

  it('never includes o3 (cost-guard: worst-case fallback must stay cheap)', async () => {
    const { buildFallbackChain } = await import('@/lib/ai/model-config')
    const ids = buildFallbackChain().map(e => e.modelId)
    expect(ids).not.toContain('o3')
    expect(ids).toContain('gpt-4o-mini')
  })

  it('keeps the cheap-first order: gemini, kimi, gpt-4o-mini', async () => {
    const { buildFallbackChain } = await import('@/lib/ai/model-config')
    const ids = buildFallbackChain().map(e => e.modelId)
    expect(ids).toEqual(['gemini-2.5-flash', 'moonshotai/kimi-k2.5', 'gpt-4o-mini'])
  })
})
