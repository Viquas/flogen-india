import { describe, it, expect } from 'vitest'
import { pickDesignVariation, NICHE_DESIGN_AXES } from '@/lib/ai/design-variation'

describe('pickDesignVariation', () => {
  it('is deterministic for the same businessId', () => {
    const a = pickDesignVariation('cafe', 'biz-123')
    const b = pickDesignVariation('cafe', 'biz-123')
    expect(a).toEqual(b)
  })

  it('varies across different businessIds in the same niche', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const v = pickDesignVariation('cafe', `biz-${i}`)
      seen.add(v.layoutArchetype + v.typePairing)
    }
    // With multiple candidate axes and 20 samples, expect more than one distinct combination
    expect(seen.size).toBeGreaterThan(1)
  })

  it('falls back to a generic axis set for niches not in the table', () => {
    const result = pickDesignVariation('undefined-niche-xyz', 'biz-1')
    expect(result).toBeDefined()
    expect(result.layoutArchetype).toBeTruthy()
  })

  it('every niche in the table has at least 2 candidate axes', () => {
    for (const [niche, axes] of Object.entries(NICHE_DESIGN_AXES)) {
      expect(axes.length, `${niche} should have >=2 axes for real variation`).toBeGreaterThanOrEqual(2)
    }
  })

  it('matches free-text discovery input (capitalization, plurals, location suffix) to a specific niche', () => {
    // "Automotive" (capitalized) and "Plumbers Sydney" (plural + suffix) must resolve to
    // their own axes, not collapse to the generic set — otherwise variation is inert on
    // real operator input (the reviewer's category-matching concern).
    expect(NICHE_DESIGN_AXES['automotive']).toBeDefined()
    expect(NICHE_DESIGN_AXES['plumber']).toBeDefined()
    expect(pickDesignVariation('Automotive', 'biz-1')).toEqual(pickDesignVariation('automotive', 'biz-1'))
    expect(pickDesignVariation('Plumbers Sydney', 'biz-1')).toEqual(pickDesignVariation('plumber', 'biz-1'))
  })
})
