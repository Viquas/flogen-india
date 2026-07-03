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
