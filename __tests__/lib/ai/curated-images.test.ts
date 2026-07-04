import { describe, it, expect } from 'vitest'
import { getCuratedFallbackImage } from '@/lib/ai/curated-images'

describe('getCuratedFallbackImage', () => {
  it('returns a URL for a known category', () => {
    const url = getCuratedFallbackImage('cafe', 'biz-1')
    expect(url).toMatch(/^https:\/\//)
  })

  it('is deterministic for the same category+businessId', () => {
    const a = getCuratedFallbackImage('cafe', 'biz-1')
    const b = getCuratedFallbackImage('cafe', 'biz-1')
    expect(a).toBe(b)
  })

  it('falls back to a generic curated set for unknown categories', () => {
    const url = getCuratedFallbackImage('unknown-category-xyz', 'biz-1')
    expect(url).toMatch(/^https:\/\//)
  })

  it('varies image within a category across different businessIds', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      seen.add(getCuratedFallbackImage('cafe', `biz-${i}`))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('varies image within a category that previously had only one image (plumber)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 15; i++) {
      seen.add(getCuratedFallbackImage('plumber', `biz-${i}`))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('varies image within the generic fallback pool for unknown categories', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 15; i++) {
      seen.add(getCuratedFallbackImage('unknown-category-xyz', `biz-${i}`))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('normalizes free-text categories to the automotive pool', () => {
    const url = getCuratedFallbackImage('Automotive', 'biz-1')
    const automotivePool = [
      'https://images.unsplash.com/photo-1676018366904-c083ed678e60?auto=format&fit=crop&q=80&w=1600',
      'https://images.unsplash.com/photo-1591278169757-deac26e49555?auto=format&fit=crop&q=80&w=1600',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1600',
    ]
    expect(automotivePool).toContain(url)
  })
})
