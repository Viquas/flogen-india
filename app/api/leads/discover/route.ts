import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { discoverLeads } from '@/lib/lead-discovery'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { query, location, industry, entries, skipWithWebsite, pool } = body

    // Validation: query or industry required
    if (!query && !industry) {
      return NextResponse.json(
        { error: 'Either query or industry is required' },
        { status: 400 },
      )
    }

    // Clamp entries 1-100, default 20
    const clampedEntries = Math.min(
      Math.max(typeof entries === 'number' ? entries : 20, 1),
      100,
    )

    // Resolve pool: only 'automation' stays as-is, everything else defaults to 'website'
    const resolvedPool = pool === 'automation' ? 'automation' : 'website'

    const result = await discoverLeads({
      query: query || industry,
      location: location || '',
      industry: industry || '',
      entries: clampedEntries,
      // Pass through only an explicit boolean; undefined lets the pool-based default apply
      // (website pool → skip businesses that already have a site).
      skipWithWebsite: typeof skipWithWebsite === 'boolean' ? skipWithWebsite : undefined,
      pool: resolvedPool,
    })

    if (result.savedCount === 0 && result.reason) {
      const message =
        result.reason === 'out_of_niche'
          ? 'No businesses in a supported automation niche were found for this search. Try a different industry or location.'
          : 'Found businesses with websites, but none scored high enough for an automation pitch. Try a broader search or a different niche.'

      return NextResponse.json({
        success: false,
        message,
        savedCount: 0,
      })
    }

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      savedCount: result.savedCount,
      skippedCount: result.skippedCount,
      totalFetched: result.totalFetched,
      pool: resolvedPool,
      reason: result.reason ?? null,
    })
  } catch (error) {
    console.error('[LeadDiscovery] API error:', error)
    const message =
      error instanceof Error ? error.message : 'Internal Server Error'

    // Known non-fatal conditions: no results found
    if (
      message.includes('No places found') ||
      message.includes('All found businesses')
    ) {
      return NextResponse.json({
        success: false,
        message,
        savedCount: 0,
      })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
