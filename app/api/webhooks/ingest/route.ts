import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BusinessDataSchema } from '@/lib/schemas/project'
import { createClient } from '@/lib/supabase/server'
import { generationQueue } from '@/lib/queue'

// Accept single object or array of objects
const WebhookPayloadSchema = z.union([
    BusinessDataSchema,
    z.array(BusinessDataSchema),
])

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // 1. Validate payload
        const validationResult = WebhookPayloadSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, message: 'Validation failed', errors: validationResult.error.flatten() },
                { status: 400 }
            )
        }

        const payload = validationResult.data
        const isArray = Array.isArray(payload)
        const items = isArray ? payload : [payload]

        // 2. Create Supabase client (Use Admin to bypass RLS for ingestion)
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        // 3. Create batch record
        const { data: batch, error: batchError } = await supabase
            .from('batches')
            .insert({
                source: 'webhook',
                status: 'processing' as const,
                metadata: { count: items.length },
            })
            .select()
            .single()

        if (batchError) {
            console.error('Batch insert error:', batchError)
            return NextResponse.json(
                { success: false, message: 'Database error', details: batchError.message },
                { status: 500 }
            )
        }

        // 4. Insert projects
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
            // Mark batch as failed
            await supabase.from('batches').update({ status: 'failed' }).eq('id', batch.id)

            return NextResponse.json(
                { success: false, message: 'Failed to create projects', details: projectsError.message },
                { status: 500 }
            )
        }

        // 5. Queue generation for all projects (FR-04: Async Processing)
        if (insertedProjects) {
            const projectIds = insertedProjects.map(p => p.id)
            generationQueue.addBatch(projectIds)
        }

        // 6. Return 202 Accepted immediately (FR-04)
        return NextResponse.json(
            {
                success: true,
                count: items.length,
                batchId: batch.id,
                message: 'Projects queued for generation'
            },
            { status: 202 }
        )

    } catch (error) {
        console.error('Webhook processing error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
