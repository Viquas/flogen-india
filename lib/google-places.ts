/**
 * Google Places API — shared core
 *
 * fetchOnePage, buildFallbackQuery, and paginatedSearch live here so
 * lib/discovery.ts and lib/lead-discovery.ts share one implementation.
 */
import { logger } from '@/lib/logger'

// -- Types ------------------------------------------------------------------

export interface PlaceResult {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  rating?: number
  userRatingCount?: number
  websiteUri?: string
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
}

export type DedupCallback = (placeIds: string[]) => Promise<Set<string>>

export interface PaginatedSearchConfig {
  apiKey: string
  searchQuery: string
  label: string
  maxResults: number
  skipWithWebsite: boolean
  seenPlaceIds: Set<string>
  dedupFn: DedupCallback
  counters: {
    validPlaces: PlaceResult[]
    totalFetched: number
    skippedFiltered: number
    pagesFetched: number
  }
  maxApiPages: number
}

// -- Constants --------------------------------------------------------------

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'

/** Union of all fields needed by both discovery and lead-discovery. */
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.photos,nextPageToken'

// -- fetchOnePage -----------------------------------------------------------

export async function fetchOnePage(
  apiKey: string,
  textQuery: string,
  pageToken?: string,
): Promise<{ places: PlaceResult[]; nextPageToken: string | null }> {
  const body: Record<string, unknown> = { textQuery, pageSize: 20 }
  if (pageToken) body.pageToken = pageToken

  const res = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Google Places API error ${res.status}: ${errorText.substring(0, 200)}`)
  }

  const json = await res.json()
  return { places: json.places || [], nextPageToken: json.nextPageToken || null }
}

// -- buildFallbackQuery -----------------------------------------------------

/** Broaden a query when the primary one exhausts results. */
export function buildFallbackQuery(
  config: { query: string; industry: string; location: string },
): string | null {
  const term = config.query || config.industry
  if (!term) return null
  if (config.location) {
    const parts = config.location.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) return `${term} in ${parts.slice(1).join(', ')}`
    return `${term} near ${config.location}`
  }
  return null
}

// -- paginatedSearch --------------------------------------------------------

/**
 * Generic paginated fetch + filter loop. The caller provides a dedupFn
 * that checks their specific DB table; everything else is handled here.
 */
export async function paginatedSearch(cfg: PaginatedSearchConfig): Promise<void> {
  const { apiKey, searchQuery, label, maxResults, skipWithWebsite, seenPlaceIds, dedupFn, counters, maxApiPages } = cfg
  let pageToken = ''
  let apiExhausted = false

  while (counters.validPlaces.length < maxResults && !apiExhausted && counters.pagesFetched < maxApiPages) {
    const page = await fetchOnePage(apiKey, searchQuery, pageToken || undefined)
    counters.pagesFetched++
    const pagePlaces = page.places
    counters.totalFetched += pagePlaces.length

    if (pagePlaces.length === 0 && !page.nextPageToken) { apiExhausted = true; break }

    // Module-specific dedup via callback
    const newIds = pagePlaces.map(p => p.id).filter((id): id is string => Boolean(id) && !seenPlaceIds.has(id))
    const excludeIds = newIds.length > 0 ? await dedupFn(newIds) : new Set<string>()

    let candidates = pagePlaces.filter(p => p.id && !excludeIds.has(p.id) && !seenPlaceIds.has(p.id))
    counters.skippedFiltered += pagePlaces.length - candidates.length

    for (const p of pagePlaces) { if (p.id) seenPlaceIds.add(p.id) }

    if (skipWithWebsite) {
      const before = candidates.length
      candidates = candidates.filter(p => !p.websiteUri)
      counters.skippedFiltered += before - candidates.length
    }

    counters.validPlaces = counters.validPlaces.concat(candidates)

    logger.discovery.info('Search page processed', {
      label, page: counters.pagesFetched, raw: pagePlaces.length,
      valid: candidates.length, totalValid: counters.validPlaces.length,
    })

    if (!page.nextPageToken) { apiExhausted = true }
    else if (counters.validPlaces.length >= maxResults) { break }
    else { pageToken = page.nextPageToken; await new Promise(r => setTimeout(r, 2000)) }
  }
}

// -- requireApiKey ----------------------------------------------------------

export function requireApiKey(): string {
  const raw = process.env.GOOGLE_PLACES_API_KEY
  if (!raw || raw === 'YOUR_API_KEY_HERE') throw new Error('GOOGLE_PLACES_API_KEY is not configured')
  return raw
}
