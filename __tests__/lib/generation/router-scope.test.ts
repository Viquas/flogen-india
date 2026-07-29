import { describe, it, expect } from 'vitest'
import { shouldCronSkip, CLAUDE_SCOPE_GRACE_MS, CLAUDE_STUCK_MS } from '@/lib/generation/router-scope'

describe('shouldCronSkip', () => {
    const nowMs = Date.parse('2026-07-08T00:00:00.000Z')

    it('skips (true) when claude is live, project is high-value, and job is young', () => {
        const job = { project_id: 'p1', created_at: new Date(nowMs - 2 * 60 * 1000).toISOString() } // 2min old
        const result = shouldCronSkip(job, {
            claudeLive: true,
            nowMs,
            highValueProjectIds: new Set(['p1']),
        })
        expect(result).toBe(true)
    })

    it('takes (false) when claude is live, project is high-value, but job is old (safety valve)', () => {
        const job = { project_id: 'p1', created_at: new Date(nowMs - 12 * 60 * 1000).toISOString() } // 12min old
        const result = shouldCronSkip(job, {
            claudeLive: true,
            nowMs,
            highValueProjectIds: new Set(['p1']),
        })
        expect(result).toBe(false)
    })

    it('takes (false) when claude is live but the project is not in the high-value set', () => {
        const job = { project_id: 'p2', created_at: new Date(nowMs - 2 * 60 * 1000).toISOString() }
        const result = shouldCronSkip(job, {
            claudeLive: true,
            nowMs,
            highValueProjectIds: new Set(['p1']),
        })
        expect(result).toBe(false)
    })

    it('takes (false) when claude is not live, regardless of set or age', () => {
        const job = { project_id: 'p1', created_at: new Date(nowMs - 2 * 60 * 1000).toISOString() }
        const result = shouldCronSkip(job, {
            claudeLive: false,
            nowMs,
            highValueProjectIds: new Set(['p1']),
        })
        expect(result).toBe(false)
    })

    it('exposes the documented grace and stuck constants', () => {
        expect(CLAUDE_SCOPE_GRACE_MS).toBe(10 * 60 * 1000)
        expect(CLAUDE_STUCK_MS).toBe(15 * 60 * 1000)
    })
})
