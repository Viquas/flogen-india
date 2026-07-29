/**
 * Discovery Module
 *
 * Discovers businesses via Google Places, creates a batch, and inserts
 * projects for website generation. Does NOT enqueue into the generation
 * queue -- the caller handles that separately.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import type { DiscoveryResult, DiscoveryStats } from '@/lib/autopilot-types'
import { logger } from '@/lib/logger'
import {
  requireApiKey, buildFallbackQuery, paginatedSearch,
  type PlaceResult, type PaginatedSearchConfig,
} from '@/lib/google-places'
import { findExistingPlaceIds } from '@/lib/discovery-dedup'

export type { DiscoveryResult }

export interface DiscoveryConfig {
  query: string
  location: string
  industry: string
  entries: number
  skipWithWebsite?: boolean
}

/**
 * Discover businesses, create a batch, and insert projects.
 * @throws Error if API key missing, API/DB fails.
 */
export async function discoverBusinesses(config: DiscoveryConfig): Promise<DiscoveryResult> {
  const apiKey = requireApiKey()
  const maxResults = Math.min(Math.max(config.entries, 1), 100)
  const primaryQuery = `${config.query || config.industry} in ${config.location}`
  const skipWithWebsite = config.skipWithWebsite !== false
  const supabase = createAdminClient()
  const MAX_API_PAGES = 20

  const alreadyGeneratedPlaceIds = new Set<string>()
  const counters: PaginatedSearchConfig['counters'] = {
    validPlaces: [], totalFetched: 0, skippedFiltered: 0, pagesFetched: 0,
  }
  const seenPlaceIds = new Set<string>()

  const dedupFn = async (placeIds: string[]): Promise<Set<string>> => {
    // Cross-table dedup: skip businesses already saved as a lead OR already a
    // project (either json key casing), not just admin-generated projects.
    const unchecked = placeIds.filter(id => !alreadyGeneratedPlaceIds.has(id))
    if (unchecked.length > 0) {
      const existing = await findExistingPlaceIds(supabase, unchecked)
      for (const id of existing) alreadyGeneratedPlaceIds.add(id)
    }
    return alreadyGeneratedPlaceIds
  }

  const base: Omit<PaginatedSearchConfig, 'searchQuery' | 'label'> = {
    apiKey, maxResults, skipWithWebsite, seenPlaceIds, dedupFn, counters, maxApiPages: MAX_API_PAGES,
  }

  await paginatedSearch({ ...base, searchQuery: primaryQuery, label: 'Primary' })

  // Fallback broader query if under-returning
  let fallbackUsed = false
  let fallbackQuery: string | undefined
  if (counters.validPlaces.length < maxResults && counters.pagesFetched < MAX_API_PAGES) {
    fallbackQuery = buildFallbackQuery(config) ?? undefined
    if (fallbackQuery && fallbackQuery !== primaryQuery) {
      fallbackUsed = true
      logger.discovery.info('Fallback: primary under-returned', { found: counters.validPlaces.length, target: maxResults, fallbackQuery })
      await paginatedSearch({ ...base, searchQuery: fallbackQuery, label: 'Fallback' })
    }
  }

  let validPlaces = counters.validPlaces
  if (validPlaces.length > maxResults) validPlaces = validPlaces.slice(0, maxResults)

  const stats: DiscoveryStats = {
    totalFetched: counters.totalFetched, skippedWebsite: 0,
    skippedDuplicates: counters.skippedFiltered, pagesFetched: counters.pagesFetched,
    fallbackUsed, fallbackQuery,
  }

  logger.discovery.info('Discovery complete', {
    valid: validPlaces.length, totalFetched: counters.totalFetched,
    skippedFiltered: counters.skippedFiltered, pagesFetched: counters.pagesFetched, fallbackUsed,
  })

  if (validPlaces.length === 0) {
    throw new Error(
      counters.totalFetched === 0
        ? 'No places found for this query.'
        : 'All found businesses already have websites or were previously generated.',
    )
  }

  // -- Database Ingestion ---------------------------------------------------

  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .insert({
      source: 'google-places', status: 'processing',
      metadata: {
        query: primaryQuery, count: validPlaces.length,
        location: config.location || '', industry: config.industry || '', entries: maxResults,
      },
    })
    .select().single()

  if (batchError || !batch) throw new Error(`Database error creating batch: ${batchError?.message ?? 'unknown'}`)

  const industryTerm = config.industry?.trim() || config.query?.trim() || 'Professional Services'

  const projectsToInsert = validPlaces.map((place: PlaceResult) => ({
    batch_id: batch.id, status: 'queued' as const, version: 1,
    business_data: {
      placeId: place.id || null,
      businessName: place.displayName?.text || 'Unknown Business',
      description: `A premier provider of ${industryTerm} located in ${place.formattedAddress || 'your area'}. Dedicated to excellence and customer satisfaction.`,
      services: [industryTerm, 'Professional Services', 'Consultation', 'Customer Support'],
      contactInfo: {
        address: place.formattedAddress || '',
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
        website: place.websiteUri || '',
      },
      internationalPhoneNumber: place.internationalPhoneNumber || null,
      nationalPhoneNumber: place.nationalPhoneNumber || null,
      industry: industryTerm,
      photos: place.photos || null,
    } as any,
  }))

  const { data: insertedProjects, error: projectsError } = await supabase
    .from('projects').insert(projectsToInsert).select('id')

  if (projectsError || !insertedProjects) {
    await supabase.from('batches').update({ status: 'failed' }).eq('id', batch.id)
    throw new Error(`Failed to save projects: ${projectsError?.message ?? 'unknown'}`)
  }

  const projectIds = insertedProjects.map((p: any) => p.id)
  return { batchId: batch.id, projectIds, count: projectIds.length, stats }
}
