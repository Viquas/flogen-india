import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateDomainSuggestions } from '@/lib/portal/domain-suggest'
import { checkDomainAvailability, type DomainStatus } from '@/lib/portal/domain-search'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const bodySchema = z.object({
    businessName: z.string().min(1, 'Business name is required'),
    category: z.string().min(1, 'Category is required'),
    unavailableDomain: z.string().min(1, 'Unavailable domain is required'),
})

/**
 * Batch-check domains for availability (max 5 concurrent).
 * Returns only those with summary === 'inactive' (available).
 */
async function batchCheckAvailability(
    domains: string[]
): Promise<Array<{ domain: string; available: boolean }>> {
    const results: Array<{ domain: string; available: boolean }> = []
    const batchSize = 5

    for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize)
        const settled = await Promise.allSettled(
            batch.map((d) => checkDomainAvailability(d))
        )

        for (let j = 0; j < settled.length; j++) {
            const result = settled[j]
            const domain = batch[j]

            if (result.status === 'fulfilled' && result.value.length > 0) {
                const status: DomainStatus = result.value[0]
                results.push({
                    domain,
                    available: status.summary === 'inactive',
                })
            } else {
                // If check failed, mark as unavailable to be safe
                results.push({ domain, available: false })
            }
        }
    }

    return results
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated', code: 'UNAUTHORIZED' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const parsed = bodySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: parsed.error.issues[0].message,
                    code: 'VALIDATION_ERROR',
                },
                { status: 400 }
            )
        }

        const { businessName, category, unavailableDomain } = parsed.data

        // First round: generate 20 suggestions
        console.log(`[Portal/Domain] Generating AI suggestions for "${businessName}"`)
        const firstRound = await generateDomainSuggestions(
            businessName,
            category,
            unavailableDomain
        )

        let checked = await batchCheckAvailability(firstRound)
        let available = checked.filter((d) => d.available)

        // Second round if fewer than 3 available
        if (available.length < 3) {
            console.log(`[Portal/Domain] Only ${available.length} available, generating more`)
            const secondRound = await generateDomainSuggestions(
                businessName,
                category,
                `${unavailableDomain} (also tried: ${firstRound.slice(0, 5).join(', ')})`
            )

            // Filter out already-checked domains
            const alreadyChecked = new Set(checked.map((d) => d.domain))
            const newDomains = secondRound.filter((d) => !alreadyChecked.has(d))

            const secondChecked = await batchCheckAvailability(newDomains)
            const secondAvailable = secondChecked.filter((d) => d.available)

            available = [...available, ...secondAvailable]
        }

        console.log(`[Portal/Domain] Returning ${available.length} available suggestions`)

        return NextResponse.json({ suggestions: available })
    } catch (error) {
        console.error('[Portal/Domain] Suggest route error:', error)
        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        )
    }
}
