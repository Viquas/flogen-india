import { NextRequest, NextResponse } from 'next/server'
import { generateWebsiteCode } from '@/lib/ai/generator'
import { BusinessDataSchema } from '@/lib/schemas/project'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { rules, markdownContext, mode, model, ...otherData } = body

        let businessData = null
        if (mode === 'json') {
            // Validate input for JSON mode
            // Try basic schema first, then accept any valid JSON object with minimum fields
            const validationResult = BusinessDataSchema.safeParse(otherData)
            if (validationResult.success) {
                businessData = validationResult.data
            } else if (otherData.businessName || otherData.brandName || otherData.BrandIdentity || otherData.$$manifest) {
                // Accept enriched/rich JSON format that has different structure
                businessData = otherData
            } else {
                return NextResponse.json(
                    { success: false, error: 'Invalid business data', details: validationResult.error.flatten() },
                    { status: 400 }
                )
            }
        }

        // Check for API key
        if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'AI API key not configured' },
                { status: 500 }
            )
        }

        console.log(`[API/Generate/Test] Data validated (${mode} mode), proceeding to AI generation`)

        // Generate code first (since this is the primary goal)
        const genResult = await generateWebsiteCode(businessData, rules, markdownContext, model)
        const code = genResult.code
        console.log('[API/Generate/Test] AI generation successful, length:', code.length)

        // Try database operations but don't fail the whole request if they fail
        let projectId = null
        try {
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const supabase = createAdminClient()

            // Create a batch (if needed) - using admin client so RLS is bypassed
            const { data: batch, error: batchError } = await supabase
                .from('batches')
                .insert({
                    source: 'web-ui',
                    status: 'processing' as const,
                    metadata: { type: 'test-generation' },
                })
                .select()
                .single()

            if (batchError) {
                console.warn('[API/Generate/Test] Batch create failed:', batchError.message)
            }

            // Create project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                    batch_id: batch?.id || null,
                    business_data: businessData,
                    generated_code: code,
                    status: 'review' as const,
                    version: 1,
                })
                .select()
                .single()

            if (projectError) {
                console.warn('[API/Generate/Test] Project create failed:', projectError.message)
            } else {
                projectId = project.id
                console.log('[API/Generate/Test] Project record created:', projectId)

                // Save to local disk as requested
                const { saveCodeToDisk } = await import('@/lib/file-utils')
                await saveCodeToDisk(projectId, code)

                // Generate screenshot in the background
                import('@/lib/screenshot').then(({ generateScreenshot }) => {
                    generateScreenshot(projectId!, code).catch((err) => {
                        console.error('[API/Generate/Test] Screenshot error (non-fatal):', err)
                    })
                })
            }

            if (batch && !projectError && projectId) {
                await supabase
                    .from('batches')
                    .update({ status: 'completed' as const })
                    .eq('id', batch.id)
            }
        } catch (dbError) {
            console.error('[API/Generate/Test] Database error (ignoring for test):', dbError)
        }

        return NextResponse.json({
            success: true,
            code,
            projectId,
            message: projectId ? 'Website generated and saved' : 'Website generated (saved to dashboard skipped)'
        })
    } catch (error) {
        console.error('[API/Generate/Test] Critical error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        )
    }
}
