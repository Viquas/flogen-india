/**
 * Bulk CSV Research Pipeline
 *
 * Two-step research per lead:
 * 1. Google Places lookup via fetchOnePage()
 * 2. Fallback: Gemini with Google Search grounding
 */

import { fetchOnePage, requireApiKey, type PlaceResult } from '@/lib/google-places'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/logger'
import { google } from '@ai-sdk/google'
import { GEMINI_FLASH } from '@/lib/ai/model-ids'
import { generateText } from 'ai'

const log = createLogger('bulk-research')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeadRow {
  id: string
  business_name: string
  location: string | null
  email: string | null
  phone: string | null
  industry: string | null
}

interface ResearchResult {
  source: 'google_maps' | 'web_search' | 'not_found'
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Step 1: Google Places lookup
// ---------------------------------------------------------------------------

function matchesLead(place: PlaceResult, lead: LeadRow): boolean {
  const placeName = (place.displayName?.text || '').toLowerCase()
  const leadName = lead.business_name.toLowerCase()
  return placeName.includes(leadName) || leadName.includes(placeName)
}

async function googlePlacesLookup(
  apiKey: string,
  lead: LeadRow,
): Promise<ResearchResult | null> {
  const query = [lead.business_name, lead.location].filter(Boolean).join(' ')
  try {
    const { places } = await fetchOnePage(apiKey, query)
    if (!places || places.length === 0) return null

    const match = places.find((p) => matchesLead(p, lead)) || null
    if (!match) return null

    return {
      source: 'google_maps',
      data: {
        place_id: match.id,
        name: match.displayName?.text,
        address: match.formattedAddress,
        phone: match.nationalPhoneNumber || match.internationalPhoneNumber,
        rating: match.rating,
        review_count: match.userRatingCount,
        website: match.websiteUri,
      },
    }
  } catch (err) {
    log.warn('Google Places lookup failed', {
      leadId: lead.id,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

// ---------------------------------------------------------------------------
// Step 2: Gemini with Google Search grounding
// ---------------------------------------------------------------------------

const GEMINI_DELAY_MS = 200

async function geminiSearchLookup(lead: LeadRow): Promise<ResearchResult | null> {
  const prompt = `Find business contact information for "${lead.business_name}"${lead.location ? ` located in ${lead.location}` : ''}${lead.industry ? ` (industry: ${lead.industry})` : ''}.

Return a JSON object with these fields (use null for unknown):
{
  "name": "business name",
  "address": "full address",
  "phone": "phone number",
  "email": "email address",
  "website": "website URL",
  "industry": "industry/category",
  "description": "brief description"
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks.`

  const model = google(GEMINI_FLASH)

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateText({
        model,
        prompt,
        tools: {
          google_search: google.tools.googleSearch({}) as any,
        },
        maxRetries: 3,
      })

      const text = result.text.trim()

      // Strip markdown code fences if present
      const jsonStr = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const parsed = JSON.parse(jsonStr)

      return {
        source: 'web_search',
        data: parsed,
      }
    } catch (err) {
      log.warn('Gemini search attempt failed', {
        leadId: lead.id,
        attempt: attempt + 1,
        error: err instanceof Error ? err.message : String(err),
      })

      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, GEMINI_DELAY_MS))
      }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// researchLead — orchestrates both steps
// ---------------------------------------------------------------------------

export async function researchLead(lead: LeadRow): Promise<ResearchResult> {
  // Step 1: Google Places
  let apiKey: string | null = null
  try {
    apiKey = requireApiKey()
  } catch {
    // Google Places API key not configured, skip to Gemini
  }

  if (apiKey) {
    const mapsResult = await googlePlacesLookup(apiKey, lead)
    if (mapsResult) return mapsResult
  }

  // Step 2: Gemini fallback
  const geminiResult = await geminiSearchLookup(lead)
  if (geminiResult) return geminiResult

  // Neither found anything
  return { source: 'not_found', data: {} }
}

// ---------------------------------------------------------------------------
// researchBatch — process all pending leads with concurrency pool
// ---------------------------------------------------------------------------

const CONCURRENCY = 5

export async function researchBatch(batchId: string): Promise<void> {
  const supabase = createAdminClient()

  log.info('Starting batch research', { batchId })

  // Mark batch as researching
  await supabase
    .from('bulk_uploads')
    .update({ status: 'researching', updated_at: new Date().toISOString() })
    .eq('batch_id', batchId)

  // Fetch all pending leads
  const { data: leads, error: leadsError } = await supabase
    .from('bulk_upload_leads')
    .select('id, business_name, location, email, phone, industry')
    .eq('batch_id', batchId)
    .eq('research_status', 'pending')

  if (leadsError || !leads || leads.length === 0) {
    log.warn('No pending leads found for batch', { batchId, error: leadsError?.message })
    await supabase
      .from('bulk_uploads')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('batch_id', batchId)
    return
  }

  log.info('Processing leads', { batchId, count: leads.length })

  let foundMaps = 0
  let foundWeb = 0
  let notFound = 0
  let failed = 0

  // Concurrency pool
  const pool: Promise<void>[] = []
  let idx = 0

  async function processLead(lead: LeadRow) {
    try {
      // Mark as researching
      await supabase
        .from('bulk_upload_leads')
        .update({ research_status: 'researching', updated_at: new Date().toISOString() })
        .eq('id', lead.id)

      const result = await researchLead(lead)

      // Update lead with result
      await supabase
        .from('bulk_upload_leads')
        .update({
          research_source: result.source,
          research_status: result.source === 'not_found' ? 'not_found' : 'found',
          apollo_data: result.data as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (result.source === 'google_maps') foundMaps++
      else if (result.source === 'web_search') foundWeb++
      else notFound++

      log.info('Lead researched', { leadId: lead.id, source: result.source })
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      log.error('Lead research failed', { leadId: lead.id, error: msg })

      await supabase
        .from('bulk_upload_leads')
        .update({
          research_status: 'failed',
          error_message: msg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
    }

    // Delay between Gemini requests
    await new Promise((r) => setTimeout(r, GEMINI_DELAY_MS))
  }

  // Process with concurrency limit
  for (const lead of leads) {
    const task = processLead(lead)
    pool.push(task)

    if (pool.length >= CONCURRENCY) {
      await Promise.race(pool)
      // Remove settled promises
      for (let i = pool.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          pool[i].then(() => true),
          Promise.resolve(false),
        ])
        if (settled) pool.splice(i, 1)
      }
    }
  }

  // Wait for remaining
  await Promise.all(pool)

  // Update batch summary
  const finalStatus = failed > 0 && (foundMaps + foundWeb + notFound) > 0
    ? 'partially_failed'
    : failed > 0
      ? 'partially_failed'
      : 'completed'

  await supabase
    .from('bulk_uploads')
    .update({
      status: finalStatus,
      found_maps: foundMaps,
      found_web: foundWeb,
      not_found: notFound,
      updated_at: new Date().toISOString(),
    })
    .eq('batch_id', batchId)

  log.info('Batch research complete', {
    batchId,
    foundMaps,
    foundWeb,
    notFound,
    failed,
    status: finalStatus,
  })
}
