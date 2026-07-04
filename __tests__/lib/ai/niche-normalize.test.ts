import { describe, it, expect } from 'vitest'
import { normalizeNiche } from '@/lib/ai/niche-normalize'

describe('normalizeNiche', () => {
  it('maps plurals and location-suffixed input to canonical keys', () => {
    expect(normalizeNiche('cafes')).toBe('cafe')
    expect(normalizeNiche('Plumbers Sydney')).toBe('plumber')
    expect(normalizeNiche('Automotive')).toBe('automotive')
    expect(normalizeNiche('Dentist')).toBe('dental clinic')
    expect(normalizeNiche('Hair & Beauty Salon')).toBe('hair salon')
  })
  it('passes unknown input through lowercased/trimmed', () => {
    expect(normalizeNiche('  Quantum Widgets ')).toBe('quantum widgets')
  })
})
