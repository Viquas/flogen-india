import { describe, it, expect } from 'vitest'
import { getNicheFit, resolveNicheCategory, scoreLead, NICHE_FIT_TABLE, DEFAULT_NICHE_SCORE_THRESHOLD } from '@/lib/lead-scoring'

describe('getNicheFit', () => {
  it('returns fit data for a known trade category', () => {
    const fit = getNicheFit('plumber')
    expect(fit).not.toBeNull()
    expect(fit!.weight).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    expect(getNicheFit('Plumber')).toEqual(getNicheFit('plumber'))
  })

  it('returns null for a category not in the table', () => {
    expect(getNicheFit('quantum computing consultancy')).toBeNull()
  })
})

describe('resolveNicheCategory', () => {
  it('prefers the typed category when it matches the table', () => {
    expect(resolveNicheCategory('dentist', ['plumber'])).toBe('dentist')
  })

  it('falls back to a Google-verified type when the typed term misses', () => {
    // "plumbing services" is not a table key, but Google says primaryType "plumber".
    expect(resolveNicheCategory('plumbing services', ['plumber', 'point_of_interest'])).toBe('plumber')
  })

  it('normalizes underscores in Google types (dental_clinic -> dental clinic)', () => {
    expect(resolveNicheCategory('teeth people', ['dental_clinic'])).toBe('dental clinic')
  })

  it('maps aliased Google types that differ from the table key', () => {
    expect(resolveNicheCategory('agent', ['real_estate_agency'])).toBe('real estate agent')
    expect(resolveNicheCategory('vet', ['veterinary_care'])).toBe('veterinarian')
  })

  it('returns null when nothing matches', () => {
    expect(resolveNicheCategory('quantum computing', ['university', 'point_of_interest'])).toBeNull()
  })
})

describe('scoreLead', () => {
  const noGaps = {
    reachable: true,
    has_booking: true, has_chat: true, mobile_friendly: true, has_ssl: true,
    page_load_ms: 500, review_count: 5, review_velocity_30d: 1,
  }
  const allGaps = {
    reachable: true,
    has_booking: false, has_chat: false, mobile_friendly: false, has_ssl: false,
    page_load_ms: null, review_count: 80, review_velocity_30d: 20,
  }
  // Site we couldn't load: same false booleans as allGaps, but must NOT be scored as gaps.
  const unreachable = {
    reachable: false,
    has_booking: false, has_chat: false, mobile_friendly: false, has_ssl: false,
    page_load_ms: null, review_count: 80, review_velocity_30d: 20,
  }

  it('returns null for a category not in the niche table', () => {
    expect(scoreLead('quantum computing consultancy', noGaps)).toBeNull()
  })

  it('scores higher when more audit gaps are present', () => {
    const low = scoreLead('plumber', noGaps)!
    const high = scoreLead('plumber', allGaps)!
    expect(high.score).toBeGreaterThan(low.score)
  })

  it('clamps score between 0 and 100', () => {
    const result = scoreLead('dental clinic', allGaps)!
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('produces a non-empty pitch angle string', () => {
    const result = scoreLead('hair salon', allGaps)!
    expect(result.pitchAngle.length).toBeGreaterThan(10)
  })

  it('does not count gaps or assert faults for an unreachable site', () => {
    const reachableGaps = scoreLead('plumber', allGaps)!
    const unreachableResult = scoreLead('plumber', unreachable)!
    // An unreachable site must score strictly lower (no fabricated gap points)...
    expect(unreachableResult.score).toBeLessThan(reachableGaps.score)
    // ...and its pitch angle must not claim a specific technical fault.
    expect(unreachableResult.pitchAngle).not.toMatch(/no SSL|not mobile|no online booking|no chat/i)
  })

  it('exports a default threshold of 40', () => {
    expect(DEFAULT_NICHE_SCORE_THRESHOLD).toBe(40)
  })
})
