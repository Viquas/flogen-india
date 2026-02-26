import { NextRequest, NextResponse } from 'next/server'
import { reviseWebsiteWithPatches, reviseWebsite } from '@/lib/ai/generator'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { prompt, currentCode, currentJson, rules, model } = body

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            )
        }

        if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'AI API key not configured' },
                { status: 500 }
            )
        }

        let parsedJson = currentJson
        if (typeof currentJson === 'string') {
            try {
                parsedJson = JSON.parse(currentJson)
            } catch (e) {
                console.warn('Failed to parse current JSON, using as raw string context')
            }
        }

        // Use efficient patch-based revision when existing code is available
        if (currentCode && currentCode.trim().length > 0) {
            const { code, updatedJson, patchCount, fallbackUsed, reasoning } =
                await reviseWebsiteWithPatches(prompt, currentCode, parsedJson, rules, model)

            return NextResponse.json({
                success: true,
                code,
                updatedJson,
                patchCount,
                fallbackUsed,
                reasoning,
                message: fallbackUsed
                    ? 'Website revised (full rewrite)'
                    : `Website revised (${patchCount} patch${patchCount !== 1 ? 'es' : ''} applied)`
            })
        }

        // No existing code — use full generation-style rewrite
        const { code, updatedJson } = await reviseWebsite(prompt, currentCode, parsedJson, rules, model)

        return NextResponse.json({
            success: true,
            code,
            updatedJson,
            patchCount: 0,
            fallbackUsed: true,
            reasoning: 'No existing code; generated from scratch.',
            message: 'Website revised successfully'
        })
    } catch (error) {
        console.error('Revision error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Revision failed' },
            { status: 500 }
        )
    }
}
