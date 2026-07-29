import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { generateText } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { recordCost, buildCostRecord, getModelId } from '@/lib/ai/cost-tracker'

const REFINEMENT_SYSTEM_PROMPT = `You are an expert React Developer refining an existing landing page component.

## YOUR TASK:
You will receive the CURRENT CODE of a React component and a user's request for changes.
You must modify the code according to the user's request and return the COMPLETE, UPDATED component.

## STRICT REQUIREMENTS:
1. You MUST use shadcn/ui components with imports from '@/components/ui/[component]'
2. You MUST use Tailwind CSS classes for ALL styling - NO external CSS libraries
3. You MUST output a SINGLE functional component named 'GeneratedPage'
4. You MUST use lucide-react icons with import from 'lucide-react'
5. Return ONLY the complete updated TypeScript/React code, no explanations

## AVAILABLE SHADCN COMPONENTS:
- Button: import { Button } from '@/components/ui/button' - variants: default, destructive, outline, secondary, ghost, link
- Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription: import { Card, ... } from '@/components/ui/card'
- Input: import { Input } from '@/components/ui/input'
- Badge: import { Badge } from '@/components/ui/badge'

## IF IMAGES ARE PROVIDED:
- Incorporate them into the code using <img src="URL" /> tags
- Create a gallery section if multiple images are provided
- Use appropriate styling for the images (rounded corners, shadows, responsive sizing)

## DESIGN GUIDELINES:
- Maintain the existing design style unless explicitly asked to change it
- Keep the layout responsive
- Apply the user's requested changes precisely`

const getRefineModel = () => {
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return google('gemini-3.1-pro-preview')
    }
    if (process.env.OPENAI_API_KEY) {
        return openai('gpt-4o')
    }
    if (process.env.OPENROUTER_API_KEY) {
        const openrouter = createOpenAI({
            name: 'openrouter',
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
        })
        return openrouter('openai/gpt-4o')
    }
    return openai('gpt-4o')
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    try {
        const { projectId, message, imageUrls } = await req.json()

        if (!projectId) {
            return NextResponse.json(
                { success: false, error: 'Project ID required' },
                { status: 400 }
            )
        }

        if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'AI API key not configured' },
                { status: 500 }
            )
        }

        // Fetch current project code
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('generated_code, business_data')
            .eq('id', projectId)
            .single()

        if (fetchError || !project) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            )
        }

        // Build the user prompt
        let userPrompt = `## CURRENT CODE:\n\`\`\`tsx\n${project.generated_code || 'No code generated yet'}\n\`\`\`\n\n`

        if (imageUrls && imageUrls.length > 0) {
            userPrompt += `## NEW IMAGES TO INCORPORATE:\n${imageUrls.map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}\n\n`
        }

        userPrompt += `## USER REQUEST:\n${message || 'Add the provided images to the page.'}\n\n`
        userPrompt += `Please update the component according to the request and return the COMPLETE updated code.`

        // Generate refined code
        const refineModel = getRefineModel()
        const { text, usage } = await generateText({
            model: refineModel,
            system: REFINEMENT_SYSTEM_PROMPT,
            prompt: userPrompt,
        })
        // Track cost for refinement call (project_id available from request)
        await recordCost(buildCostRecord(usage, getModelId(refineModel), 'refinement', projectId))

        // Clean up the response
        let code = text.trim()
        if (code.startsWith('```')) {
            code = code.replace(/^```(?:tsx|typescript|jsx|javascript)?\n?/, '')
            code = code.replace(/\n?```$/, '')
        }

        // Update project with new code and create revision snapshot
        const { updateProjectWithCode } = await import('@/lib/ai/generator')
        const updateResult = await updateProjectWithCode(projectId, code)

        if (!updateResult.success) {
            console.error('Failed to update project:', updateResult.error)
            return NextResponse.json(
                { success: false, error: 'Failed to save updated code' },
                { status: 500 }
            )
        }

        // Fire-and-forget screenshot refresh
        try {
            const { generateScreenshot } = await import('@/lib/screenshot')
            generateScreenshot(projectId, code).catch(() => {})
        } catch {}

        return NextResponse.json({ success: true, code })
    } catch (error) {
        console.error('Refinement error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Refinement failed' },
            { status: 500 }
        )
    }
}
