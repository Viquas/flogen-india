import { describe, it, expect, vi } from 'vitest'
import { findApprovedTemplate, normalizeIndustryTag } from '@/lib/ai/template-routing'

function mockSupabase(rows: Array<{ id: string }>) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
            })),
          })),
        })),
      })),
    })),
  }
}

describe('normalizeIndustryTag', () => {
  it('maps common Maps categories to manifest tags', () => {
    expect(normalizeIndustryTag('Restaurant')).toBe('restaurant')
    expect(normalizeIndustryTag('Cafe')).toBe('cafe')
    expect(normalizeIndustryTag('Coffee shop')).toBe('cafe')
    expect(normalizeIndustryTag('Plumber')).toBe('plumber')
    expect(normalizeIndustryTag('Hair salon')).toBe('salon')
    expect(normalizeIndustryTag('Beauty salon')).toBe('salon')
    expect(normalizeIndustryTag('Real estate agency')).toBe('real-estate')
    expect(normalizeIndustryTag('Auto repair shop')).toBe('automotive')
    expect(normalizeIndustryTag('General contractor')).toBe('builder')
    expect(normalizeIndustryTag('Dentist')).toBe('dental')
    expect(normalizeIndustryTag('Gym')).toBe('gym')
    expect(normalizeIndustryTag('Electrician')).toBe('electrician')
  })
  it('returns the lowercased input when unmapped', () => {
    expect(normalizeIndustryTag('Taxidermist')).toBe('taxidermist')
  })
})

describe('findApprovedTemplate', () => {
  it('returns the template id when an approved template exists', async () => {
    const sb = mockSupabase([{ id: 'tpl-1' }])
    expect(await findApprovedTemplate('Restaurant', sb as any)).toBe('tpl-1')
  })
  it('returns null when none exist', async () => {
    const sb = mockSupabase([])
    expect(await findApprovedTemplate('Taxidermist', sb as any)).toBeNull()
  })
  it('returns null for missing industry', async () => {
    expect(await findApprovedTemplate(null, mockSupabase([]) as any)).toBeNull()
    expect(await findApprovedTemplate(undefined, mockSupabase([]) as any)).toBeNull()
  })
})
