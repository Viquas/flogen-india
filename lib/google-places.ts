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
  location?: { latitude: number; longitude: number }
  /** Google-verified primary category, e.g. "dental_clinic". More reliable than the typed query. */
  primaryType?: string
  /** All Google category tags, e.g. ["dentist", "health"]. */
  types?: string[]
  /** "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY". */
  businessStatus?: string
}

/** A geographic circle to bias/restrict a search toward (radius in metres, max 50000). */
export interface Circle {
  latitude: number
  longitude: number
  radiusMeters: number
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
  /** Optional circle to bias results toward (map-driven area selection). */
  locationBias?: Circle
}

// -- Constants --------------------------------------------------------------

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'

/** Union of all fields needed by both discovery and lead-discovery. */
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.photos,places.location,places.primaryType,places.types,places.businessStatus,nextPageToken'

/** Business statuses that mean the lead is dead — never scrape/pitch these. */
const CLOSED_STATUSES = new Set(['CLOSED_PERMANENTLY', 'CLOSED_TEMPORARILY'])

// -- fetchOnePage -----------------------------------------------------------

export async function fetchOnePage(
  apiKey: string,
  textQuery: string,
  pageToken?: string,
  locationBias?: Circle,
): Promise<{ places: PlaceResult[]; nextPageToken: string | null }> {
  const body: Record<string, unknown> = { textQuery, pageSize: 20 }
  if (pageToken) body.pageToken = pageToken
  if (locationBias) {
    body.locationBias = {
      circle: {
        center: { latitude: locationBias.latitude, longitude: locationBias.longitude },
        radius: Math.min(Math.max(locationBias.radiusMeters, 1), 50000),
      },
    }
  }

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
  const { apiKey, searchQuery, label, maxResults, skipWithWebsite, seenPlaceIds, dedupFn, counters, maxApiPages, locationBias } = cfg
  let pageToken = ''
  let apiExhausted = false

  while (counters.validPlaces.length < maxResults && !apiExhausted && counters.pagesFetched < maxApiPages) {
    // Bounded retry with exponential backoff (scraping rule: max 3 attempts).
    // Without it a single transient 429/5xx mid-run throws away every page
    // already fetched and the whole discovery re-runs from page 1.
    let page: Awaited<ReturnType<typeof fetchOnePage>> | null = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        page = await fetchOnePage(apiKey, searchQuery, pageToken || undefined, locationBias)
        break
      } catch (err) {
        if (attempt === 3) throw err
        const backoffMs = 2000 * 2 ** (attempt - 1)
        logger.discovery.info('Places page fetch failed, retrying', {
          label, attempt, backoffMs,
          error: err instanceof Error ? err.message : String(err),
        })
        await new Promise(r => setTimeout(r, backoffMs))
      }
    }
    if (!page) break
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

    // Drop permanently/temporarily closed businesses — pitching a dead listing
    // wastes generation spend and sales-rep time, and reads as low-quality outreach.
    {
      const before = candidates.length
      candidates = candidates.filter(p => !(p.businessStatus && CLOSED_STATUSES.has(p.businessStatus)))
      counters.skippedFiltered += before - candidates.length
    }

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
