/**
 * Discovery Module
 *
 * Extracted from app/api/discovery/google-places/route.ts so the logic
 * is callable from both the API route handler and the autopilot pipeline.
 *
 * This module handles:
 * - Google Places Text Search API pagination
 * - Dedup checking against existing projects
 * - Website-having business filtering
 * - Batch creation and project insertion
 *
 * It does NOT enqueue projects into the generation queue -- the caller
 * is responsible for that (the autopilot handles it in a separate stage
 * for crash recovery).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { DiscoveryResult } from '@/lib/autopilot-types'

export type { DiscoveryResult }

export interface DiscoveryConfig {
  query: string
  location: string
  industry: string
  entries: number
  skipWithWebsite?: boolean
}

/**
 * Discover businesses via Google Places API, create a batch, and insert projects.
 * Returns the batchId and list of project IDs -- does NOT enqueue for generation.
 *
 * @throws Error if Google Places API key is missing, API fails, or DB operations fail.
 */
export async function discoverBusinesses(config: DiscoveryConfig): Promise<DiscoveryResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured')
  }

  const maxResults = Math.min(Math.max(config.entries, 1), 100)
  const searchQuery = `${config.query || config.industry} in ${config.location}`

  const url = 'https://places.googleapis.com/v1/places:searchText'
  const skipWithWebsite = config.skipWithWebsite !== false // defaults to true
  const supabase = createAdminClient()
  const MAX_API_PAGES = 20

  let validPlaces: any[] = []
  let pageToken = ''
  let apiExhausted = false
  let totalFetched = 0
  let skippedWebsite = 0
  let skippedDuplicates = 0
  let pagesFetched = 0

  const alreadyGeneratedPlaceIds = new Set<string>()

  // Persistent fetch+filter loop -- keeps paginating until we have enough valid results
  while (validPlaces.length < maxResults && !apiExhausted && pagesFetched < MAX_API_PAGES) {
    const data: any = { textQuery: searchQuery, pageSize: 20 }
    if (pageToken) data.pageToken = pageToken

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.websiteUri,nextPageToken',
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
    const result = await response.json()
    pagesFetched++

    const pagePlaces: any[] = result.places || []
    totalFetched += pagePlaces.length

    if (pagePlaces.length === 0 && !result.nextPageToken) {
      apiExhausted = true
      break
    }

    // --- Dedup check ---
    const allPageIds = pagePlaces.map((p: any) => p.id).filter(Boolean)
    if (allPageIds.length > 0) {
      const uncheckedIds = allPageIds.filter((id: string) => !alreadyGeneratedPlaceIds.has(id))
      if (uncheckedIds.length > 0) {
        const { data: existingProjects } = await supabase
          .from('projects')
          .select('business_data')
          .in('business_data->>placeId' as any, uncheckedIds)
        if (existingProjects) {
          for (const project of existingProjects) {
            const bd = project.business_data as any
            if (bd?.placeId) alreadyGeneratedPlaceIds.add(bd.placeId)
          }
        }
      }
    }

    // Remove already-generated places
    let candidates = pagePlaces.filter((place: any) => !alreadyGeneratedPlaceIds.has(place.id))
    skippedDuplicates += pagePlaces.length - candidates.length

    // --- Filter: skip businesses that already have a website ---
    if (skipWithWebsite) {
      const before = candidates.length
      candidates = candidates.filter((place: any) => !place.websiteUri)
      skippedWebsite += before - candidates.length
    }

    validPlaces = validPlaces.concat(candidates)

    console.log(`[Discovery] Page ${pagesFetched}: raw=${pagePlaces.length}, valid=${candidates.length}, total valid=${validPlaces.length}`)

    if (!result.nextPageToken) {
      apiExhausted = true
    } else if (validPlaces.length >= maxResults) {
      break
    } else {
      pageToken = result.nextPageToken
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Trim to the requested limit
  if (validPlaces.length > maxResults) {
    validPlaces = validPlaces.slice(0, maxResults)
  }

  console.log(`[Discovery] Final: ${validPlaces.length} valid from ${totalFetched} fetched (${skippedWebsite} skipped-website, ${skippedDuplicates} duplicates, ${pagesFetched} pages)`)

  if (validPlaces.length === 0) {
    throw new Error(
      totalFetched === 0
        ? 'No places found for this query.'
        : 'All found businesses already have websites or were previously generated.'
    )
  }

  // --- Database Ingestion ---

  // 1. Create Batch
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .insert({
      source: 'google-places',
      status: 'processing',
      metadata: { query: searchQuery, count: validPlaces.length },
    })
    .select()
    .single()

  if (batchError || !batch) {
    throw new Error(`Database error creating batch: ${batchError?.message ?? 'unknown'}`)
  }

  // Determine industry label
  const industryTerm = config.industry?.trim() || config.query?.trim() || 'Professional Services'

  // 2. Prepare Projects
  const projectsToInsert = validPlaces.map((place: any) => ({
    batch_id: batch.id,
    status: 'queued' as const,
    version: 1,
    business_data: {
      placeId: place.id || null,
      businessName: place.displayName?.text || 'Unknown Business',
      description: `A premier provider of ${industryTerm} located in ${place.formattedAddress || 'your area'}. Dedicated to excellence and customer satisfaction.`,
      services: [
        industryTerm,
        'Professional Services',
        'Consultation',
        'Customer Support',
      ],
      contactInfo: {
        address: place.formattedAddress || '',
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
        website: place.websiteUri || '',
      },
      internationalPhoneNumber: place.internationalPhoneNumber || null,
      nationalPhoneNumber: place.nationalPhoneNumber || null,
      industry: industryTerm,
    } as any,
  }))

  // 3. Insert Projects
  const { data: insertedProjects, error: projectsError } = await supabase
    .from('projects')
    .insert(projectsToInsert)
    .select('id')

  if (projectsError || !insertedProjects) {
    // Mark batch as failed
    await supabase.from('batches').update({ status: 'failed' }).eq('id', batch.id)
    throw new Error(`Failed to save projects: ${projectsError?.message ?? 'unknown'}`)
  }

  const projectIds = insertedProjects.map((p: any) => p.id)

  return {
    batchId: batch.id,
    projectIds,
    count: projectIds.length,
  }
}
