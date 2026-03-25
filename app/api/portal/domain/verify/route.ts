import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTxtRecord, generateVerificationToken } from '@/lib/portal/dns-verify'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

const bodySchema = z.object({
    domain: z
        .string()
        .min(3, 'Domain is required')
        .regex(
            /^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$/,
            'Invalid domain format'
        ),
})

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

        const { domain } = parsed.data
        const admin = createAdminClient()

        const { data: claim } = await admin
            .from('claims')
            .select('id')
            .eq('auth_user_id', user.id)
            .in('status', ['paid', 'customizing', 'completed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!claim) {
            return NextResponse.json(
                { error: 'No active claim found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        const token = generateVerificationToken(claim.id)
        const result = await verifyTxtRecord(domain, token)

        if (result.verified) {
            const { error: updateError } = await admin
                .from('claims')
                .update({
                    domain_option: 'existing',
                    domain_value: domain.toLowerCase(),
                })
                .eq('id', claim.id)

            if (updateError) {
                console.error('[Portal/Domain] Verify update failed:', updateError)
            } else {
                console.log(`[Portal/Domain] Domain verified: ${domain} for claim ${claim.id}`)
            }
        }

        return NextResponse.json({
            verified: result.verified,
            records: result.records,
            token,
        })
    } catch (error) {
        console.error('[Portal/Domain] Verify route error:', error)
        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        )
    }
}
