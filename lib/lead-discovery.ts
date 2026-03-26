/**
 * Lead Discovery Module
 *
 * Fetches Google Places results and saves them to lead_lists for
 * cold-calling outreach. Unlike lib/discovery.ts (batches + projects
 * for site generation), this module only stores contact data.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  requireApiKey, buildFallbackQuery, paginatedSearch,
  type PlaceResult, type PaginatedSearchConfig,
} from '@/lib/google-places'

export interface LeadDiscoveryConfig {
  query: string
  location: string
  industry: string
  entries: number
  skipWithWebsite?: boolean
}

export interface LeadDiscoveryResult {
  batchId: string
  savedCount: number
  skippedCount: number
  totalFetched: number
}

/**
 * Discover leads via Google Places and save to lead_lists.
 * @throws Error if API key missing, API/DB fails.
 */
export async function discoverLeads(config: LeadDiscoveryConfig): Promise<LeadDiscoveryResult> {
  const apiKey = requireApiKey()
  const maxResults = Math.min(Math.max(config.entries, 1), 100)
  const primaryQuery = `${config.query || config.industry} in ${config.location}`
  const skipWithWebsite = config.skipWithWebsite !== false
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

  // Fallback broader query if under-returning
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
    valid: validPlaces.length, totalFetched: counters.totalFetched,
    skippedFiltered: counters.skippedFiltered, pagesFetched: counters.pagesFetched,
  })

  if (validPlaces.length === 0) {
    throw new Error(
      counters.totalFetched === 0
        ? 'No places found for this query.'
        : 'All found businesses already have websites or were previously saved as leads.',
    )
  }

  // -- Insert into lead_lists -----------------------------------------------
  const leadsToInsert = validPlaces.map((place: PlaceResult) => ({
    batch_id: batchId,
    place_id: place.id || null,
    business_name: place.displayName?.text || 'Unknown Business',
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
    email: null as string | null,
    address: place.formattedAddress || null,
    website: place.websiteUri || null,
    maps_url: place.formattedAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((place.displayName?.text || '') + ' ' + (place.formattedAddress || ''))}`
      : null,
    rating: place.rating || null,
    review_count: place.userRatingCount || null,
    industry: config.industry || null,
    location: config.location || null,
    raw_data: place as any,
  }))

  const { error: insertError } = await supabase.from('lead_lists').insert(leadsToInsert)
  if (insertError) throw new Error(`Failed to save leads: ${insertError.message}`)

  logger.discovery.info('Leads saved', { count: leadsToInsert.length, batchId })
  return { batchId, savedCount: leadsToInsert.length, skippedCount: counters.skippedFiltered, totalFetched: counters.totalFetched }
}
