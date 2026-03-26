/**
 * Screenshot Generator
 *
 * Renders generated website HTML to a WebP screenshot using Puppeteer
 * and uploads it to Supabase Storage. Updates the project's screenshot_url.
 *
 * This function is designed to be called from batch processing pipelines
 * (e.g., after quality scoring in autopilot), NOT on page load.
 * Screenshot generation takes 5-15 seconds on Vercel serverless.
 */

import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'
import { logger } from '@/lib/logger'

const CHROMIUM_URL = process.env.CHROMIUM_REMOTE_URL
    || 'https://github.com/nicehash/chromium-bin/releases/download/v133.0.0/chromium-v133.0-pack.tar'

export async function generateScreenshot(
    projectId: string,
    generatedCode: string
): Promise<string | null> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(CHROMIUM_URL),
            headless: true,
        })
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })

        const html = constructHtmlBoilerplate(generatedCode)
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 })
        const buffer = await page.screenshot({ type: 'webp', quality: 80 })

        const supabase = createAdminClient()
        const path = `${projectId}/preview.webp`
        const { error: uploadError } = await supabase.storage
            .from('site-screenshots')
            .upload(path, buffer, {
                contentType: 'image/webp',
                upsert: true,
            })

        if (uploadError) {
            logger.screenshot.error('Upload failed', { projectId, error: uploadError.message })
            return null
        }

        const { data } = supabase.storage.from('site-screenshots').getPublicUrl(path)

        // Update project record with screenshot URL
        await supabase.from('projects')
            .update({ screenshot_url: data.publicUrl })
            .eq('id', projectId)

        return data.publicUrl
    } catch (err) {
        logger.screenshot.error('Screenshot generation failed', { projectId, error: err instanceof Error ? err.message : String(err) })
        return null
    } finally {
        if (browser) await browser.close()
    }
}
