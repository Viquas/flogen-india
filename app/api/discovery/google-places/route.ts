import { NextRequest, NextResponse } from 'next/server'
import { discoverBusinesses } from '@/lib/discovery'
import { generationQueue } from '@/lib/queue'
import { requireAdmin } from '@/lib/auth/require-admin'

export const maxDuration = 300 // 5 min (Vercel Pro)

export async function POST(req: NextRequest) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    try {
        const { query, skipWithWebsite, rules, structured, templateId } = await req.json()

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        // Determine max results: prefer explicit structured.entries, fallback to query regex
        let entries = 20
        if (structured?.entries && typeof structured.entries === 'number') {
            entries = Math.min(Math.max(structured.entries, 1), 100)
        } else {
            const numberMatches = query.match(/\b(\d+)\b/g)
            if (numberMatches) {
                const validLimit = numberMatches.find((n: string) => {
                    const num = parseInt(n)
                    return num > 0 && num <= 100
                })
                if (validLimit) {
                    entries = parseInt(validLimit)
                }
            }
        }

        // Determine industry label: prefer structured param, fallback to cleaning the query
        let industry = 'Professional Services'
        if (structured?.industry && typeof structured.industry === 'string' && structured.industry.trim()) {
            industry = structured.industry.trim()
        } else if (structured?.searchTerm && typeof structured.searchTerm === 'string' && structured.searchTerm.trim()) {
            industry = structured.searchTerm.trim()
        } else {
            const cleanQuery = query
                .replace(/\b\d+\b/g, '')
                .replace(/\b(top|best|list of|find|get|search for|in|near|at)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
            if (cleanQuery) industry = cleanQuery
        }

        // Determine location from structured params or extract from query
        const location = structured?.location || ''

        // Call the extracted discovery logic
        const result = await discoverBusinesses({
            query,
            location,
            industry,
            entries,
            skipWithWebsite: skipWithWebsite !== false,
        })

        // Enqueue for generation (the route handler does this; the autopilot does it separately)
        if (result.projectIds.length > 0) {
            generationQueue.addBatch(result.projectIds, rules, templateId || undefined)
        }

        // Build response with shortfall warning if applicable
        const shortfall = entries - result.count
        let message = `Queued ${result.count} websites for generation`
        if (shortfall > 0) {
            message += `. Note: only ${result.count} of ${entries} requested businesses were found without existing websites.`
            if (result.stats?.fallbackUsed) {
                message += ` A broader search was attempted.`
            }
        }

        return NextResponse.json({
            success: true,
            count: result.count,
            batchId: result.batchId,
            message,
            stats: result.stats,
        })
    } catch (error) {
        console.error('Discovery error:', error)
        const message = error instanceof Error ? error.message : 'Internal Server Error'

        // Return user-friendly messages for known non-fatal conditions
        if (message.includes('No places found') || message.includes('All found businesses')) {
            return NextResponse.json({ message, count: 0 })
        }

        return NextResponse.json({ error: message }, { status: 500 })
    }
}
