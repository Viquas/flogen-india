import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { razorpay, getRazorpayPublicKey } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

const bodySchema = z.object({
    type: z.enum(['agent_support', 'domain_setup']),
})

export async function POST(request: Request) {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return Response.json(
                { error: 'Not authenticated', code: 'UNAUTHORIZED' },
                { status: 401 }
            )
        }

        // Validate body
        const body = await request.json()
        const parsed = bodySchema.safeParse(body)

        if (!parsed.success) {
            return Response.json(
                { error: 'Invalid request type', code: 'INVALID_INPUT' },
                { status: 400 }
            )
        }

        const { type } = parsed.data

        // Get user's active claim
        const admin = createAdminClient()
        const { data: claim } = await admin
            .from('claims')
            .select('id, project_id')
            .eq('auth_user_id', user.id)
            .in('status', ['paid', 'customizing', 'completed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!claim) {
            return Response.json(
                { error: 'No active claim found', code: 'NO_CLAIM' },
                { status: 404 }
            )
        }

        // Create Razorpay order for $49
        const order = await razorpay.orders.create({
            amount: 4900,
            currency: 'USD',
            notes: {
                type,
                claim_id: claim.id,
                project_id: claim.project_id,
                auth_user_id: user.id,
            },
        })

        console.log('[Portal/AgentPayment] Order created:', order.id, 'type:', type, 'claim:', claim.id)

        return Response.json({
            orderId: order.id,
            amount: order.amount,
            keyId: getRazorpayPublicKey(),
        })
    } catch (error) {
        console.error('[Portal/AgentPayment] Failed:', error)
        return Response.json(
            { error: 'Failed to create payment order', code: 'SERVER_ERROR' },
            { status: 500 }
        )
    }
}
