import { NextRequest, NextResponse } from 'next/server'
import { reviseWebsiteWithPatches, reviseWebsite } from '@/lib/ai/generator'
import { withApiMiddleware, apiSuccess } from '@/lib/middleware/api'
import { BadRequestError } from '@/lib/middleware/errors'

export const POST = withApiMiddleware(
    async (req, { body }) => {
        const { prompt, currentCode, currentJson, rules, model, projectId, imageUrls } = body as any

        if (!prompt) {
            throw new BadRequestError('Prompt is required')
        }

        // imageUrls are passed directly to the revision function for multimodal analysis

        let parsedJson = currentJson
        if (typeof currentJson === 'string') {
            try {
                parsedJson = JSON.parse(currentJson)
            } catch {
                // Use as raw string context
            }
        }

        if (currentCode && currentCode.trim().length > 0) {
            const { code, updatedJson, patchCount, fallbackUsed, reasoning } =
                await reviseWebsiteWithPatches(prompt, currentCode, parsedJson, rules, model, imageUrls)

            // Persist revised code to DB + fire-and-forget screenshot
            if (projectId) {
                try {
                    const { updateProjectWithCode } = await import('@/lib/ai/generator')
                    await updateProjectWithCode(projectId, code)
                } catch (e) {
                    console.error('[Revision] Failed to persist code:', e)
                }
                try {
                    const { generateScreenshot } = await import('@/lib/screenshot')
                    generateScreenshot(projectId, code).catch(() => {})
                } catch {}
            }

            return apiSuccess({
                code,
                updatedJson,
                patchCount,
                fallbackUsed,
                reasoning,
                message: fallbackUsed
                    ? 'Website revised (full rewrite)'
                    : `Website revised (${patchCount} patch${patchCount !== 1 ? 'es' : ''} applied)`,
            })
        }

        const { code, updatedJson } = await reviseWebsite(prompt, currentCode, parsedJson, rules, model)

        // Persist revised code to DB + fire-and-forget screenshot
        if (projectId) {
            try {
                const { updateProjectWithCode } = await import('@/lib/ai/generator')
                await updateProjectWithCode(projectId, code)
            } catch (e) {
                console.error('[Revision] Failed to persist code:', e)
            }
            try {
                const { generateScreenshot } = await import('@/lib/screenshot')
                generateScreenshot(projectId, code).catch(() => {})
            } catch {}
        }

        return apiSuccess({
            code,
            updatedJson,
            patchCount: 0,
            fallbackUsed: true,
            reasoning: 'No existing code; generated from scratch.',
            message: 'Website revised successfully',
        })
    },
    {
        requireAiKeys: true,
    }
)
