# Aussie Lead Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `lead_lists` discovery pipeline with two pools — `website` (no site) and `automation` (has a site but scores well for AI automation) — for Sydney, Australia, with a scoring/pitch-angle system and a dashboard pool toggle.

**Architecture:** Additive changes only. `lib/lead-discovery.ts` gains a `pool` branch; two new modules (`lib/lead-scoring.ts`, `lib/lead-audit.ts`) do the niche-fit scoring and lightweight website audit; `lead_lists` gets four new nullable/defaulted columns via migration; the existing leads dashboard gets a pool toggle reusing the existing `date` searchParam pattern.

**Tech Stack:** Next.js App Router, Supabase (Postgres), vitest for unit tests, existing `lib/google-places.ts` pagination helpers.

## Global Constraints

- Extend the existing Supabase schema — never modify or drop existing columns (per spec).
- `lead_lists` pool discovery reuses `lib/google-places.ts`'s `paginatedSearch`/`requireApiKey`/`buildFallbackQuery` — do not duplicate Google Places fetch logic.
- Website audit is a **lightweight HTML fetch + signature scan only** — no headless browser, no Puppeteer/Playwright (per spec decision).
- Starting geography is Sydney suburbs (CBD, Parramatta, Bondi, Chatswood, Newtown) in a config array, not hardcoded inline — must be easy to extend.
- Minimum `niche_score` threshold for Pool B storage defaults to 40, must be configurable (not a magic number buried in logic).
- Categories not in the niche-fit table are excluded from Pool B entirely — do not store them.
- All new DB access goes through `createAdminClient()` (service role), matching every existing module in `lib/lead-discovery.ts` and `lib/discovery.ts`.
- Tests use vitest (`npm test`), files under `__tests__/`, alias `@/` resolves to repo root (see `vitest.config.ts`).

---

### Task 1: Database migration for lead pools

**Files:**
- Create: `supabase/migrations/20260703000001_add_lead_pools.sql`
- Modify: `types/database.ts:604-657` (the `lead_lists` Row/Insert/Update block)

**Interfaces:**
- Produces: `lead_lists.pool: 'website' | 'automation'`, `lead_lists.niche_score: number | null`, `lead_lists.pitch_angle: string | null`, `lead_lists.audit_signals: Json | null` — consumed by Task 2 (scoring), Task 4 (discovery), Task 6 (dashboard).

- [ ] **Step 1: Write the migration**

```sql
-- Aussie Lead Engine: dual-pool lead discovery (website vs AI automation fit)
-- pool='website': businesses with no website (existing discoverLeads behavior)
-- pool='automation': businesses with a website that score well for AI automation

ALTER TABLE lead_lists
  ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'website'
    CHECK (pool IN ('website', 'automation')),
  ADD COLUMN IF NOT EXISTS niche_score INT,
  ADD COLUMN IF NOT EXISTS pitch_angle TEXT,
  ADD COLUMN IF NOT EXISTS audit_signals JSONB;

CREATE INDEX IF NOT EXISTS idx_lead_lists_pool_score
  ON lead_lists(pool, niche_score DESC NULLS LAST);

-- Rollback (manual, for reference — do not run unless reverting):
-- DROP INDEX IF EXISTS idx_lead_lists_pool_score;
-- ALTER TABLE lead_lists
--   DROP COLUMN IF EXISTS pool,
--   DROP COLUMN IF EXISTS niche_score,
--   DROP COLUMN IF EXISTS pitch_angle,
--   DROP COLUMN IF EXISTS audit_signals;
```

- [ ] **Step 2: Apply the migration locally**

