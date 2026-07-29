/**
 * Niche fit + audit-gap scoring for the "automation" lead pool.
 * A lead's niche_score = niche_fit_weight (0-40) + audit_gap_points (0-40)
 * + busy_signal_points (0-20), clamped to [0, 100].
 */

export interface AuditSignals {
  /**
   * Whether we actually loaded the site. A bot-block, timeout, or DNS failure is
   * indistinguishable from a genuinely broken site, so when this is false we must
   * NOT assert specific technical faults (no SSL, not mobile-friendly, …) — doing
   * so puts false, easily-disproven claims into cold outreach.
   */
  reachable: boolean
  has_booking: boolean
  has_chat: boolean
  mobile_friendly: boolean
  has_ssl: boolean
  page_load_ms: number | null
  review_count: number
  review_velocity_30d: number
  // SEO / on-page signals, best-effort from raw HTML. Optional: audits recorded
  // before these were added won't have them, and they're only populated when
  // `reachable` is true. Used for richer, credible outreach claims — not scoring.
  has_title?: boolean
  has_meta_description?: boolean
  h1_count?: number
  /** Fraction of <img> tags carrying a non-empty alt attribute (0..1), null if no images. */
  img_alt_coverage?: number | null
  has_og_tags?: boolean
}

interface NicheFit {
  weight: number
  pitchTemplate: string
}

export const NICHE_FIT_TABLE: Record<string, NicheFit> = {
  'plumber': { weight: 40, pitchTemplate: 'missed-call text-back' },
  'electrician': { weight: 40, pitchTemplate: 'missed-call text-back' },
  'locksmith': { weight: 40, pitchTemplate: 'missed-call text-back' },
  'dental clinic': { weight: 40, pitchTemplate: 'AI booking and appointment reminders' },
  'dentist': { weight: 40, pitchTemplate: 'AI booking and appointment reminders' },
  'physiotherapist': { weight: 40, pitchTemplate: 'AI booking and appointment reminders' },
  'chiropractor': { weight: 40, pitchTemplate: 'AI booking and appointment reminders' },
  'hair salon': { weight: 32, pitchTemplate: 'AI booking' },
  'barber': { weight: 32, pitchTemplate: 'AI booking' },
  'restaurant': { weight: 24, pitchTemplate: 'a FAQ and table-booking bot' },
  'cafe': { weight: 24, pitchTemplate: 'a FAQ and table-booking bot' },
  'real estate agent': { weight: 24, pitchTemplate: 'a lead-capture chatbot' },
  'veterinarian': { weight: 36, pitchTemplate: 'AI booking' },
  'gym': { weight: 24, pitchTemplate: 'a class-booking bot' },
  'fitness studio': { weight: 24, pitchTemplate: 'a class-booking bot' },
}

export const DEFAULT_NICHE_SCORE_THRESHOLD = 40

/**
 * Google Places `primaryType`/`types` that map to a niche table key but don't match
 * after a plain underscore→space normalization. Lets us score off the Google-verified
 * category even when the rep's typed search string never matched the table.
 */
const GOOGLE_TYPE_ALIASES: Record<string, string> = {
  real_estate_agency: 'real estate agent',
  veterinary_care: 'veterinarian',
  fitness_center: 'fitness studio',
  barber_shop: 'barber',
  hair_care: 'hair salon',
  dentist: 'dentist',
}

export function getNicheFit(category: string): { weight: number; pitchTemplate: string } | null {
  const fit = NICHE_FIT_TABLE[category.trim().toLowerCase()]
  if (!fit) return null
  return { weight: fit.weight, pitchTemplate: fit.pitchTemplate }
}

/**
 * Resolve a niche-table category from the rep's typed search term, falling back to
 * the Google-verified category tags. Fixes false negatives where the typed string
 * ("plumbing services") misses the table but the verified type ("plumber") matches.
 * Returns a canonical NICHE_FIT_TABLE key, or null if nothing matches.
 */
export function resolveNicheCategory(typedCategory: string, googleTypes: string[] = []): string | null {
  const typed = typedCategory.trim().toLowerCase()
  if (NICHE_FIT_TABLE[typed]) return typed
  for (const raw of googleTypes) {
    if (!raw) continue
    const alias = GOOGLE_TYPE_ALIASES[raw]
    if (alias && NICHE_FIT_TABLE[alias]) return alias
    const norm = raw.replace(/_/g, ' ').trim().toLowerCase()
    if (NICHE_FIT_TABLE[norm]) return norm
  }
  return null
}

function auditGapPoints(signals: AuditSignals): { points: number; gaps: string[] } {
  // Never claim specific technical gaps about a site we couldn't load — see AuditSignals.reachable.
  if (signals.reachable === false) {
    return { points: 0, gaps: [] }
  }
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
  const score = Math.max(0, Math.min(100, fit.weight + gapPoints + busyPoints))

  let pitchAngle: string
  if (signals.reachable === false) {
    // Couldn't verify the site — lean on demand signals, never assert a fault we didn't see.
    pitchAngle = signals.review_count > 0
      ? `${signals.review_count} reviews and steady demand — a strong fit for ${fit.pitchTemplate}.`
      : `A strong fit for ${fit.pitchTemplate}.`
  } else if (gaps.length > 0) {
    pitchAngle = signals.review_velocity_30d > 0
      ? `${signals.review_count} reviews (${signals.review_velocity_30d} in the last 30 days), ${gaps[0]} — that's ${fit.pitchTemplate} territory.`
      : `${gaps[0]}${gaps.length > 1 ? `, and ${gaps.length - 1} other gap${gaps.length > 2 ? 's' : ''}` : ''} — a good fit for ${fit.pitchTemplate}.`
  } else {
    pitchAngle = `Solid online presence already — worth a conversation about ${fit.pitchTemplate} to handle overflow.`
  }

  return { score, pitchAngle }
}
