import { NextRequest, NextResponse } from 'next/server'
import { reviseWebsite } from '@/lib/ai/generator'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { prompt, currentCode, currentJson, rules } = body

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            )
        }

        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        // Parse JSON if it's a string
        let parsedJson = currentJson
        if (typeof currentJson === 'string') {
            try {
                parsedJson = JSON.parse(currentJson)
            } catch (e) {
                console.warn('Failed to parse current JSON, using as raw string context')
            }
        }

        // Generate revision
        const { code, updatedJson } = await reviseWebsite(prompt, currentCode, parsedJson, rules)

        return NextResponse.json({
            success: true,
            code,
            updatedJson,
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
