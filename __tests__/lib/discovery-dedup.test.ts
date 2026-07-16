import { describe, it, expect } from 'vitest'
import { findExistingPlaceIds } from '@/lib/discovery-dedup'

/**
 * Minimal Supabase stub: records the requested table + json key and returns
 * canned rows so we can assert the helper probes lead_lists AND projects under
 * both `placeId` and `place_id`.
 */
function makeSupabase(rows: {
  lead_lists?: Array<{ place_id: string }>
  projects_placeId?: Array<{ business_data: Record<string, unknown> }>
  projects_place_id?: Array<{ business_data: Record<string, unknown> }>
}) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            in(column: string) {
              if (table === 'lead_lists') return Promise.resolve({ data: rows.lead_lists ?? [] })
              if (table === 'projects' && column.endsWith('placeId'))
                return Promise.resolve({ data: rows.projects_placeId ?? [] })
              if (table === 'projects' && column.endsWith('place_id'))
                return Promise.resolve({ data: rows.projects_place_id ?? [] })
              return Promise.resolve({ data: [] })
            },
          }
        },
      }
    },
  }
}

describe('findExistingPlaceIds', () => {
  it('returns empty set for empty input without querying', async () => {
    const result = await findExistingPlaceIds(makeSupabase({}), [])
    expect(result.size).toBe(0)
  })

  it('finds a place saved as a lead', async () => {
    const supabase = makeSupabase({ lead_lists: [{ place_id: 'A' }] })
    const result = await findExistingPlaceIds(supabase, ['A', 'B'])
    expect([...result]).toEqual(['A'])
  })

  it('finds a project written under the camelCase placeId key (admin path)', async () => {
    const supabase = makeSupabase({ projects_placeId: [{ business_data: { placeId: 'C' } }] })
    const result = await findExistingPlaceIds(supabase, ['C'])
    expect(result.has('C')).toBe(true)
  })

  it('finds a project written under the snake_case place_id key (sales path)', async () => {
    const supabase = makeSupabase({ projects_place_id: [{ business_data: { place_id: 'D' } }] })
    const result = await findExistingPlaceIds(supabase, ['D'])
    expect(result.has('D')).toBe(true)
  })

  it('unions matches across all three sources', async () => {
    const supabase = makeSupabase({
      lead_lists: [{ place_id: 'A' }],
      projects_placeId: [{ business_data: { placeId: 'C' } }],
      projects_place_id: [{ business_data: { place_id: 'D' } }],
    })
    const result = await findExistingPlaceIds(supabase, ['A', 'B', 'C', 'D'])
    expect([...result].sort()).toEqual(['A', 'C', 'D'])
  })
})
