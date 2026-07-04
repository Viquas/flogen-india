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
import { scoreLead, getNicheFit, DEFAULT_NICHE_SCORE_THRESHOLD, type AuditSignals } from '@/lib/lead-scoring'
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
  /**
   * Discriminates the automation pool's zero-qualifying-leads outcomes.
   * - 'out_of_niche': no fetched business's category was in the niche-fit table.
   * - 'below_threshold': in-niche candidates were scored but none cleared the threshold.
   * - null: leads qualified and were saved (or this is the website pool).
   */
  reason?: 'out_of_niche' | 'below_threshold' | null
}

interface ScoredLead {
  place: PlaceResult
  nicheScore: number
  pitchAngle: string
  auditSignals: AuditSignals
}

interface ScoreAutomationResult {
  scored: ScoredLead[]
  /** True if at least one candidate had a niche fit and went through scoring. */
  anyAttempted: boolean
}

async function scoreAutomationCandidates(
  places: PlaceResult[],
  industry: string,
  threshold: number,
): Promise<ScoreAutomationResult> {
  const scored: ScoredLead[] = []
  let anyAttempted = false

  // Businesses in categories outside the niche fit table are not
  // automation-fit prospects at all — skip them without attempting an
  // audit or counting them toward the "everything scored too low" case.
  if (!getNicheFit(industry)) {
    return { scored, anyAttempted: false }
  }

  for (const place of places) {
    const websiteUrl = place.websiteUri
    if (!websiteUrl) continue

    anyAttempted = true
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

  return { scored, anyAttempted }
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
  // Website pool exists to sell websites → default to ONLY businesses without one.
  const skipWithWebsite = pool === 'automation' ? false : (config.skipWithWebsite ?? true)
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
    const { scored, anyAttempted } = await scoreAutomationCandidates(validPlaces, config.industry, threshold)
    if (scored.length === 0) {
      // Distinguish "this industry has no niche fit at all" from "candidates
      // were audited and scored but none cleared the threshold" — both are
      // valid zero-result outcomes, not failures, so both resolve. Callers
      // can branch on `reason` if they need to tell them apart.
      const reason = anyAttempted ? 'below_threshold' : 'out_of_niche'
      logger.discovery.info('Leads saved', { pool, count: 0, batchId, reason })
      return {
        batchId, savedCount: 0, skippedCount: counters.skippedFiltered,
        totalFetched: counters.totalFetched, reason,
      }
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
      niche_score: null,
      pitch_angle: null,
      audit_signals: null,
    }))
  }

  const { error: insertError } = await supabase.from('lead_lists').insert(leadsToInsert as any)
  if (insertError) throw new Error(`Failed to save leads: ${insertError.message}`)

  logger.discovery.info('Leads saved', { pool, count: leadsToInsert.length, batchId })
  return {
    batchId,
    savedCount: leadsToInsert.length,
    skippedCount: counters.skippedFiltered,
    totalFetched: counters.totalFetched,
    reason: null,
  }
}
