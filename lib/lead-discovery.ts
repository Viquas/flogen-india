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
  /**
   * When true, each saved lead is also promoted into a lightweight `projects`
   * row (status='lead') so it appears directly in the sales workspace. Only
   * leads with a phone number are promoted (a lead you can't call isn't a
   * workable sales lead). Used by rep-initiated discovery; the admin "Get List"
   * flow leaves this false and keeps leads in the staging table only.
   */
  promote?: boolean
  /** Rep who owns the discovered leads (soft ownership). Set on promoted projects. */
  assignedTo?: string
  /** Optional territory the discovery ran against. Set on promoted projects. */
  territoryId?: string
  /**
   * Optional map-selected area. When present, the Places search is biased to this
   * circle (radius clamped to 50 km) instead of relying on the location string.
   */
  circle?: { lat: number; lng: number; radiusKm: number }
}

export interface LeadDiscoveryResult {
  batchId: string
  savedCount: number
  skippedCount: number
  totalFetched: number
  /** Number of leads promoted into `projects` (0 unless config.promote). */
  promotedCount: number
  /**
   * Discriminates the automation pool's zero-qualifying-leads outcomes.
   * - 'out_of_niche': no fetched business's category was in the niche-fit table.
   * - 'below_threshold': in-niche candidates were scored but none cleared the threshold.
   * - null: leads qualified and were saved (or this is the website pool).
   */
  reason?: 'out_of_niche' | 'below_threshold' | null
}

/** A discovered business plus its (optional) automation scoring, unified across pools. */
interface Promotable {
  place: PlaceResult
  pool: 'website' | 'automation'
  nicheScore: number | null
  pitchAngle: string | null
  auditSignals: AuditSignals | null
}

function slugifyBusiness(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  const suffix = crypto.randomUUID().slice(0, 8)
  return `${base || 'lead'}-${suffix}`
}

function bestPhone(place: PlaceResult): string | null {
  return place.internationalPhoneNumber || place.nationalPhoneNumber || null
}

