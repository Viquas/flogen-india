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
