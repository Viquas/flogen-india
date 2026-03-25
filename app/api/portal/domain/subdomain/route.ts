import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
    slug: z
        .string()
        .min(3, 'Subdomain must be at least 3 characters')
        .max(50, 'Subdomain must be at most 50 characters')
        .regex(
            /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
            'Subdomain must be lowercase alphanumeric with hyphens, no leading/trailing hyphens'
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

        const { slug } = parsed.data
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

        const subdomain = `${slug}.flogen.com`

        const { error: updateError } = await admin
            .from('claims')
            .update({
                domain_option: 'subdomain',
                domain_value: subdomain,
            })
            .eq('id', claim.id)

        if (updateError) {
            console.error('[Portal/Domain] Subdomain update failed:', updateError)
            return NextResponse.json(
                { error: 'Failed to save subdomain', code: 'DB_ERROR' },
                { status: 500 }
            )
        }

        console.log(`[Portal/Domain] Subdomain set: ${subdomain} for claim ${claim.id}`)

        return NextResponse.json({ success: true, subdomain })
    } catch (error) {
        console.error('[Portal/Domain] Subdomain route error:', error)
        return NextResponse.json(
            { error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        )
    }
}
