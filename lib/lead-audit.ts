/**
 * Lightweight website audit for the "automation" lead pool.
 * Fetches raw HTML only — no headless browser, no JS execution.
 *
 * A fetch failure means the site is UNREACHABLE (bot-block, timeout, DNS, non-2xx) —
 * NOT that every gap is present. We surface `reachable: false` so downstream scoring
 * and outreach never assert false technical faults about a site we couldn't load.
 */
import type { AuditSignals } from '@/lib/lead-scoring'

// Slow sites are the exact prospects a speed pitch targets — give them room to
// respond rather than aborting at 5s and mislabelling them as unreachable.
const FETCH_TIMEOUT_MS = 8000

// Many small-business sites sit behind basic bot protection (Cloudflare, Wordfence)
// that 403s an anonymous fetch. A realistic browser UA avoids false "unreachable".
const AUDIT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const BOOKING_SIGNATURES = [
  'calendly.com', 'cal.com/embed', 'fresha.com', 'squareup.com/appointments',
  'vagaro.com', 'booksy.com', 'setmore.com',
]

const CHAT_SIGNATURES = [
  'intercom.io', 'tawk.to', 'crisp.chat', 'js.driftt.com', 'tidio.co',
]

/** True when a non-empty <title> is present. */
function hasNonEmptyTitle(html: string): boolean {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return !!(m && m[1].trim())
}

/**
 * True when a <meta name="description"> tag exists with non-empty content.
 * Scans each meta tag independently so attribute order (name-then-content or
 * content-then-name) doesn't cause a false "missing" — a false SEO claim in a
 * cold email is exactly what we're avoiding.
 */
function hasMetaDescription(html: string): boolean {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || []
  return metaTags.some(
    (tag) =>
      /name\s*=\s*["']description["']/i.test(tag) &&
      /content\s*=\s*["']\s*\S[^"']*["']/i.test(tag),
  )
}

/** Fraction of <img> tags with a non-empty alt attribute; null when there are no images. */
function imgAltCoverage(html: string): number | null {
  const imgTags = html.match(/<img\b[^>]*>/gi) || []
  if (imgTags.length === 0) return null
  // "non-empty alt" = opening quote, optional whitespace, then a real char. Linear —
  // avoids the ambiguous [^"']*\S[^"']* form which can backtrack O(n^2) on a long
  // unterminated alt value.
  const withAlt = imgTags.filter((t) => /\balt\s*=\s*["']\s*[^\s"']/i.test(t)).length
  return withAlt / imgTags.length
}

async function fetchHtmlWithTimeout(url: string): Promise<{ html: string; loadMs: number; finalUrl: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const start = Date.now()

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': AUDIT_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
    })
    if (!response.ok) {
      return null
    }
    const html = await response.text()
    // response.url is the FINAL url after redirects — needed for an accurate
    // SSL check, since Places websiteUri is often http:// even when the site
    // 301s to https://.
    return { html, loadMs: Date.now() - start, finalUrl: response.url || url }
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
    // Unreachable — record it as such. Do NOT claim gaps we can't substantiate.
    return {
      reachable: false,
      has_booking: false,
      has_chat: false,
      mobile_friendly: false,
      has_ssl: false,
      page_load_ms: null,
      review_count: reviewCount,
      review_velocity_30d: reviewVelocity30d,
    }
  }

  const { html, loadMs, finalUrl } = fetched
  const lowerHtml = html.toLowerCase()

  return {
    reachable: true,
    has_booking: BOOKING_SIGNATURES.some(sig => lowerHtml.includes(sig)),
    has_chat: CHAT_SIGNATURES.some(sig => lowerHtml.includes(sig)),
    mobile_friendly: /<meta[^>]+name=["']viewport["']/i.test(html),
    // Use the post-redirect URL: an http:// site that redirects to https:// is
    // genuinely secure and must not be flagged as "no SSL".
    has_ssl: finalUrl.trim().toLowerCase().startsWith('https://'),
    page_load_ms: loadMs,
    review_count: reviewCount,
    review_velocity_30d: reviewVelocity30d,
    // SEO / on-page signals (best-effort HTML heuristics).
    has_title: hasNonEmptyTitle(html),
    has_meta_description: hasMetaDescription(html),
    h1_count: (html.match(/<h1[\s>]/gi) || []).length,
    img_alt_coverage: imgAltCoverage(html),
    has_og_tags: /<meta[^>]+property=["']og:/i.test(html),
  }
}