Run: `npx supabase db push` (or the project's existing migration-apply command — check `scripts/migration/MIGRATION.md` if `db push` is not configured for this project)
Expected: migration applies with no errors, `lead_lists` now has the four new columns.

- [ ] **Step 3: Update `types/database.ts`**

In the `lead_lists` block at `types/database.ts:604-657`, add the four fields to `Row`, `Insert`, and `Update`:

```ts
            lead_lists: {
                Row: {
                    id: string
                    batch_id: string
                    place_id: string | null
                    business_name: string
                    phone: string | null
                    email: string | null
                    address: string | null
                    website: string | null
                    maps_url: string | null
                    rating: number | null
                    review_count: number | null
                    industry: string | null
                    location: string | null
                    raw_data: Json | null
                    created_at: string
                    pool: string
                    niche_score: number | null
                    pitch_angle: string | null
                    audit_signals: Json | null
                }
                Insert: {
                    id?: string
                    batch_id: string
                    place_id?: string | null
                    business_name: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    website?: string | null
                    maps_url?: string | null
                    rating?: number | null
                    review_count?: number | null
                    industry?: string | null
                    location?: string | null
                    raw_data?: Json | null
                    created_at?: string
                    pool?: string
                    niche_score?: number | null
                    pitch_angle?: string | null
                    audit_signals?: Json | null
                }
                Update: {
                    id?: string
                    batch_id?: string
                    place_id?: string | null
                    business_name?: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    website?: string | null
                    maps_url?: string | null
                    rating?: number | null
                    review_count?: number | null
                    industry?: string | null
                    location?: string | null
                    raw_data?: Json | null
                    created_at?: string
                    pool?: string
                    niche_score?: number | null
                    pitch_angle?: string | null
                    audit_signals?: Json | null
                }
                Relationships: []
            }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors related to `lead_lists`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260703000001_add_lead_pools.sql types/database.ts
git commit -m "feat: add pool/niche_score/pitch_angle/audit_signals columns to lead_lists"
```

---

### Task 2: Niche fit table and scoring module

**Files:**
- Create: `lib/lead-scoring.ts`
- Test: `__tests__/lib/lead-scoring.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (pure logic module).
- Produces:
  - `NICHE_FIT_TABLE: Record<string, { weight: number; pitchTemplate: string }>`
  - `getNicheFit(category: string): { weight: number; pitchTemplate: string } | null`
  - `interface AuditSignals { has_booking: boolean; has_chat: boolean; mobile_friendly: boolean; has_ssl: boolean; page_load_ms: number | null; review_count: number; review_velocity_30d: number }`
  - `scoreLead(category: string, signals: AuditSignals): { score: number; pitchAngle: string } | null` (returns `null` if category not in `NICHE_FIT_TABLE`) — consumed by Task 3 (audit orchestration) and Task 4 (discovery integration).
  - `DEFAULT_NICHE_SCORE_THRESHOLD = 40`

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/lead-scoring.test.ts`
Expected: FAIL with "Cannot find module '@/lib/lead-scoring'"

- [ ] **Step 3: Implement `lib/lead-scoring.ts`**

```ts
/**
 * Niche fit + audit-gap scoring for the "automation" lead pool.
 * A lead's niche_score = niche_fit_weight (0-40) + audit_gap_points (0-40)
 * + busy_signal_points (0-20), clamped to [0, 100].
 */

export interface AuditSignals {
  has_booking: boolean
  has_chat: boolean
  mobile_friendly: boolean
  has_ssl: boolean
  page_load_ms: number | null
  review_count: number
  review_velocity_30d: number
}

interface NicheFit {
  weight: number
  pitchTemplate: string
  label: string
}

export const NICHE_FIT_TABLE: Record<string, NicheFit> = {
  'plumber': { weight: 40, label: 'trades', pitchTemplate: 'missed-call text-back' },
  'electrician': { weight: 40, label: 'trades', pitchTemplate: 'missed-call text-back' },
  'locksmith': { weight: 40, label: 'trades', pitchTemplate: 'missed-call text-back' },
  'dental clinic': { weight: 40, label: 'clinic', pitchTemplate: 'AI booking and appointment reminders' },
  'dentist': { weight: 40, label: 'clinic', pitchTemplate: 'AI booking and appointment reminders' },
  'physiotherapist': { weight: 40, label: 'clinic', pitchTemplate: 'AI booking and appointment reminders' },
  'chiropractor': { weight: 40, label: 'clinic', pitchTemplate: 'AI booking and appointment reminders' },
  'hair salon': { weight: 32, label: 'salon', pitchTemplate: 'AI booking' },
  'barber': { weight: 32, label: 'salon', pitchTemplate: 'AI booking' },
  'restaurant': { weight: 24, label: 'hospitality', pitchTemplate: 'a FAQ and table-booking bot' },
  'cafe': { weight: 24, label: 'hospitality', pitchTemplate: 'a FAQ and table-booking bot' },
  'real estate agent': { weight: 24, label: 'real estate', pitchTemplate: 'a lead-capture chatbot' },
  'veterinarian': { weight: 36, label: 'clinic', pitchTemplate: 'AI booking' },
  'gym': { weight: 24, label: 'fitness', pitchTemplate: 'a class-booking bot' },
  'fitness studio': { weight: 24, label: 'fitness', pitchTemplate: 'a class-booking bot' },
}

export const DEFAULT_NICHE_SCORE_THRESHOLD = 40

export function getNicheFit(category: string): { weight: number; pitchTemplate: string } | null {
  const fit = NICHE_FIT_TABLE[category.trim().toLowerCase()]
  if (!fit) return null
  return { weight: fit.weight, pitchTemplate: fit.pitchTemplate }
}

function auditGapPoints(signals: AuditSignals): { points: number; gaps: string[] } {
  const gapChecks: Array<[boolean, string]> = [
    [!signals.has_booking, 'no online booking'],
    [!signals.has_chat, 'no chat widget'],
    [!signals.mobile_friendly, 'not mobile-friendly'],
    [!signals.has_ssl, 'no SSL/HTTPS'],
  ]
  const firedGaps = gapChecks.filter(([fired]) => fired).map(([, label]) => label)
  return { points: firedGaps.length * 10, gaps: firedGaps }
}

function busySignalPoints(signals: AuditSignals): number {
  // Scale review_count (cap contribution at 50 reviews) + review_velocity_30d (cap at 10/month)
  const countPoints = Math.min(signals.review_count, 50) / 50 * 10
  const velocityPoints = Math.min(signals.review_velocity_30d, 10) / 10 * 10
  return Math.round(countPoints + velocityPoints)
}

export function scoreLead(
  category: string,
  signals: AuditSignals,
): { score: number; pitchAngle: string } | null {
  const fit = NICHE_FIT_TABLE[category.trim().toLowerCase()]
  if (!fit) return null

  const { points: gapPoints, gaps } = auditGapPoints(signals)
  const busyPoints = busySignalPoints(signals)
  const score = Math.max(0, Math.min(100, fit.weight * (40 / 40) + gapPoints + busyPoints))
  // fit.weight is already scaled 0-40, so use it directly (no extra normalization needed
  // since NICHE_FIT_TABLE weights are authored in the 0-40 range)
  const clampedScore = Math.max(0, Math.min(100, fit.weight + gapPoints + busyPoints))

  let pitchAngle: string
  if (gaps.length > 0) {
    pitchAngle = signals.review_velocity_30d > 0
      ? `${signals.review_count} reviews (${signals.review_velocity_30d} in the last 30 days), ${gaps[0]} — that's ${fit.pitchTemplate} territory.`
      : `${gaps[0]}, ${gaps.length > 1 ? `and ${gaps.length - 1} other gap${gaps.length > 2 ? 's' : ''}` : ''} — a good fit for ${fit.pitchTemplate}.`
  } else {
    pitchAngle = `Solid online presence already — worth a conversation about ${fit.pitchTemplate} to handle overflow.`
  }

  return { score: clampedScore, pitchAngle }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/lead-scoring.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Clean up the dead `score` variable**

