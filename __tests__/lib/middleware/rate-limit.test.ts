import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The rate-limit module has a top-level setInterval for cleanup.
// Use fake timers so it doesn't leak into other tests.
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  // Re-import gives a fresh module store each test file run,
  // but within one file the store persists — we use unique identifiers per test.
})

describe('checkRateLimit', () => {
  it('allows the first request within the limit', async () => {
    const { checkRateLimit } = await import('@/lib/middleware/rate-limit')
    const result = checkRateLimit('test-first-request', { limit: 5, windowMs: 10_000 })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.resetAt).toBeGreaterThan(Date.now() - 1)
  })

  it('blocks requests that exceed the limit', async () => {
    const { checkRateLimit } = await import('@/lib/middleware/rate-limit')
    const config = { limit: 3, windowMs: 10_000 }
    const id = 'test-exceed-limit'

    checkRateLimit(id, config) // 1
    checkRateLimit(id, config) // 2
    checkRateLimit(id, config) // 3 — at limit

    const blocked = checkRateLimit(id, config) // 4 — over limit
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('tracks remaining count accurately', async () => {
    const { checkRateLimit } = await import('@/lib/middleware/rate-limit')
    const config = { limit: 5, windowMs: 10_000 }
    const id = 'test-remaining-count'

    const r1 = checkRateLimit(id, config)
    expect(r1.remaining).toBe(4)

    const r2 = checkRateLimit(id, config)
    expect(r2.remaining).toBe(3)

    const r3 = checkRateLimit(id, config)
    expect(r3.remaining).toBe(2)
  })

  it('resets the window after windowMs elapses', async () => {
    const { checkRateLimit } = await import('@/lib/middleware/rate-limit')
    const config = { limit: 2, windowMs: 10_000 }
    const id = 'test-window-reset'

    checkRateLimit(id, config) // 1
    checkRateLimit(id, config) // 2 — at limit

    const blocked = checkRateLimit(id, config) // 3 — over limit
    expect(blocked.allowed).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(11_000)

    const afterReset = checkRateLimit(id, config)
    expect(afterReset.allowed).toBe(true)
    expect(afterReset.remaining).toBe(1)
  })

  it('isolates different identifiers', async () => {
    const { checkRateLimit } = await import('@/lib/middleware/rate-limit')
    const config = { limit: 1, windowMs: 10_000 }

    const a = checkRateLimit('user-a-isolation', config)
    expect(a.allowed).toBe(true)

    // user-a is now at limit
    const a2 = checkRateLimit('user-a-isolation', config)
    expect(a2.allowed).toBe(false)

    // user-b should be unaffected
    const b = checkRateLimit('user-b-isolation', config)
    expect(b.allowed).toBe(true)
  })
})
