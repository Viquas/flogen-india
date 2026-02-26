import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generationQueue } from '@/lib/queue'

export async function POST(req: NextRequest) {
    try {
        const { query, skipWithWebsite: _skip, rules, structured, templateId } = await req.json()

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY is not configured' }, { status: 500 })
        }

        // Determine max results: prefer explicit structured.entries, fallback to query regex
        let maxResults = 20;
        if (structured?.entries && typeof structured.entries === 'number') {
            maxResults = Math.min(Math.max(structured.entries, 1), 100)
        } else {
            const numberMatches = query.match(/\b(\d+)\b/g);
            if (numberMatches) {
                const validLimit = numberMatches.find((n: string) => {
                    const num = parseInt(n);
                    return num > 0 && num <= 100;
                });
                if (validLimit) {
                    maxResults = parseInt(validLimit);
                }
            }
        }

        const url = 'https://places.googleapis.com/v1/places:searchText'
        const skipWithWebsite = _skip !== false // defaults to true
        const supabase = createAdminClient()
        const MIN_VALID = Math.min(maxResults, 10) // keep paginating until we hit at least this many
        const MAX_API_PAGES = 20 // increased cap — scan up to 400 raw results to find those without websites

        let validPlaces: any[] = []
        let pageToken = ""
        let apiExhausted = false
        let totalFetched = 0
        let skippedWebsite = 0
        let skippedDuplicates = 0
        let pagesFetched = 0

        let alreadyGeneratedPlaceIds = new Set<string>()

        // Persistent fetch+filter loop — keeps paginating until we have enough valid results
        while (validPlaces.length < maxResults && !apiExhausted && pagesFetched < MAX_API_PAGES) {
            const data: any = { textQuery: query, pageSize: 20 }
            if (pageToken) data.pageToken = pageToken

            const headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.websiteUri,nextPageToken'
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

            // --- Filter: STRICTLY skip businesses that already have a website ---
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

        let allPlaces = validPlaces
        const originalCount = totalFetched

        if (allPlaces.length === 0) {
            return NextResponse.json({
                message: totalFetched === 0
                    ? 'No places found for this query.'
                    : 'All found businesses already have websites or were previously generated.',
                count: 0,
                totalFetched,
                skippedWebsite,
                skippedDuplicates,
                pagesFetched,
            })
        }

        // --- Database Ingestion ---

        // 1. Create Batch
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .insert({
                source: 'google-places',
                status: 'processing',
                metadata: { query, count: allPlaces.length }
            })
            .select()
            .single()

        if (batchError) {
            console.error('Batch creation failed:', batchError)
            return NextResponse.json({ error: 'Database error creating batch' }, { status: 500 })
        }

        // Determine industry label: prefer structured param, fallback to cleaning the query
        let industryTerm = "Professional Services"
        if (structured?.industry && typeof structured.industry === 'string' && structured.industry.trim()) {
            industryTerm = structured.industry.trim()
        } else if (structured?.searchTerm && typeof structured.searchTerm === 'string' && structured.searchTerm.trim()) {
            industryTerm = structured.searchTerm.trim()
        } else {
            const cleanQuery = query
                .replace(/\b\d+\b/g, '')
                .replace(/\b(top|best|list of|find|get|search for|in|near|at)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
            if (cleanQuery) industryTerm = cleanQuery
        }

        // 2. Prepare Projects
        const projectsToInsert = allPlaces.map((place: any) => ({
            batch_id: batch.id,
            status: 'queued' as const,
            version: 1,
            business_data: {
                placeId: place.id || null,
                businessName: place.displayName?.text || 'Unknown Business',
                description: `A premier provider of ${industryTerm} located in ${place.formattedAddress || 'your area'}. Dedicated to excellence and customer satisfaction.`,
                services: [
                    industryTerm,
                    "Professional Services",
                    "Consultation",
                    "Customer Support"
                ],
                contactInfo: {
                    address: place.formattedAddress || '',
                    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
                    website: place.websiteUri || ''
                },
                internationalPhoneNumber: place.internationalPhoneNumber || null,
                nationalPhoneNumber: place.nationalPhoneNumber || null,
                industry: industryTerm
            } as any
        }))

        // 3. Insert Projects
        const { data: insertedProjects, error: projectsError } = await supabase
            .from('projects')
            .insert(projectsToInsert)
            .select('id')

        if (projectsError) {
            console.error('Project insertion failed:', projectsError)
            await supabase.from('batches').update({ status: 'failed' }).eq('id', batch.id)
            return NextResponse.json({ error: 'Failed to save projects' }, { status: 500 })
        }

        // 4. Queue for Generation
        if (insertedProjects) {
            const projectIds = insertedProjects.map((p: any) => p.id)
            generationQueue.addBatch(projectIds, rules, templateId || undefined)
        }

        return NextResponse.json({
            success: true,
            count: allPlaces.length,
            batchId: batch.id,
            message: `Queued ${allPlaces.length} websites for generation`
        })

    } catch (error) {
        console.error('Discovery error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