Remove the unused intermediate `score` calculation left in from drafting — keep only `clampedScore`, renamed to `score`, as the single computation:

```ts
export function scoreLead(
  category: string,
  signals: AuditSignals,
): { score: number; pitchAngle: string } | null {
  const fit = NICHE_FIT_TABLE[category.trim().toLowerCase()]
  if (!fit) return null

  const { points: gapPoints, gaps } = auditGapPoints(signals)
  const busyPoints = busySignalPoints(signals)
  const score = Math.max(0, Math.min(100, fit.weight + gapPoints + busyPoints))

  let pitchAngle: string
  if (gaps.length > 0) {
    pitchAngle = signals.review_velocity_30d > 0
      ? `${signals.review_count} reviews (${signals.review_velocity_30d} in the last 30 days), ${gaps[0]} — that's ${fit.pitchTemplate} territory.`
      : `${gaps[0]}${gaps.length > 1 ? `, and ${gaps.length - 1} other gap${gaps.length > 2 ? 's' : ''}` : ''} — a good fit for ${fit.pitchTemplate}.`
  } else {
    pitchAngle = `Solid online presence already — worth a conversation about ${fit.pitchTemplate} to handle overflow.`
  }

  return { score, pitchAngle }
}
```

- [ ] **Step 6: Run tests again to confirm still passing**

Run: `npx vitest run __tests__/lib/lead-scoring.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 7: Commit**

```bash
git add lib/lead-scoring.ts __tests__/lib/lead-scoring.test.ts
git commit -m "feat: add niche fit table and lead scoring for automation pool"
```

---

### Task 3: Lightweight website audit module

**Files:**
- Create: `lib/lead-audit.ts`
- Test: `__tests__/lib/lead-audit.test.ts`

**Interfaces:**
- Consumes: `AuditSignals` type from `lib/lead-scoring.ts` (Task 2).
- Produces: `async function auditWebsite(url: string, reviewCount: number, reviewVelocity30d: number): Promise<AuditSignals>` — consumed by Task 4 (discovery integration).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { auditWebsite } from '@/lib/lead-audit'

