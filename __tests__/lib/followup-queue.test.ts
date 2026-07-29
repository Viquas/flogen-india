import { describe, it, expect } from 'vitest'
import {
  isEmailFollowupDue,
  isAbandonerActive,
  FOLLOWUP_MIN_GAP_DAYS,
  FOLLOWUP_STALE_DAYS,
  type ProjectEmailAgg,
  type AbandonerClaim,
} from '@/lib/sales/followup-queue'

const NOW = 1_800_000_000_000
const DAY = 86_400_000
const daysAgo = (n: number) => NOW - n * DAY

function agg(overrides: Partial<ProjectEmailAgg> = {}): ProjectEmailAgg {
  return { projectId: 'p1', outCount: 1, lastOutMs: daysAgo(5), hasInbound: false, ...overrides }
}

describe('isEmailFollowupDue', () => {
  const noPaid = new Set<string>()

  it('is due when emailed once, 5 days ago, no reply, not paid', () => {
    expect(isEmailFollowupDue(agg(), NOW, noPaid)).toBe(true)
  })

  it('is NOT due before the minimum gap', () => {
    expect(isEmailFollowupDue(agg({ lastOutMs: daysAgo(FOLLOWUP_MIN_GAP_DAYS - 1) }), NOW, noPaid)).toBe(false)
  })

  it('is NOT due once past the stale cutoff', () => {
    expect(isEmailFollowupDue(agg({ lastOutMs: daysAgo(FOLLOWUP_STALE_DAYS + 1) }), NOW, noPaid)).toBe(false)
  })

  it('is NOT due after the max number of sends', () => {
    expect(isEmailFollowupDue(agg({ outCount: 3 }), NOW, noPaid)).toBe(false)
  })

  it('is NOT due when the lead has replied', () => {
    expect(isEmailFollowupDue(agg({ hasInbound: true }), NOW, noPaid)).toBe(false)
  })

  it('is NOT due when the project already converted (paid)', () => {
    expect(isEmailFollowupDue(agg(), NOW, new Set(['p1']))).toBe(false)
  })

  it('is NOT due when never emailed', () => {
    expect(isEmailFollowupDue(agg({ outCount: 0, lastOutMs: null }), NOW, noPaid)).toBe(false)
  })
})

describe('isAbandonerActive', () => {
  const noPaid = new Set<string>()
  const claim = (o: Partial<AbandonerClaim> = {}): AbandonerClaim => ({
    projectId: 'p1', clientEmail: null, expiresAtMs: daysAgo(1), ...o,
  })

  it('drops a checkout abandoner (no email) once its window lapses', () => {
    expect(isAbandonerActive(claim({ expiresAtMs: daysAgo(1) }), NOW, noPaid)).toBe(false)
  })

  it('keeps a checkout abandoner while still in-window', () => {
    expect(isAbandonerActive(claim({ expiresAtMs: NOW + DAY }), NOW, noPaid)).toBe(true)
  })

  it('KEEPS a manual-payment interest lead even after the window lapses', () => {
    // The regression: an interest lead (has email) must not vanish from the queue.
    expect(isAbandonerActive(claim({ clientEmail: 'owner@shop.com', expiresAtMs: daysAgo(30) }), NOW, noPaid)).toBe(true)
  })

  it('never shows a project that already converted', () => {
    expect(isAbandonerActive(claim({ clientEmail: 'owner@shop.com' }), NOW, new Set(['p1']))).toBe(false)
  })
})
