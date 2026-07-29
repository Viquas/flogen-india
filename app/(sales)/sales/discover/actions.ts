'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireSales } from '@/lib/auth/require-sales'
import { discoverLeads } from '@/lib/lead-discovery'

const discoverSchema = z.object({
    searchTerm: z.string().trim().max(120).optional().default(''),
    location: z.string().trim().max(120).optional().default(''),
    industry: z.string().trim().max(120).optional().default(''),
    entries: z.coerce.number().int().min(1).max(100).default(20),
    pool: z.enum(['website', 'automation']).default('website'),
    // Map-selected area (radius pin or suburb centroid). Biases the Places search.
    circle: z
        .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            radiusKm: z.number().min(0.5).max(50),
        })
        .optional(),
    territoryId: z.string().uuid().optional(),
})

export type DiscoverInput = z.input<typeof discoverSchema>

export type DiscoverResult =
    | { success: true; savedCount: number; promotedCount: number; skippedCount: number; pool: 'website' | 'automation' }
    | { success: false; message: string }

/**
 * Rep-initiated lead discovery. Runs a Google Places search for the given
 * area + genre, saves results to lead_lists, and promotes callable leads into
 * `projects` (status='lead') owned by the current rep so they appear in the
 * sales workspace immediately. Kills the "CSV chasm" — no export/re-import.
 */
export async function discoverSalesLeads(input: DiscoverInput): Promise<DiscoverResult> {
    const { userId } = await requireSales()

    const parsed = discoverSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, message: 'Please check the discovery fields and try again.' }
    }
    const { searchTerm, location, industry, entries, pool, circle, territoryId } = parsed.data

    if (!searchTerm && !industry) {
        return { success: false, message: 'Enter a business type (e.g. "plumbers") or pick an industry.' }
    }
    if (!location && !circle) {
        return { success: false, message: 'Pick an area on the map or type a location.' }
    }

    try {
        const result = await discoverLeads({
            query: searchTerm || industry,
            location,
            industry,
            entries,
            pool,
            promote: true,
            assignedTo: userId,
            circle,
            territoryId,
        })

        if (result.savedCount === 0 && result.reason) {
            const message =
                result.reason === 'out_of_niche'
                    ? 'No businesses in a supported automation niche were found here. Try a different industry or area.'
                    : 'Found businesses with websites, but none scored high enough for an automation pitch. Try a broader area or a different niche.'
            return { success: false, message }
        }

        revalidatePath('/sales/leads')
        return {
            success: true,
            savedCount: result.savedCount,
            promotedCount: result.promotedCount,
            skippedCount: result.skippedCount,
            pool,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Discovery failed. Please try again.'
        return { success: false, message }
    }
}
