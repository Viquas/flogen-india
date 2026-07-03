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