describe('auditWebsite', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('detects a booking widget signature', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><head></head><body><script src="https://assets.calendly.com/widget.js"></script></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.has_booking).toBe(true)
  })

  it('detects a chat widget signature', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><script src="https://widget.intercom.io/widget/abc"></script></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.has_chat).toBe(true)
  })

  it('detects missing viewport meta as not mobile-friendly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><head><title>No viewport</title></head><body></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.mobile_friendly).toBe(false)
  })

  it('detects viewport meta as mobile-friendly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><head><meta name="viewport" content="width=device-width"></head><body></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.mobile_friendly).toBe(true)
  })

  it('detects https as has_ssl true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.has_ssl).toBe(true)
  })

  it('detects http as has_ssl false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body></body></html>',
    } as Response)

    const result = await auditWebsite('http://example.com', 10, 2)
    expect(result.has_ssl).toBe(false)
  })

  it('treats fetch failure as all-gaps-present (site broken signal)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    const result = await auditWebsite('https://broken-example.com', 10, 2)
    expect(result.has_booking).toBe(false)
    expect(result.has_chat).toBe(false)
    expect(result.mobile_friendly).toBe(false)
    expect(result.page_load_ms).toBeNull()
  })

  it('passes through review_count and review_velocity_30d unchanged', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 17, 4)
    expect(result.review_count).toBe(17)
    expect(result.review_velocity_30d).toBe(4)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/lead-audit.test.ts`
Expected: FAIL with "Cannot find module '@/lib/lead-audit'"

- [ ] **Step 3: Implement `lib/lead-audit.ts`**

```ts
/**
 * Lightweight website audit for the "automation" lead pool.
 * Fetches raw HTML only — no headless browser, no JS execution.
 * A fetch failure is treated as a strong automation signal (site is broken).
 */
import type { AuditSignals } from '@/lib/lead-scoring'

const FETCH_TIMEOUT_MS = 5000

const BOOKING_SIGNATURES = [
  'calendly.com', 'cal.com/embed', 'fresha.com', 'squareup.com/appointments',
  'vagaro.com', 'booksy.com', 'setmore.com',
]

const CHAT_SIGNATURES = [
  'intercom.io', 'tawk.to', 'crisp.chat', 'js.driftt.com', 'tidio.co',
]

async function fetchHtmlWithTimeout(url: string): Promise<{ html: string; loadMs: number } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const start = Date.now()

  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' })
    const html = await response.text()
    return { html, loadMs: Date.now() - start }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function auditWebsite(
  url: string,
  reviewCount: number,
  reviewVelocity30d: number,
): Promise<AuditSignals> {
  const fetched = await fetchHtmlWithTimeout(url)

  if (!fetched) {
    return {
      has_booking: false,
      has_chat: false,
      mobile_friendly: false,
      has_ssl: false,
      page_load_ms: null,
      review_count: reviewCount,
      review_velocity_30d: reviewVelocity30d,
    }
  }

  const { html, loadMs } = fetched
  const lowerHtml = html.toLowerCase()

  return {
    has_booking: BOOKING_SIGNATURES.some(sig => lowerHtml.includes(sig)),
    has_chat: CHAT_SIGNATURES.some(sig => lowerHtml.includes(sig)),
    mobile_friendly: /<meta[^>]+name=["']viewport["']/i.test(html),
    has_ssl: url.trim().toLowerCase().startsWith('https://'),
    page_load_ms: loadMs,
    review_count: reviewCount,
    review_velocity_30d: reviewVelocity30d,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/lead-audit.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/lead-audit.ts __tests__/lib/lead-audit.test.ts
git commit -m "feat: add lightweight website audit for automation lead scoring"
```

---

### Task 4: Sydney suburb config and discovery pool integration

**Files:**
- Create: `lib/au-suburbs.ts`
- Modify: `lib/lead-discovery.ts`
- Test: `__tests__/lib/lead-discovery.test.ts`

**Interfaces:**
- Consumes: `getNicheFit`, `scoreLead`, `DEFAULT_NICHE_SCORE_THRESHOLD` from `lib/lead-scoring.ts` (Task 2); `auditWebsite` from `lib/lead-audit.ts` (Task 3).
- Produces: `SYDNEY_SUBURBS: string[]` (exported config array); `discoverLeads()` gains a `pool: 'website' | 'automation'` field on `LeadDiscoveryConfig` and stores `pool`, `niche_score`, `pitch_angle`, `audit_signals` on inserted rows — consumed by Task 5 (API route) and Task 6 (dashboard).

- [ ] **Step 1: Create the suburb config**

```ts
/**
 * Sydney suburb seed list for AU lead discovery.
 * Starting set — expand as discovery yield data comes in.
 */
export const SYDNEY_SUBURBS: string[] = [
  'Sydney CBD, NSW',
  'Parramatta, NSW',
  'Bondi, NSW',
  'Chatswood, NSW',
  'Newtown, NSW',
]
```

- [ ] **Step 2: Write the failing tests for pool-aware discovery**

```ts
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
    expect(insertedRows.length).toBe(0)
  })

  it('stores scored leads with pool, niche_score, pitch_angle, audit_signals', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
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
    expect(insertedRows[0].pool).toBe('automation')
    expect(insertedRows[0].niche_score).toBeGreaterThanOrEqual(40)
    expect(typeof insertedRows[0].pitch_angle).toBe('string')
    expect(insertedRows[0].audit_signals).toBeTruthy()
  })

  it('drops leads scoring below the threshold', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
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

    await expect(discoverLeads({
      query: 'hair salon', location: 'Chatswood, NSW',
      industry: 'hair salon', entries: 10, pool: 'automation',
    })).rejects.toThrow(/All found businesses/)

    expect(insertedRows.length).toBe(0)
  })
})

