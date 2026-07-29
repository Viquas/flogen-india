import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { generationQueue } from '@/lib/queue'

/**
 * Extract a Google Places Place ID from various Google Maps URL formats.
 * Returns { placeId, searchQuery } — at least one will be set.
 */
function parseMapsUrl(url: string): { placeId: string | null; searchQuery: string | null } {
  try {
    // Pattern 1: data parameter containing !1s followed by Place ID (ChIJ...)
    const dataMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/)
    if (dataMatch) {
      return { placeId: dataMatch[1], searchQuery: null }
    }

    // Pattern 2: ftid= parameter (e.g., 0x...:0x...)
    const ftidMatch = url.match(/ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/)
    if (ftidMatch) {
      // ftid is not a Place ID — use as search fallback
      return { placeId: null, searchQuery: null }
    }

    // Pattern 3: ?cid= parameter
    const cidMatch = url.match(/[?&]cid=(\d+)/)
    if (cidMatch) {
      // CID is not directly usable as Place ID — fall through to path extraction
    }

    // Pattern 4: /place/ChIJ... in path
    const pathPlaceIdMatch = url.match(/\/place\/(ChIJ[A-Za-z0-9_-]+)/)
    if (pathPlaceIdMatch) {
      return { placeId: pathPlaceIdMatch[1], searchQuery: null }
    }

    // Pattern 5: /place/Business+Name+Here/ — extract as search query
    const pathNameMatch = url.match(/\/place\/([^/@?]+)/)
    if (pathNameMatch) {
      const decoded = decodeURIComponent(pathNameMatch[1].replace(/\+/g, ' ')).trim()
      if (decoded && decoded.length > 1) {
        return { placeId: null, searchQuery: decoded }
      }
    }

    return { placeId: null, searchQuery: null }
  } catch {
    return { placeId: null, searchQuery: null }
  }
}

/**
 * Fetch Place Details from the Google Places API (v1).
 */
async function fetchPlaceDetails(placeId: string, apiKey: string) {
  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'rating',
    'websiteUri',
    'primaryType',
    'primaryTypeDisplayName',
  ].join(',')

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Places API error (${res.status}): ${body}`)
  }

  return res.json()
}

/**
 * Search for a place by text query and return the first result.
 */
async function searchPlace(query: string, apiKey: string) {
  const res = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.websiteUri,places.primaryType,places.primaryTypeDisplayName',
      },
      body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Places Text Search error (${res.status}): ${body}`)
  }

  const data = await res.json()
  return data.places?.[0] ?? null
}

/**
 * Build a business_data object from a Google Places response,
 * matching the shape used by the discovery pipeline.
 */
function buildBusinessData(place: Record<string, any>) {
  const industry =
    place.primaryTypeDisplayName?.text ||
    place.primaryType ||
    'Professional Services'

  const businessName =
    place.displayName?.text || 'Unknown Business'

  return {
    placeId: place.id || null,
    businessName,
    description: `A premier provider of ${industry} located in ${place.formattedAddress || 'your area'}. Dedicated to excellence and customer satisfaction.`,
    services: [industry, 'Professional Services', 'Consultation', 'Customer Support'],
    contactInfo: {
      address: place.formattedAddress || '',
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
      website: place.websiteUri || '',
    },
    internationalPhoneNumber: place.internationalPhoneNumber || null,
    nationalPhoneNumber: place.nationalPhoneNumber || null,
    industry,
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const url = typeof body?.url === 'string' ? body.url.trim() : ''

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 },
      )
    }

    // Resolve short links (goo.gl/maps/...) by following redirects
    let resolvedUrl = url
    if (url.includes('goo.gl/maps') || url.includes('maps.app.goo.gl')) {
      try {
        const redirectRes = await fetch(url, { redirect: 'follow' })
        resolvedUrl = redirectRes.url
      } catch {
        // If redirect fails, continue with original URL
      }
    }

    const { placeId, searchQuery } = parseMapsUrl(resolvedUrl)
    let place: Record<string, any> | null = null

    if (placeId) {
      // Direct Place ID lookup
      place = await fetchPlaceDetails(placeId, apiKey)
    } else if (searchQuery) {
      // Fallback: text search with the place name from the URL
      place = await searchPlace(searchQuery, apiKey)
    } else {
      // Last resort: use the whole URL as a search query
      // Strip protocol and domain to get a cleaner query
      const cleanQuery = resolvedUrl
        .replace(/^https?:\/\//, '')
        .replace(/^(www\.)?google\.[a-z.]+\/maps\/place\//, '')
        .replace(/[/@?].*/g, '')
        .replace(/\+/g, ' ')
        .trim()

      if (cleanQuery) {
        place = await searchPlace(cleanQuery, apiKey)
      }
    }

    if (!place) {
      return NextResponse.json(
        { error: 'Could not find a business from this URL. Try pasting business data instead.' },
        { status: 404 },
      )
    }

    const businessData = buildBusinessData(place)
    const supabase = createAdminClient()

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        status: 'queued' as const,
        version: 1,
        source: 'custom' as const,
        business_data: businessData,
      })
      .select('id')
      .single()

    if (insertError || !project) {
      console.error('[CustomBuild/from-url] Project insert failed:', insertError?.message)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    await generationQueue.add(project.id)

    return NextResponse.json({ success: true, projectId: project.id })
  } catch (error) {
    console.error('[CustomBuild/from-url] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
