import sharp from 'sharp'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { GEMINI_IMAGE } from '@/lib/ai/model-ids'

interface BgRemovalResult {
    success: boolean
    resultBuffer?: Buffer
    error?: string
}

/** Max dimension for Gemini input (prevents timeout on large images) */
const MAX_DIMENSION = 2000

/**
 * Remove logo background using Gemini green-screen approach.
 *
 * 1. Resize to max 2000px (downscale only, preserve aspect ratio)
 * 2. Ask Gemini to replace background with solid #00FF00 green
 * 3. Use sharp to replace green pixels with alpha transparency
 */
export async function removeLogoBackground(
    imageBuffer: Buffer,
    mimeType: string
): Promise<BgRemovalResult> {
    try {
        // Step 1: Resize to max dimension (downscale only)
        const metadata = await sharp(imageBuffer).metadata()
        const { width = 0, height = 0 } = metadata
        const longestEdge = Math.max(width, height)

        let resizedBuffer = imageBuffer
        if (longestEdge > MAX_DIMENSION) {
            resizedBuffer = await sharp(imageBuffer)
                .resize({
                    width: width >= height ? MAX_DIMENSION : undefined,
                    height: height > width ? MAX_DIMENSION : undefined,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .toBuffer()
        }

        // Step 2: Call Gemini to replace background with green
        const { files } = await generateText({
            model: google(GEMINI_IMAGE),
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Replace ONLY the background of this logo with solid chromakey green (#00FF00). Keep the logo subject EXACTLY as-is -- do not modify any colors, text, shapes, or details. The entire background must be a single uniform #00FF00 green with NO gradients, shadows, or variation.',
                        },
                        {
                            type: 'image',
                            image: resizedBuffer,
                            mediaType: mimeType,
                        },
                    ],
                },
            ],
            providerOptions: {
                google: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            },
        })

        // Step 3: Extract image from result
        const imageFile = files?.find((f) => f.mediaType?.startsWith('image/'))
        if (!imageFile) {
            return { success: false, error: 'Gemini did not return an image' }
        }

        // Step 4: Replace green pixels with transparency
        const greenScreenBuffer = Buffer.from(imageFile.uint8Array)
        const resultBuffer = await replaceGreenWithAlpha(greenScreenBuffer)

        return { success: true, resultBuffer }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Logo BG Removal] Failed:', message)
        return { success: false, error: message }
    }
}

/**
 * Replace chromakey green (#00FF00) pixels with full transparency.
 * Uses HSV-style thresholds: high green, low red and blue.
 */
async function replaceGreenWithAlpha(imageBuffer: Buffer): Promise<Buffer> {
    const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8Array(data)

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]

        // Green detection: high green channel, low red and blue
        if (g > 180 && r < 120 && b < 120) {
            pixels[i + 3] = 0 // Set alpha to transparent
        }
    }

    return sharp(Buffer.from(pixels.buffer), {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4,
        },
    })
        .png()
        .toBuffer()
}
