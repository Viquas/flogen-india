import { describe, it, expect } from 'vitest'
import { selectKnowledge } from '@/lib/ai/design-knowledge'

describe('selectKnowledge', () => {
  it('is deterministic for the same (niche, businessId)', () => {
    const a = selectKnowledge('automotive', 'biz-123')
    const b = selectKnowledge('automotive', 'biz-123')
    expect(a.archetypes).toEqual(b.archetypes)
    expect(a.dlsBlock).toBe(b.dlsBlock)
  })

  it('varies archetype combos across businessIds in the same niche', () => {
    const combos = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const s = selectKnowledge('automotive', `biz-${i}`)
      combos.add(`${s.archetypes.hero}|${s.archetypes.services}|${s.archetypes.socialProof}`)
    }
    expect(combos.size).toBeGreaterThan(3)
  })

  it('picks one archetype per slot from the right family', () => {
    const s = selectKnowledge('cafe', 'biz-1')
    expect(s.archetypes.hero).toMatch(/^hero-/)
    expect(s.archetypes.services).toMatch(/^services-/)
    expect(s.archetypes.socialProof).toMatch(/^social-proof-/)
  })

  it('resolves free-text niches and falls back to professional', () => {
    const auto = selectKnowledge('Automotive Repairs Sydney', 'biz-1')
    expect(auto.dlsBlock).toContain('# ')          // has content
    expect(auto.dlsBlock).toMatch(/industrial|accent/i) // automotive niche file present
    const unknown = selectKnowledge('quantum widgets', 'biz-1')
    expect(unknown.dlsBlock.length).toBeGreaterThan(1000) // professional fallback used, not empty
  })

  it('dlsBlock includes craft core, niche file, 3 archetypes, and section-misc', () => {
    const s = selectKnowledge('gym', 'biz-2')
    expect(s.dlsBlock).toContain('Craft Core')
    expect(s.dlsBlock).toContain('## Energy')
    expect(s.dlsBlock).toContain('## Craft rules')
    expect(s.dlsBlock).toContain('CTA band')
  })

  it('exemplarBlock contains exactly 3 tsx fences and no When-to-use prose', () => {
    const s = selectKnowledge('plumber', 'biz-3')
    expect((s.exemplarBlock.match(/```tsx/g) || []).length).toBe(3)
    expect(s.exemplarBlock).not.toContain('## When to use')
  })

  it('enforces the token ceiling (dlsBlock <= 32000 chars)', () => {
    for (let i = 0; i < 10; i++) {
      expect(selectKnowledge('restaurant', `biz-${i}`).dlsBlock.length).toBeLessThanOrEqual(32000)
    }
  })
})
