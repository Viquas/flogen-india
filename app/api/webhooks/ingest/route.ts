import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BusinessDataSchema } from '@/lib/schemas/project'
import { withApiMiddleware, apiSuccess } from '@/lib/middleware/api'
import { UnauthorizedError } from '@/lib/middleware/errors'
import { generationQueue } from '@/lib/queue'

const WebhookPayloadSchema = z.union([
    BusinessDataSchema,
    z.array(BusinessDataSchema),
])

export const POST = withApiMiddleware(
    async (req, { body, requestId }) => {
        // Validate API key for webhook routes
        const apiKey = req.headers.get('x-api-key')
        const expectedKey = process.env.WEBHOOK_API_KEY
        if (expectedKey && apiKey !== expectedKey) {
            throw new UnauthorizedError('Invalid API key')
        }

        const payload = body
        const isArray = Array.isArray(payload)
        const items = isArray ? payload : [payload]

        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .insert({
                source: 'webhook',
                status: 'processing' as const,
                metadata: { count: items.length, requestId },
            })
            .select()
            .single()

        if (batchError) {
            console.error('Batch insert error:', batchError)
            return NextResponse.json(
                { success: false, error: 'Database error', code: 'DB_ERROR', requestId },
                { status: 500 }
            )
        }

        const projectsToInsert = items.map((data) => ({
            batch_id: batch.id,
            business_data: data as any,
            status: 'queued' as const,
            version: 1,
        }))

        const { data: insertedProjects, error: projectsError } = await supabase
            .from('projects')
            .insert(projectsToInsert)
            .select('id')

        if (projectsError) {
            console.error('Projects insert error:', projectsError)
            await supabase.from('batches').update({ status: 'failed' }).eq('id', batch.id)
            return NextResponse.json(
                { success: false, error: 'Failed to create projects', code: 'DB_ERROR', requestId },
                { status: 500 }
            )
        }

        if (insertedProjects) {
            const projectIds = insertedProjects.map(p => p.id)
            generationQueue.addBatch(projectIds)
        }

        return apiSuccess(
            {
                count: items.length,
                batchId: batch.id,
                message: 'Projects queued for generation',
            },
            202
        )
    },
    {
        bodySchema: WebhookPayloadSchema,
    }
)
