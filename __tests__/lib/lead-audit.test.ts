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

  it('marks a fetch failure as unreachable (not "all gaps present")', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    const result = await auditWebsite('https://broken-example.com', 10, 2)
    expect(result.reachable).toBe(false)
    expect(result.page_load_ms).toBeNull()
  })

  it('marks a non-ok response as unreachable, ignoring body content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '<html><body><script src="https://assets.calendly.com/widget.js"></script></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.reachable).toBe(false)
    expect(result.page_load_ms).toBeNull()
  })

  it('marks a successful fetch as reachable', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.reachable).toBe(true)
  })

  it('detects a non-empty meta description regardless of attribute order', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        '<html><head><meta content="We are the best plumber in Bondi" name="description"><title>Bondi Plumbing</title></head><body><h1>Hi</h1></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.has_meta_description).toBe(true)
    expect(result.has_title).toBe(true)
    expect(result.h1_count).toBe(1)
  })

  it('flags a missing meta description and empty title', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><head><title>   </title></head><body></body></html>',
    } as Response)

    const result = await auditWebsite('https://example.com', 10, 2)
    expect(result.has_meta_description).toBe(false)
    expect(result.has_title).toBe(false)
    expect(result.h1_count).toBe(0)
  })

  it('computes image alt coverage (null when no images)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><img src="a.jpg" alt="a cat"><img src="b.jpg"></body></html>',
    } as Response)

    const withImgs = await auditWebsite('https://example.com', 10, 2)
    expect(withImgs.img_alt_coverage).toBe(0.5)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><p>no images</p></body></html>',
    } as Response)
    const noImgs = await auditWebsite('https://example.com', 10, 2)
    expect(noImgs.img_alt_coverage).toBeNull()
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
