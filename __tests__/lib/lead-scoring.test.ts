import { describe, it, expect } from 'vitest'
import { getNicheFit, scoreLead, NICHE_FIT_TABLE, DEFAULT_NICHE_SCORE_THRESHOLD } from '@/lib/lead-scoring'

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

describe('scoreLead', () => {
  const noGaps = {
    has_booking: true, has_chat: true, mobile_friendly: true, has_ssl: true,
    page_load_ms: 500, review_count: 5, review_velocity_30d: 1,
  }
  const allGaps = {
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

  it('exports a default threshold of 40', () => {
    expect(DEFAULT_NICHE_SCORE_THRESHOLD).toBe(40)
  })
})
