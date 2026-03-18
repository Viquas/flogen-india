import { NextRequest } from 'next/server'
import { streamWebsiteCode } from '@/lib/ai/generator'
import { BusinessDataSchema } from '@/lib/schemas/project'
import { recordCost, buildCostRecord } from '@/lib/ai/cost-tracker'

export const maxDuration = 300 // 5 minute timeout for streaming

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { rules, markdownContext, mode, model, ...otherData } = body

        let businessData = null
        if (mode === 'json') {
            const validationResult = BusinessDataSchema.safeParse(otherData)
            if (validationResult.success) {
                businessData = validationResult.data
            } else if (otherData.businessName || otherData.brandName || otherData.BrandIdentity || otherData.$$manifest) {
                businessData = otherData
            } else {
                return new Response(
                    JSON.stringify({ error: 'Invalid business data' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                )
            }
        }

        if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'AI API key not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Create a TransformStream to forward SSE events
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (event: string, data: any) => {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
                }

                try {
                    // Phase 1: Starting
                    sendEvent('phase', { phase: 'starting', message: 'Initializing AI model...' })

                    // Phase 2: Generating
                    sendEvent('phase', { phase: 'generating', message: 'Model is writing code...' })

                    const result = await streamWebsiteCode(businessData, rules, markdownContext, model)
                    let fullCode = ''
                    let charCount = 0

                    for await (const chunk of result.textStream) {
                        fullCode += chunk
                        charCount += chunk.length
                        sendEvent('delta', { text: chunk, tokenCount: charCount })
                    }

                    // Record cost from streaming result
                    try {
                        const usage = await result.usage
                        if (usage) {
                            recordCost(buildCostRecord(usage, model || 'default', 'stream-generation', null))
                        }
                    } catch (costErr) {
                        console.error('[Stream] Cost recording error (non-fatal):', costErr)
                    }

                    // Clean up markdown fences if present
                    if (fullCode.trim().startsWith('```')) {
                        fullCode = fullCode.trim()
                            .replace(/^```(?:tsx|typescript|jsx|javascript)?\n?/, '')
                            .replace(/\n?```$/, '')
                    }

                    // Phase 3: Saving
                    sendEvent('phase', { phase: 'saving', message: 'Saving to database...' })

                    // Save to database (same logic as test route)
                    let projectId = null
                    try {
                        const { createAdminClient } = await import('@/lib/supabase/admin')
                        const supabase = createAdminClient()

                        const { data: batch } = await supabase
                            .from('batches')
                            .insert({
                                source: 'web-ui',
                                status: 'processing' as const,
                                metadata: { type: 'stream-generation' },
                            })
                            .select()
                            .single()

                        const { data: project, error: projectError } = await supabase
                            .from('projects')
                            .insert({
                                batch_id: batch?.id || null,
                                business_data: businessData,
                                generated_code: fullCode,
                                status: 'review' as const,
                                version: 1,
                            })
                            .select()
                            .single()

                        if (!projectError && project) {
                            projectId = project.id
                            const { saveCodeToDisk } = await import('@/lib/file-utils')
                            await saveCodeToDisk(projectId, fullCode)
                        }

                        if (batch && !projectError && projectId) {
                            await supabase
                                .from('batches')
                                .update({ status: 'completed' as const })
                                .eq('id', batch.id)
                        }
                    } catch (dbError) {
                        console.error('[Stream] Database error (non-fatal):', dbError)
                    }

                    sendEvent('done', { code: fullCode, projectId, tokenCount: charCount })

                } catch (error) {
                    console.error('[Stream] Generation error:', error)
                    sendEvent('error', {
                        message: error instanceof Error ? error.message : 'Generation failed'
                    })
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('[Stream] Critical error:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Stream setup failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
