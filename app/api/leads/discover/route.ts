import { NextRequest, NextResponse } from 'next/server'
import { discoverLeads } from '@/lib/lead-discovery'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, location, industry, entries, skipWithWebsite } = body

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

    const result = await discoverLeads({
      query: query || industry,
      location: location || '',
      industry: industry || '',
      entries: clampedEntries,
      skipWithWebsite: skipWithWebsite !== false,
    })

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      savedCount: result.savedCount,
      skippedCount: result.skippedCount,
      totalFetched: result.totalFetched,
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
