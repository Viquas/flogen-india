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

/**
 * True if a hostname points at a private / loopback / link-local / internal target.
 * Used to refuse SSRF: captureExternalScreenshot drives a headless browser to a URL
 * that ultimately derives from lead data (Places websiteUri, but also bulk-CSV and
 * custom inputs), so an attacker-supplied "website" must not be able to make us load
 * internal services or the cloud metadata endpoint and surface it in a deck.
 */
function isBlockedHost(hostname: string): boolean {
    const h = hostname.toLowerCase().replace(/^\[|\]$/g, '') // strip IPv6 brackets
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) {
        return true
    }
    if (h === '::1' || h === '::' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) {
        return true // IPv6 loopback / unique-local / link-local
    }
    const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (m) {
        const [a, b] = [Number(m[1]), Number(m[2])]
        if (a === 127 || a === 10 || a === 0) return true // loopback / private / this-network
        if (a === 169 && b === 254) return true // link-local incl. 169.254.169.254 metadata
        if (a === 172 && b >= 16 && b <= 31) return true // private
        if (a === 192 && b === 168) return true // private
    }
    return false
}

/**
 * Screenshot an EXTERNAL live site (the prospect's real website) for "before/after"
 * proof in outreach decks. Fail-soft: returns null on any error (bad URL, timeout,
 * bot-block) — a missing before-shot must never break the pitch, and we never want a
 * broken/blocked capture masquerading as the prospect's site.
 */
export async function captureExternalScreenshot(
    url: string,
    opts: { width?: number; height?: number } = {},
): Promise<Buffer | null> {
    const target = url.trim()
    if (!/^https?:\/\//i.test(target)) return null
    // SSRF guard: only load public hosts.
    let parsed: URL
    try {
        parsed = new URL(target)
    } catch {
        return null
    }
    if (isBlockedHost(parsed.hostname)) {
        logger.screenshot.warn('Refused external screenshot of a private/internal host', { host: parsed.hostname })
        return null
    }

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(CHROMIUM_URL),
            headless: true,
        })
        const page = await browser.newPage()
        await page.setViewport({ width: opts.width ?? 1280, height: opts.height ?? 800 })
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        )
        const response = await page.goto(target, { waitUntil: 'networkidle2', timeout: 15000 })
        // Don't capture an error/blocked page as if it were the real site.
        if (response && response.status() >= 400) return null
        const buffer = await page.screenshot({ type: 'webp', quality: 80 })
        return Buffer.from(buffer)
    } catch (err) {
        logger.screenshot.error('External screenshot failed', {
            url: target,
            error: err instanceof Error ? err.message : String(err),
        })
        return null
    } finally {
        if (browser) await browser.close()
    }
}

/**
 * Capture the prospect's real site and store it as projects.audit_screenshot_url,
 * for a "before/after" slide in the pitch deck. Fire-and-forget; fail-soft.
 */
export async function captureAuditScreenshot(
    projectId: string,
    siteUrl: string,
): Promise<string | null> {
    const buffer = await captureExternalScreenshot(siteUrl)
    if (!buffer) return null

    const supabase = createAdminClient()
    const path = `${projectId}/before.webp`
    const { error: uploadError } = await supabase.storage
        .from('site-screenshots')
        .upload(path, buffer, { contentType: 'image/webp', upsert: true })
    if (uploadError) {
        logger.screenshot.error('Before-screenshot upload failed', { projectId, error: uploadError.message })
        return null
    }

    const { data } = supabase.storage.from('site-screenshots').getPublicUrl(path)
    // Cast: audit_screenshot_url (migration 20260716000003) not yet in generated types.
    const { error: colError } = await supabase.from('projects')
        .update({ audit_screenshot_url: data.publicUrl } as never)
        .eq('id', projectId)
    if (colError) {
        logger.screenshot.warn('Before-screenshot URL not persisted — is migration 20260716000003 applied?', {
            projectId,
            error: colError.message,
        })
        return null
    }
    return data.publicUrl
}

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

        // A page loaded via setContent has an opaque origin (like a srcdoc
        // iframe), so a relative /preview-runtime.js resolves to "null/..."
        // and never loads — the screenshot would capture an empty #root.
        // Inject an absolute runtime URL from the deploy origin instead.
        const base = (
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        ).replace(/\/$/, '')
        const html = constructHtmlBoilerplate(generatedCode, { runtimeUrl: `${base}/preview-runtime.js` })
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

        // Mobile QA: re-render at 375px, capture a mobile preview, and flag horizontal
        // overflow (a layout broken at phone width). CLAUDE.md requires every generated
        // site to look good at 375px; this makes that checkable. Fail-soft — a mobile
        // capture failure must not lose the desktop screenshot we already have.
        let mobileUrl: string | null = null
        let mobileOverflow: boolean | null = null
        try {
            await page.setViewport({ width: 375, height: 812 })
            // Let the layout reflow to the narrow viewport before measuring/capturing.
            await new Promise((r) => setTimeout(r, 300))
            mobileOverflow = await page.evaluate(() => {
                const el = document.documentElement
                // +1px tolerance for sub-pixel rounding.
                return el.scrollWidth > el.clientWidth + 1
            })
            const mobileBuffer = await page.screenshot({ type: 'webp', quality: 80 })
            const mobilePath = `${projectId}/preview-mobile.webp`
            const { error: mobileErr } = await supabase.storage
                .from('site-screenshots')
                .upload(mobilePath, mobileBuffer, { contentType: 'image/webp', upsert: true })
            if (!mobileErr) {
                mobileUrl = supabase.storage.from('site-screenshots').getPublicUrl(mobilePath).data.publicUrl
            }
            if (mobileOverflow) {
                logger.screenshot.warn('Generated site overflows at 375px', { projectId })
            }
        } catch (mobileErr) {
            logger.screenshot.error('Mobile QA capture failed', {
                projectId,
                error: mobileErr instanceof Error ? mobileErr.message : String(mobileErr),
            })
        }

        // Persist the desktop screenshot on its own FIRST. Writing it together with the
        // mobile QA columns would mean a single rejected UPDATE (e.g. migration
        // 20260716000004 not applied yet) silently loses screenshot_url too — every
        // generated site would end up with no preview image.
        await supabase.from('projects')
            .update({ screenshot_url: data.publicUrl })
            .eq('id', projectId)

        // Best-effort mobile QA columns. Cast: not in the generated types until the
        // migration is applied and types regenerated.
        const { error: qaError } = await supabase.from('projects')
            .update({
                screenshot_url_mobile: mobileUrl,
                mobile_overflow: mobileOverflow,
            } as never)
            .eq('id', projectId)
        if (qaError) {
            logger.screenshot.warn('Mobile QA columns not persisted — is migration 20260716000004 applied?', {
                projectId,
                error: qaError.message,
            })
        }

        return data.publicUrl
    } catch (err) {
        logger.screenshot.error('Screenshot generation failed', { projectId, error: err instanceof Error ? err.message : String(err) })
        return null
    } finally {
        if (browser) await browser.close()
    }
}
