import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('@/lib/google-places', async () => {
  const actual = await vi.importActual('@/lib/google-places')
  return {
    ...actual,
    requireApiKey: vi.fn(() => 'fake-key'),
    paginatedSearch: vi.fn(),
  }
})
vi.mock('@/lib/lead-audit', () => ({
  auditWebsite: vi.fn(),
}))

import { discoverLeads } from '@/lib/lead-discovery'
import { createAdminClient } from '@/lib/supabase/admin'
import { paginatedSearch } from '@/lib/google-places'
import { auditWebsite } from '@/lib/lead-audit'

function makeSupabaseMock(insertedRows: any[]) {
  const insertMock = vi.fn().mockResolvedValue({ error: null })
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: [] }) })),
      insert: (rows: any[]) => { insertedRows.push(...rows); return insertMock() },
    })),
  }
}

describe('discoverLeads pool=automation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('excludes categories not in the niche fit table', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
      if (cfg.label !== 'Primary') return
      cfg.counters.validPlaces.push({
        id: 'place1', displayName: { text: 'Quantum Consultants' },
        formattedAddress: '1 Test St', websiteUri: 'https://quantum-example.com',
        rating: 4.5, userRatingCount: 10,
      })
      cfg.counters.totalFetched = 1
    })

    const result = await discoverLeads({
      query: 'quantum computing consultancy', location: 'Sydney, NSW',
      industry: 'quantum computing consultancy', entries: 10, pool: 'automation',
    })

    expect(result.savedCount).toBe(0)
    expect(result.reason).toBe('out_of_niche')
    expect(insertedRows.length).toBe(0)
  })

  it('stores scored leads with pool, niche_score, pitch_angle, audit_signals', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
      if (cfg.label !== 'Primary') return
      cfg.counters.validPlaces.push({
        id: 'place2', displayName: { text: 'Bondi Plumbing Co' },
        formattedAddress: '2 Test St, Bondi', websiteUri: 'https://bondiplumbing-example.com',
        rating: 4.2, userRatingCount: 40,
      })
      cfg.counters.totalFetched = 1
    })
    ;(auditWebsite as any).mockResolvedValue({
      has_booking: false, has_chat: false, mobile_friendly: false, has_ssl: false,
      page_load_ms: null, review_count: 40, review_velocity_30d: 5,
    })

    const result = await discoverLeads({
      query: 'plumber', location: 'Bondi, NSW',
      industry: 'plumber', entries: 10, pool: 'automation',
    })

    expect(result.savedCount).toBe(1)
    expect(result.reason).toBeFalsy()
    expect(insertedRows[0].pool).toBe('automation')
    expect(insertedRows[0].niche_score).toBeGreaterThanOrEqual(40)
    expect(typeof insertedRows[0].pitch_angle).toBe('string')
    expect(insertedRows[0].audit_signals).toBeTruthy()
  })

  it('drops leads scoring below the threshold, resolving with reason below_threshold', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
      if (cfg.label !== 'Primary') return
      cfg.counters.validPlaces.push({
        id: 'place3', displayName: { text: 'Well Run Salon' },
        formattedAddress: '3 Test St', websiteUri: 'https://wellrun-example.com',
        rating: 4.9, userRatingCount: 2,
      })
      cfg.counters.totalFetched = 1
    })
    ;(auditWebsite as any).mockResolvedValue({
      has_booking: true, has_chat: true, mobile_friendly: true, has_ssl: true,
      page_load_ms: 300, review_count: 2, review_velocity_30d: 0,
    })

    const result = await discoverLeads({
      query: 'hair salon', location: 'Chatswood, NSW',
      industry: 'hair salon', entries: 10, pool: 'automation',
    })

    expect(result.savedCount).toBe(0)
    expect(result.reason).toBe('below_threshold')
    expect(insertedRows.length).toBe(0)
  })
})

describe('discoverLeads pool=website (default, unchanged behavior)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not set niche_score/pitch_angle/audit_signals for website pool', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
      if (cfg.label !== 'Primary') return
      cfg.counters.validPlaces.push({
        id: 'place4', displayName: { text: 'No Website Cafe' },
        formattedAddress: '4 Test St', rating: 4.0, userRatingCount: 5,
      })
      cfg.counters.totalFetched = 1
    })

    const result = await discoverLeads({
      query: 'cafe', location: 'Newtown, NSW', industry: 'cafe', entries: 10,
    })

    expect(result.savedCount).toBe(1)
    expect(result.reason).toBeFalsy()
    expect(insertedRows[0].pool).toBe('website')
    expect(insertedRows[0].niche_score).toBeNull()
    expect(auditWebsite).not.toHaveBeenCalled()
  })

  it('defaults website pool to skipWithWebsite=true (only businesses without a site)', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    let capturedSkip: boolean | undefined
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
      capturedSkip = cfg.skipWithWebsite
      if (cfg.label !== 'Primary') return
      cfg.counters.validPlaces.push({
        id: 'place5', displayName: { text: 'No Website Barber' },
        formattedAddress: '5 Test St', rating: 4.0, userRatingCount: 5,
      })
      cfg.counters.totalFetched = 1
    })

    await discoverLeads({ query: 'barber', location: 'Bondi, NSW', industry: 'barber', entries: 10 })

    expect(capturedSkip).toBe(true)
  })

  it('honors an explicit skipWithWebsite=false override for the website pool', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    let capturedSkip: boolean | undefined
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
      capturedSkip = cfg.skipWithWebsite
      if (cfg.label !== 'Primary') return
      cfg.counters.validPlaces.push({
        id: 'place6', displayName: { text: 'Has Website Cafe' },
        formattedAddress: '6 Test St', websiteUri: 'https://x.example', rating: 4.0, userRatingCount: 5,
      })
      cfg.counters.totalFetched = 1
    })

    await discoverLeads({ query: 'cafe', location: 'Newtown, NSW', industry: 'cafe', entries: 10, skipWithWebsite: false })

    expect(capturedSkip).toBe(false)
  })
})
