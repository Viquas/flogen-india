import { describe, it, expect } from 'vitest'
import { proofFragment } from '@/components/sales/outreach-composer'

describe('proofFragment', () => {
  it('returns null for null/empty input', () => {
    expect(proofFragment(null)).toBeNull()
    expect(proofFragment('')).toBeNull()
  })

  it('extracts the prospect-safe proof before the em-dash and drops internal shorthand', () => {
    const angle = '127 reviews (14 in the last 30 days), no online booking — that’s AI booking territory.'
    expect(proofFragment(angle)).toBe('127 reviews (14 in the last 30 days), no online booking')
  })

  it('lowercases the leading letter so it reads inside a sentence', () => {
    expect(proofFragment('No SSL/HTTPS — a good fit for missed-call text-back.')).toBe('no SSL/HTTPS')
  })

  it('strips trailing punctuation when there is no em-dash', () => {
    expect(proofFragment('no online booking.')).toBe('no online booking')
  })

  it('never leaks the internal "territory"/"good fit" tail', () => {
    const out = proofFragment('80 reviews, not mobile-friendly — that’s AI booking territory.')
    expect(out).not.toMatch(/territory|good fit/i)
  })
})
