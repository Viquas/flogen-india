/**
 * Presentation PDF Renderer
 *
 * Renders a deck route (/pitch/{slug}/presentation or /claim/{slug}/presentation)
 * to a 297mm x 167mm landscape PDF using Puppeteer, and uploads it to Supabase
 * Storage. Launch + upload pattern mirrors lib/screenshot.ts (same Chromium
 * pack, same bucket).
 *
 * Designed for API-route / batch use, NOT page load — rendering takes
 * 5-15 seconds on Vercel serverless.
 */

import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const CHROMIUM_URL = process.env.CHROMIUM_REMOTE_URL
    || 'https://github.com/nicehash/chromium-bin/releases/download/v133.0.0/chromium-v133.0-pack.tar'

/** Same env pattern used across lib/ for absolute URLs (see lib/outreach/email.ts). */
function getBaseUrl(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '')
}

/**
 * Render the deck at `path` (e.g. "/pitch/my-slug/presentation") to PDF and
 * upload it as presentations/{projectId}.pdf. Returns the public URL.
 * Throws on failure — callers surface the error as an API response.
 */
export async function renderPresentationPdf(
    path: string,
    projectId: string
): Promise<{ url: string }> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(CHROMIUM_URL),
            headless: true,
        })
        const page = await browser.newPage()
        // Match the printed page's pixel width (297mm ~ 1123px @96dpi) so any
        // viewport-relative CSS resolves the same on screen and in the PDF.
        await page.setViewport({ width: 1123, height: 631 })

        await page.goto(`${getBaseUrl()}${path}`, {
            waitUntil: 'networkidle0',
            timeout: 60000,
        })

        const pdf = await page.pdf({
            width: '297mm',
            height: '167mm',
            printBackground: true,
            preferCSSPageSize: true,
        })

        const supabase = createAdminClient()
        const storagePath = `presentations/${projectId}.pdf`
        const { error: uploadError } = await supabase.storage
            .from('site-screenshots')
            .upload(storagePath, Buffer.from(pdf), {
                contentType: 'application/pdf',
                upsert: true,
            })

        if (uploadError) {
            throw new Error(`Presentation upload failed: ${uploadError.message}`)
        }

        const { data } = supabase.storage.from('site-screenshots').getPublicUrl(storagePath)
        return { url: data.publicUrl }
    } catch (err) {
        logger.screenshot.error('Presentation PDF render failed', {
            projectId,
            path,
            error: err instanceof Error ? err.message : String(err),
        })
        throw err
    } finally {
        if (browser) await browser.close()
    }
}