function mapsUrlFor(place: PlaceResult): string | null {
  if (!place.formattedAddress) return null
  const q = `${place.displayName?.text || ''} ${place.formattedAddress}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** lead_lists insert payload from a promotable. */
function toLeadRow(p: Promotable, batchId: string, industry: string, location: string): Record<string, unknown> {
  return {
    batch_id: batchId,
    place_id: p.place.id || null,
    business_name: p.place.displayName?.text || 'Unknown Business',
    phone: bestPhone(p.place),
    email: null,
    address: p.place.formattedAddress || null,
    website: p.place.websiteUri || null,
    maps_url: mapsUrlFor(p.place),
    rating: p.place.rating || null,
    review_count: p.place.userRatingCount || null,
    industry: industry || null,
    location: location || null,
    raw_data: p.place,
    pool: p.pool,
    niche_score: p.nicheScore,
    pitch_angle: p.pitchAngle,
    audit_signals: p.auditSignals,
  }
}

/**
 * projects insert payload from a promotable. business_data is shaped so the
 * sales workspace extractors (lib/sales/get-leads.ts) read it: businessName,
 * contactInfo.{phone,address}, industry, rating, userRatingCount.
 */
function toProjectRow(
  p: Promotable,
  leadListId: string | null,
  config: LeadDiscoveryConfig,
): Record<string, unknown> {
  const name = p.place.displayName?.text || 'Unknown Business'
  const phone = bestPhone(p.place)
  return {
    business_data: {
      businessName: name,
      industry: config.industry || null,
      rating: p.place.rating ?? null,
      userRatingCount: p.place.userRatingCount ?? null,
      website: p.place.websiteUri || null,
      place_id: p.place.id || null,
      maps_url: mapsUrlFor(p.place),
      internationalPhoneNumber: phone,
      contactInfo: { phone, address: p.place.formattedAddress || null },
    },
    status: 'lead',
    // projects.source is constrained to ('discovery','custom','code-drop','bulk_upload') —
    // this pipeline is Google-Places-driven discovery, same bucket as the admin flow.
    source: 'discovery',
    slug: slugifyBusiness(name),
    pool: p.pool,
    niche_score: p.nicheScore,
    pitch_angle: p.pitchAngle,
    // Carry the audit evidence with the lead — the automation-plan generator
    // reads it from projects without having to join back to lead_lists.
    audit_signals: p.auditSignals ?? null,
    assigned_to: config.assignedTo ?? null,
    territory_id: config.territoryId ?? null,
    lead_list_id: leadListId,
    discovery_location: config.location || null,
    lat: p.place.location?.latitude ?? null,
    lng: p.place.location?.longitude ?? null,
  }
}

/**
 * Promote any lead_lists rows that were saved but never made it into `projects`
 * (e.g. a transient insert failure after the staging row was already written).
 * Idempotent: only touches rows with no matching projects.lead_list_id, and only
 * ones with a phone number (the sales workspace requires one to be workable).
 */
export async function promoteOrphanedLeads(options: {
  assignedTo?: string
  sinceHours?: number
} = {}): Promise<{ promoted: number; slugs: string[] }> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - (options.sinceHours ?? 24) * 60 * 60 * 1000).toISOString()

  const { data: leads, error: leadsError } = await supabase
    .from('lead_lists')
    .select('id, business_name, phone, address, website, maps_url, rating, review_count, industry, location, pool, niche_score, pitch_angle')
    .gte('created_at', since)
  if (leadsError) throw new Error(`Failed to load lead_lists: ${leadsError.message}`)
  if (!leads || leads.length === 0) return { promoted: 0, slugs: [] }

  // Cast: lead_list_id is a new column not yet in the generated types.
  const { data: existing, error: existingError } = await (supabase as any)
    .from('projects')
    .select('lead_list_id')
    .not('lead_list_id', 'is', null)
  if (existingError) throw new Error(`Failed to check existing projects: ${existingError.message}`)
  const alreadyPromoted = new Set((existing || []).map((r: { lead_list_id: string }) => r.lead_list_id))

  const orphaned = leads.filter((l) => !alreadyPromoted.has(l.id) && l.phone)
  if (orphaned.length === 0) return { promoted: 0, slugs: [] }

  const rows = orphaned.map((l) => {
    const slug = slugifyBusiness(l.business_name)
    return {
      business_data: {
        businessName: l.business_name,
        industry: l.industry,
        rating: l.rating,
        userRatingCount: l.review_count,
        website: l.website,
        maps_url: l.maps_url,
        internationalPhoneNumber: l.phone,
        contactInfo: { phone: l.phone, address: l.address },
      },
      status: 'lead',
      source: 'discovery',
      slug,
      pool: l.pool,
      niche_score: l.niche_score,
      pitch_angle: l.pitch_angle,
      lead_list_id: l.id,
      discovery_location: l.location,
      assigned_to: options.assignedTo ?? null,
    }
  })

  const { data: inserted, error: insertError } = await supabase.from('projects').insert(rows as any).select('slug')
  if (insertError) throw new Error(`Failed to promote orphaned leads: ${insertError.message}`)

  logger.discovery.info('Promoted orphaned leads', { count: inserted?.length ?? 0 })
  return { promoted: inserted?.length ?? 0, slugs: (inserted || []).map((r: any) => r.slug) }
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

  const locationBias = config.circle
    ? { latitude: config.circle.lat, longitude: config.circle.lng, radiusMeters: config.circle.radiusKm * 1000 }
    : undefined

  const base: Omit<PaginatedSearchConfig, 'searchQuery' | 'label'> = {
    apiKey, maxResults, skipWithWebsite, seenPlaceIds, dedupFn, counters, maxApiPages: MAX_API_PAGES, locationBias,
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

  // Unify both pools into a single promotable list so lead_lists rows and
  // promoted projects are built from one code path.
  let promotable: Promotable[]

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
        totalFetched: counters.totalFetched, promotedCount: 0, reason,
      }
    }
    promotable = scored.map(({ place, nicheScore, pitchAngle, auditSignals }) => ({
      place, pool: 'automation' as const, nicheScore, pitchAngle, auditSignals,
    }))
  } else {
    promotable = validPlaces.map((place: PlaceResult) => ({
      place, pool: 'website' as const, nicheScore: null, pitchAngle: null, auditSignals: null,
    }))
  }

  const leadsToInsert = promotable.map((p) => toLeadRow(p, batchId, config.industry, config.location))

  // Insert staging rows, returning ids so promoted projects can link back via
  // lead_list_id (place_id → lead_lists.id map).
  const { data: insertedLeads, error: insertError } = await supabase
    .from('lead_lists')
    .insert(leadsToInsert as any)
    .select('id, place_id')
  if (insertError) throw new Error(`Failed to save leads: ${insertError.message}`)

  logger.discovery.info('Leads saved', { pool, count: leadsToInsert.length, batchId })

  let promotedCount = 0
  if (config.promote) {
    const leadIdByPlace = new Map<string, string>()
    for (const row of insertedLeads || []) {
      if (row.place_id) leadIdByPlace.set(row.place_id as string, row.id as string)
    }
    // Only promote callable leads (a lead with no phone can't be worked in the
    // call-first sales workspace, which filters leads lacking a phone anyway).
    const projectsToInsert = promotable
      .filter((p) => bestPhone(p.place))
      .map((p) => toProjectRow(p, p.place.id ? leadIdByPlace.get(p.place.id) ?? null : null, config))

    if (projectsToInsert.length > 0) {
      const { error: promoteError } = await supabase.from('projects').insert(projectsToInsert as any)
      if (promoteError) {
        // Promotion failure shouldn't lose the discovered leads — they're safe in
        // lead_lists. Surface it so the caller can report a partial result.
        logger.discovery.error('Lead promotion to projects failed', { batchId, error: promoteError.message })
        throw new Error(`Leads saved but promotion failed: ${promoteError.message}`)
      }
      promotedCount = projectsToInsert.length
      logger.discovery.info('Leads promoted to projects', { count: promotedCount, batchId })
    }
  }

  return {
    batchId,
    savedCount: leadsToInsert.length,
    skippedCount: counters.skippedFiltered,
    totalFetched: counters.totalFetched,
    promotedCount,
    reason: null,
  }
}