describe('discoverLeads pool=website (default, unchanged behavior)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not set niche_score/pitch_angle/audit_signals for website pool', async () => {
    const insertedRows: any[] = []
    ;(createAdminClient as any).mockReturnValue(makeSupabaseMock(insertedRows))
    ;(paginatedSearch as any).mockImplementation(async (cfg: any) => {
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
    expect(insertedRows[0].pool).toBe('website')
    expect(insertedRows[0].niche_score).toBeNull()
    expect(auditWebsite).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/lead-discovery.test.ts`
Expected: FAIL — `pool` config field not recognized by `LeadDiscoveryConfig`, no automation branch exists yet.

- [ ] **Step 4: Modify `lib/lead-discovery.ts`**

Replace the full file with:

```ts
/**
 * Lead Discovery Module
 *
 * Fetches Google Places results and saves them to lead_lists for
 * cold-calling outreach. Unlike lib/discovery.ts (batches + projects
 * for site generation), this module only stores contact data.
 *
 * Two pools:
 * - 'website': businesses with no website (original behavior)
 * - 'automation': businesses WITH a website, scored for AI-automation fit
 *   via lib/lead-scoring.ts + lib/lead-audit.ts
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  requireApiKey, buildFallbackQuery, paginatedSearch,
  type PlaceResult, type PaginatedSearchConfig,
} from '@/lib/google-places'
import { scoreLead, DEFAULT_NICHE_SCORE_THRESHOLD } from '@/lib/lead-scoring'
import { auditWebsite } from '@/lib/lead-audit'

export interface LeadDiscoveryConfig {
  query: string
  location: string
  industry: string
  entries: number
  skipWithWebsite?: boolean
  pool?: 'website' | 'automation'
  nicheScoreThreshold?: number
}

export interface LeadDiscoveryResult {
  batchId: string
  savedCount: number
  skippedCount: number
  totalFetched: number
}

interface ScoredLead {
  place: PlaceResult
  nicheScore: number
  pitchAngle: string
  auditSignals: Record<string, unknown>
}

async function scoreAutomationCandidates(
  places: PlaceResult[],
  industry: string,
  threshold: number,
): Promise<ScoredLead[]> {
  const scored: ScoredLead[] = []

  for (const place of places) {
    const websiteUrl = place.websiteUri
    if (!websiteUrl) continue

    const signals = await auditWebsite(
      websiteUrl,
      place.userRatingCount || 0,
      0, // review_velocity_30d: Google Places search doesn't return review timestamps;
         // busy-signal scoring relies on review_count only until a richer data source is added
    )
    const result = scoreLead(industry, signals)
    if (!result || result.score < threshold) continue

    scored.push({ place, nicheScore: result.score, pitchAngle: result.pitchAngle, auditSignals: signals })
  }

  return scored
}

/**
 * Discover leads via Google Places and save to lead_lists.
 * @throws Error if API key missing, API/DB fails.
 */
export async function discoverLeads(config: LeadDiscoveryConfig): Promise<LeadDiscoveryResult> {
  const apiKey = requireApiKey()
  const maxResults = Math.min(Math.max(config.entries, 1), 100)
  const primaryQuery = `${config.query || config.industry} in ${config.location}`
  const pool = config.pool || 'website'
  // Automation pool needs businesses WITH websites, so never skip them.
  const skipWithWebsite = pool === 'automation' ? false : (config.skipWithWebsite !== false)
  const threshold = config.nicheScoreThreshold ?? DEFAULT_NICHE_SCORE_THRESHOLD
  const supabase = createAdminClient()
  const MAX_API_PAGES = 20
  const batchId = crypto.randomUUID()

  const counters: PaginatedSearchConfig['counters'] = {
    validPlaces: [], totalFetched: 0, skippedFiltered: 0, pagesFetched: 0,
  }
  const seenPlaceIds = new Set<string>()

  const dedupFn = async (placeIds: string[]): Promise<Set<string>> => {
    const excludeIds = new Set<string>()
    const { data: existing } = await supabase
      .from('lead_lists').select('place_id').in('place_id', placeIds)
    if (existing) {
      for (const lead of existing) { if (lead.place_id) excludeIds.add(lead.place_id) }
    }
    return excludeIds
  }

  const base: Omit<PaginatedSearchConfig, 'searchQuery' | 'label'> = {
    apiKey, maxResults, skipWithWebsite, seenPlaceIds, dedupFn, counters, maxApiPages: MAX_API_PAGES,
  }

  await paginatedSearch({ ...base, searchQuery: primaryQuery, label: 'Primary' })

  if (counters.validPlaces.length < maxResults && counters.pagesFetched < MAX_API_PAGES) {
    const fq = buildFallbackQuery(config)
    if (fq && fq !== primaryQuery) {
      logger.discovery.info('Lead fallback: primary under-returned', { found: counters.validPlaces.length, target: maxResults, fallbackQuery: fq })
      await paginatedSearch({ ...base, searchQuery: fq, label: 'Fallback' })
    }
  }

  let validPlaces = counters.validPlaces
  if (validPlaces.length > maxResults) validPlaces = validPlaces.slice(0, maxResults)

  logger.discovery.info('Lead discovery complete', {
    pool, valid: validPlaces.length, totalFetched: counters.totalFetched,
    skippedFiltered: counters.skippedFiltered, pagesFetched: counters.pagesFetched,
  })

  if (validPlaces.length === 0) {
    throw new Error(
      counters.totalFetched === 0
        ? 'No places found for this query.'
        : 'All found businesses already have websites or were previously saved as leads.',
    )
  }

  let leadsToInsert: Record<string, unknown>[]

  if (pool === 'automation') {
    const scored = await scoreAutomationCandidates(validPlaces, config.industry, threshold)
    if (scored.length === 0) {
      throw new Error('All found businesses already have websites or were previously saved as leads.')
    }
    leadsToInsert = scored.map(({ place, nicheScore, pitchAngle, auditSignals }) => ({
      batch_id: batchId,
      place_id: place.id || null,
      business_name: place.displayName?.text || 'Unknown Business',
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
      email: null,
      address: place.formattedAddress || null,
      website: place.websiteUri || null,
      maps_url: place.formattedAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((place.displayName?.text || '') + ' ' + (place.formattedAddress || ''))}`
        : null,
      rating: place.rating || null,
      review_count: place.userRatingCount || null,
      industry: config.industry || null,
      location: config.location || null,
      raw_data: place,
      pool: 'automation',
      niche_score: nicheScore,
      pitch_angle: pitchAngle,
      audit_signals: auditSignals,
    }))
  } else {
    leadsToInsert = validPlaces.map((place: PlaceResult) => ({
      batch_id: batchId,
      place_id: place.id || null,
      business_name: place.displayName?.text || 'Unknown Business',
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
      email: null,
      address: place.formattedAddress || null,
      website: place.websiteUri || null,
      maps_url: place.formattedAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((place.displayName?.text || '') + ' ' + (place.formattedAddress || ''))}`
        : null,
      rating: place.rating || null,
      review_count: place.userRatingCount || null,
      industry: config.industry || null,
      location: config.location || null,
      raw_data: place,
      pool: 'website',
    }))
  }

  const { error: insertError } = await supabase.from('lead_lists').insert(leadsToInsert)
  if (insertError) throw new Error(`Failed to save leads: ${insertError.message}`)

  logger.discovery.info('Leads saved', { pool, count: leadsToInsert.length, batchId })
  return {
    batchId,
    savedCount: leadsToInsert.length,
    skippedCount: counters.skippedFiltered,
    totalFetched: counters.totalFetched,
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/lead-discovery.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: all existing tests still PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/au-suburbs.ts lib/lead-discovery.ts __tests__/lib/lead-discovery.test.ts
git commit -m "feat: add automation pool scoring to lead discovery, Sydney suburb config"
```

---

### Task 5: API route pool parameter

**Files:**
- Modify: `app/api/leads/discover/route.ts`

**Interfaces:**
- Consumes: `discoverLeads()` from `lib/lead-discovery.ts` (Task 4), now accepting `pool`.
- Produces: `POST /api/leads/discover` accepts `pool: 'website' | 'automation'` in the request body, defaults to `'website'` when omitted (preserves existing callers).

- [ ] **Step 1: Modify the route handler**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { discoverLeads } from '@/lib/lead-discovery'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, location, industry, entries, skipWithWebsite, pool } = body

    if (!query && !industry) {
      return NextResponse.json(
        { error: 'Either query or industry is required' },
        { status: 400 },
      )
    }

    const clampedEntries = Math.min(
      Math.max(typeof entries === 'number' ? entries : 20, 1),
      100,
    )

    const resolvedPool = pool === 'automation' ? 'automation' : 'website'

    const result = await discoverLeads({
      query: query || industry,
      location: location || '',
      industry: industry || '',
      entries: clampedEntries,
      skipWithWebsite: skipWithWebsite === true,
      pool: resolvedPool,
    })

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      savedCount: result.savedCount,
      skippedCount: result.skippedCount,
      totalFetched: result.totalFetched,
      pool: resolvedPool,
    })
  } catch (error) {
    console.error('[LeadDiscovery] API error:', error)
    const message =
      error instanceof Error ? error.message : 'Internal Server Error'

    if (
      message.includes('No places found') ||
      message.includes('All found businesses')
    ) {
      return NextResponse.json({
        success: false,
        message,
        savedCount: 0,
      })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Manually verify the route still handles the existing (no-pool) request shape**

Run: `npm run dev` in one terminal, then in another:
```bash
curl -s -X POST http://localhost:3000/api/leads/discover \
  -H 'Content-Type: application/json' \
  -d '{"industry":"cafe","location":"Newtown, NSW","entries":3}' | head -c 500
```
Expected: JSON response with `"success":true` and `"pool":"website"` (assuming `GOOGLE_PLACES_API_KEY` is configured locally; if not, expect a clear 500 error naming the missing key, not a crash).

- [ ] **Step 3: Commit**

```bash
git add app/api/leads/discover/route.ts
git commit -m "feat: accept pool parameter on lead discovery API"
```

---

### Task 6: Dashboard pool toggle and automation columns

**Files:**
- Modify: `app/(admin)/dashboard/leads/page.tsx`
- Modify: `components/dashboard/leads-page-client.tsx`

**Interfaces:**
- Consumes: `lead_lists.pool`, `niche_score`, `pitch_angle`, `audit_signals` columns (Task 1).
- Produces: `/dashboard/leads?date=...&pool=website|automation` — pool defaults to `website` when the searchParam is absent, matching the existing `date` searchParam pattern.

- [ ] **Step 1: Modify `app/(admin)/dashboard/leads/page.tsx` to read and filter by pool**

```tsx
export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { LeadsPageClient } from '@/components/dashboard/leads-page-client'

interface LeadsPageProps {
  searchParams: Promise<{ date?: string; pool?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const today = new Date()
  const selectedDate = params.date || format(today, 'yyyy-MM-dd')
  const selectedDateObj = parseISO(selectedDate)
  const selectedPool = params.pool === 'automation' ? 'automation' : 'website'

  const supabase = createAdminClient()
  const dayStart = startOfDay(selectedDateObj).toISOString()
  const dayEnd = endOfDay(selectedDateObj).toISOString()

  let batches: Array<{
    batch_id: string
    query: string
    location: string
    lead_count: number
    created_at: string
    leads: Array<{
      id: string
      business_name: string
      email: string | null
      phone: string | null
      address: string | null
      location: string | null
      maps_url: string | null
      website: string | null
      raw_data: Record<string, unknown> | null
      niche_score: number | null
      pitch_angle: string | null
      audit_signals: Record<string, unknown> | null
    }>
  }> = []

  try {
    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('pool', selectedPool)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const batchMap = new Map<string, (typeof batches)[number]>()

      for (const row of data) {
        const lead = {
          id: row.id,
          business_name: row.business_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          location: row.location,
          maps_url: row.maps_url,
          website: row.website as string | null,
          raw_data: row.raw_data as Record<string, unknown> | null,
          niche_score: row.niche_score,
          pitch_angle: row.pitch_angle,
          audit_signals: row.audit_signals as Record<string, unknown> | null,
        }

        const existing = batchMap.get(row.batch_id)
        if (existing) {
          existing.leads.push(lead)
          existing.lead_count = existing.leads.length
          if (row.created_at < existing.created_at) {
            existing.created_at = row.created_at
          }
        } else {
          batchMap.set(row.batch_id, {
            batch_id: row.batch_id,
            query: row.industry || 'Unknown',
            location: row.location || 'Unknown',
            lead_count: 1,
            created_at: row.created_at,
            leads: [lead],
          })
        }
      }

      batches = Array.from(batchMap.values()).map((batch) => ({
        ...batch,
        leads: selectedPool === 'automation'
          ? batch.leads.sort((a, b) => (b.niche_score || 0) - (a.niche_score || 0))
          : batch.leads.sort((a, b) => a.business_name.localeCompare(b.business_name)),
      }))
    }
  } catch (e) {
    console.error('Error fetching lead lists:', e)
  }

  return <LeadsPageClient batches={batches} selectedDate={selectedDate} selectedPool={selectedPool} />
}
```

- [ ] **Step 2: Add pool toggle to `components/dashboard/leads-page-client.tsx`**

Update the `LeadRow` interface, `LeadsPageClientProps`, and add a toggle control. Read the current file at `components/dashboard/leads-page-client.tsx` first to find the exact insertion points for the header controls (near the existing date picker button, around the top of the returned JSX), then apply these changes:

```tsx
interface LeadRow {
  id: string
  business_name: string
  email: string | null
  phone: string | null
  address: string | null
  location: string | null
  maps_url: string | null
  website: string | null
  raw_data: Record<string, unknown> | null
  niche_score: number | null
  pitch_angle: string | null
  audit_signals: Record<string, unknown> | null
}
```

```tsx
interface LeadsPageClientProps {
  batches: LeadBatch[]
  selectedDate: string
  selectedPool: 'website' | 'automation'
}

export function LeadsPageClient({ batches, selectedDate, selectedPool }: LeadsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // ...existing state...

  function handlePoolChange(pool: 'website' | 'automation') {
    startTransition(() => {
      router.push(`/dashboard/leads?date=${selectedDate}&pool=${pool}`)
    })
  }
```

Add the toggle UI near the top of the rendered JSX, alongside the existing date controls:

```tsx
<div className="flex items-center gap-2 rounded-lg border p-1">
  <button
    onClick={() => handlePoolChange('website')}
    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
      selectedPool === 'website' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
    }`}
  >
    Website Leads
  </button>
  <button
    onClick={() => handlePoolChange('automation')}
    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
      selectedPool === 'automation' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
    }`}
  >
    AI Automation Leads
  </button>
</div>
```

Add Score/Pitch columns conditionally when `selectedPool === 'automation'` in the lead table body — locate the existing `<table>`/row-rendering block in the file and add, inside the row markup, when `selectedPool === 'automation'`:

```tsx
{selectedPool === 'automation' && (
  <>
    <td className="px-4 py-2 text-sm font-medium">{lead.niche_score ?? '—'}</td>
    <td className="px-4 py-2 text-sm text-muted-foreground max-w-xs truncate" title={lead.pitch_angle ?? ''}>
      {lead.pitch_angle ?? '—'}
    </td>
  </>
)}
```

And the matching `<th>` headers, conditional on `selectedPool === 'automation'`:

```tsx
{selectedPool === 'automation' && (
  <>
    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Score</th>
    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Pitch Angle</th>
  </>
)}
```

- [ ] **Step 3: Add Call/Email/WhatsApp row actions**

In the same row markup, add an actions cell reusing existing lead phone/business_name data (no new tracking table — these open native clients, per spec):

```tsx
<td className="px-4 py-2 text-sm">
  <div className="flex items-center gap-2">
    {lead.phone && (
      <a
        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          `Hi ${lead.business_name}, ${lead.pitch_angle || "I'd love to chat about your website."}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-green-600 hover:underline"
      >
        WhatsApp
      </a>
    )}
    {lead.email && (
      <a
        href={`mailto:${lead.email}?subject=${encodeURIComponent(`Quick idea for ${lead.business_name}`)}&body=${encodeURIComponent(lead.pitch_angle || '')}`}
        className="text-xs text-blue-600 hover:underline"
      >
        Email
      </a>
    )}
  </div>
</td>
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no new errors in the two modified files.

- [ ] **Step 5: Manual verification with the dev server**

Run: `npm run dev`, then navigate to `http://localhost:3000/dashboard/leads?pool=automation` in a browser.
Expected: page loads, toggle shows "AI Automation Leads" active, table shows Score/Pitch Angle columns (empty if no automation leads discovered yet locally — that's expected without running a real discovery call).

- [ ] **Step 6: Commit**

```bash
git add "app/(admin)/dashboard/leads/page.tsx" components/dashboard/leads-page-client.tsx
git commit -m "feat: add pool toggle, score/pitch columns, and WhatsApp/email actions to leads dashboard"
```

---

## Self-Review Notes

- **Spec coverage:** dual-pool schema (Task 1), niche scoring (Task 2), lightweight audit — no headless browser (Task 3), Sydney suburb config + discovery integration (Task 4), API pool param (Task 5), dashboard toggle + score/pitch columns + channel actions (Task 6). Call-log integration for the "Call" action reuses the existing sales call-log modal already wired into the sales CRM — no new work needed there since `call_logs` already keys off `project_id`, not `lead_lists.id`; the leads dashboard's "Call" action is a phone-number `tel:` link, not a `call_logs` insert (that only happens once a lead is converted into a generated `project`).
- **Type consistency:** `AuditSignals` defined once in `lib/lead-scoring.ts`, imported (not redefined) in `lib/lead-audit.ts`. `pool` typed as the union `'website' | 'automation'` everywhere it's threaded through.
- **Threshold configurability:** `DEFAULT_NICHE_SCORE_THRESHOLD = 40` exported from `lib/lead-scoring.ts`, overridable via `LeadDiscoveryConfig.nicheScoreThreshold` — satisfies "must be configurable."
