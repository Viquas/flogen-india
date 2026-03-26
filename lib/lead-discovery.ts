/**
 * Lead Discovery Module
 *
 * Fetches Google Places results and saves them to the lead_lists table
 * for cold-calling outreach. Unlike lib/discovery.ts (which creates
 * batches + projects for site generation), this module only stores
 * contact data — no generation jobs are created.
 *
 * Deduplication is global: a placeId that exists anywhere in lead_lists
 * is skipped regardless of batch.
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface LeadDiscoveryConfig {
  query: string
  location: string
  industry: string
  entries: number
  skipWithWebsite?: boolean // defaults to true
}

export interface LeadDiscoveryResult {
  batchId: string
  savedCount: number
  skippedCount: number
  totalFetched: number
}

// ---------------------------------------------------------------------------
// Internal helpers (mirrored from lib/discovery.ts to avoid touching it)
// ---------------------------------------------------------------------------

interface FetchPageResult {
  places: any[]
  nextPageToken: string | null
}

async function fetchOnePage(
  url: string,
  apiKey: string,
  textQuery: string,
  pageToken?: string,
): Promise<FetchPageResult> {
  const data: any = { textQuery, pageSize: 20 }
  if (pageToken) data.pageToken = pageToken

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask':
      'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,nextPageToken',
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  const result = await response.json()

  return {
    places: result.places || [],
    nextPageToken: result.nextPageToken || null,
  }
}

function buildFallbackQuery(config: LeadDiscoveryConfig): string | null {
  const term = config.query || config.industry
  if (!term) return null

  if (config.location) {
    const parts = config.location
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length > 1) {
      return `${term} in ${parts.slice(1).join(', ')}`
    }
    return `${term} near ${config.location}`
  }

  return null
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Discover leads via Google Places API and save to lead_lists table.
 * Does NOT create batches/projects or enqueue generation jobs.
 *
 * @throws Error if API key missing, API fails, or DB operations fail.
 */
export async function discoverLeads(
  config: LeadDiscoveryConfig,
): Promise<LeadDiscoveryResult> {
  const rawApiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!rawApiKey || rawApiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured')
  }
  const apiKey: string = rawApiKey

  const maxResults = Math.min(Math.max(config.entries, 1), 100)
  const primaryQuery = `${config.query || config.industry} in ${config.location}`
  const url = 'https://places.googleapis.com/v1/places:searchText'
  const skipWithWebsite = config.skipWithWebsite !== false // defaults to true
  const supabase = createAdminClient()
  const MAX_API_PAGES = 20
  const batchId = crypto.randomUUID()

  let validPlaces: any[] = []
  let totalFetched = 0
  let skippedCount = 0
  let pagesFetched = 0

  const seenPlaceIds = new Set<string>()

  async function runPaginatedSearch(searchQuery: string, label: string) {
    let pageToken = ''
    let apiExhausted = false

    while (
      validPlaces.length < maxResults &&
      !apiExhausted &&
      pagesFetched < MAX_API_PAGES
    ) {
      const page = await fetchOnePage(
        url,
        apiKey,
        searchQuery,
        pageToken || undefined,
      )
      pagesFetched++

      const pagePlaces = page.places
      totalFetched += pagePlaces.length

      if (pagePlaces.length === 0 && !page.nextPageToken) {
        apiExhausted = true
        break
      }

      // --- Global dedup against lead_lists by placeId ---
      const allPageIds = pagePlaces
        .map((p: any) => p.id)
        .filter(Boolean) as string[]
      const newIds = allPageIds.filter((id) => !seenPlaceIds.has(id))

      const existingPlaceIds = new Set<string>()
      if (newIds.length > 0) {
        const { data: existingLeads } = await supabase
          .from('lead_lists')
          .select('place_id')
          .in('place_id', newIds)

        if (existingLeads) {
          for (const lead of existingLeads) {
            if (lead.place_id) existingPlaceIds.add(lead.place_id)
          }
        }
      }

      // Filter out: already in lead_lists, already seen this run
      let candidates = pagePlaces.filter(
        (place: any) =>
          place.id &&
          !existingPlaceIds.has(place.id) &&
          !seenPlaceIds.has(place.id),
      )
      skippedCount += pagePlaces.length - candidates.length

      // Track seen IDs for cross-page dedup within this run
      for (const place of pagePlaces) {
        if (place.id) seenPlaceIds.add(place.id)
      }

      // Filter: skip businesses that already have a website
      if (skipWithWebsite) {
        const before = candidates.length
        candidates = candidates.filter((place: any) => !place.websiteUri)
        skippedCount += before - candidates.length
      }

      validPlaces = validPlaces.concat(candidates)

      console.log(
        `[LeadDiscovery] ${label} Page ${pagesFetched}: raw=${pagePlaces.length}, valid=${candidates.length}, total valid=${validPlaces.length}`,
      )

      if (!page.nextPageToken) {
        apiExhausted = true
      } else if (validPlaces.length >= maxResults) {
        break
      } else {
        pageToken = page.nextPageToken
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  // --- Primary query ---
  await runPaginatedSearch(primaryQuery, 'Primary')

  // --- Fallback broader query if under-returning ---
  if (validPlaces.length < maxResults && pagesFetched < MAX_API_PAGES) {
    const fallbackQuery = buildFallbackQuery(config)
    if (fallbackQuery && fallbackQuery !== primaryQuery) {
      console.log(
        `[LeadDiscovery] Fallback: primary returned ${validPlaces.length}/${maxResults}, trying broader query: "${fallbackQuery}"`,
      )
      await runPaginatedSearch(fallbackQuery, 'Fallback')
    }
  }

  // Trim to the requested limit
  if (validPlaces.length > maxResults) {
    validPlaces = validPlaces.slice(0, maxResults)
  }

  console.log(
    `[LeadDiscovery] Final: ${validPlaces.length} valid from ${totalFetched} fetched (${skippedCount} skipped, ${pagesFetched} pages)`,
  )

  if (validPlaces.length === 0) {
    throw new Error(
      totalFetched === 0
        ? 'No places found for this query.'
        : 'All found businesses already have websites or were previously saved as leads.',
    )
  }

  // --- Insert into lead_lists ---
  const leadsToInsert = validPlaces.map((place: any) => ({
    batch_id: batchId,
    place_id: place.id || null,
    business_name: place.displayName?.text || 'Unknown Business',
    phone:
      place.internationalPhoneNumber || place.nationalPhoneNumber || null,
    email: null as string | null, // Google Places doesn't return email
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
  }))

  const { error: insertError } = await supabase
    .from('lead_lists')
    .insert(leadsToInsert)

  if (insertError) {
    throw new Error(`Failed to save leads: ${insertError.message}`)
  }

  console.log(
    `[LeadDiscovery] Saved ${leadsToInsert.length} leads with batchId=${batchId}`,
  )

  return {
    batchId,
    savedCount: leadsToInsert.length,
    skippedCount,
    totalFetched,
  }
}
