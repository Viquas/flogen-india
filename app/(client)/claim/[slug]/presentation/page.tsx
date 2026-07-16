/**
 * "Your New Website — Ready to Claim" — presentation deck for website-pool
 * leads (~8 slides). Server-rendered, zero client JS. 16:9 slides on screen,
 * exact 297mm x 167mm pages in print (lib/presentations/pdf.ts renders this
 * route to PDF).
 *
 * Data-driven slides (audit findings, screenshot) are omitted entirely when
 * their data is missing — no placeholder content.
 */

import { cache } from 'react'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNicheFamily, getFamilyDesign } from '@/lib/presentations/registry'
import {
    deckCss,
    deckDate,
    extractDeckBusiness,
    siteBaseUrl,
} from '@/lib/presentations/deck'
import {
    DISPLAY_PRICING,
    HOSTING_PRICING,
    CURRENCY_SYMBOL,
    CLAIM_WINDOW_DAYS,
} from '@/lib/claim-pricing'

interface PresentationPageProps {
    params: Promise<{ slug: string }>
}

const COLUMNS =
    'id, slug, business_data, industry, pool, audit_signals, screenshot_url, claim_expires_at, lead_list_id'

// Cached lookup — dedupes between generateMetadata and the page render.
// Cast to any: pool/audit_signals/lead_list_id are new columns not yet in the
// generated types (same pattern as app/(client)/pitch/[slug]/page.tsx).
const getProjectBySlug = cache(async (slug: string) => {
    const supabase = createAdminClient() as any
    let { data: project } = await supabase
        .from('projects')
        .select(COLUMNS)
        .eq('slug', slug)
        .maybeSingle()

    if (!project) {
        const result = await supabase
            .from('projects')
            .select(COLUMNS)
            .eq('id', slug)
            .maybeSingle()
        project = result.data
    }
    return project
})

export async function generateMetadata({ params }: PresentationPageProps): Promise<Metadata> {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) return { title: 'Your New Website' }

    const business = extractDeckBusiness(project.business_data, project.industry)
    return {
        title: `${business.name} — Your New Website`,
        description: `A professional website built for ${business.name}, ready to claim.`,
        robots: { index: false, follow: false },
    }
}

/* ------------------------------------------------------------------ */
/* Audit findings                                                      */
/* ------------------------------------------------------------------ */

interface AuditSignalsLike {
    reachable?: boolean
    has_booking?: boolean
    has_chat?: boolean
    mobile_friendly?: boolean
    has_ssl?: boolean
    page_load_ms?: number | null
    has_title?: boolean
    has_meta_description?: boolean
    h1_count?: number
    img_alt_coverage?: number | null
}

interface Finding {
    title: string
    detail: string
}

function auditFindings(signals: AuditSignalsLike | null): Finding[] {
    if (!signals || typeof signals !== 'object') return []
    // Site was never actually loaded (bot-block/timeout/DNS) — we cannot honestly
    // claim any specific fault. Show no findings rather than fabricated ones; the
    // deck omits the "what we found" slide entirely when this is empty.
    if (signals.reachable === false) return []
    const findings: Finding[] = []
    if (signals.has_ssl === false) {
        findings.push({
            title: 'No SSL certificate',
            detail: 'Browsers flag the site as "Not secure" — an instant trust killer for new customers.',
        })
    }
    if (signals.mobile_friendly === false) {
        findings.push({
            title: 'Not mobile-friendly',
            detail: 'Most local searches happen on a phone. A site that breaks on mobile loses those visitors.',
        })
    }
    if (typeof signals.page_load_ms === 'number' && signals.page_load_ms > 3000) {
        findings.push({
            title: `Slow to load — ${(signals.page_load_ms / 1000).toFixed(1)}s`,
            detail: 'Visitors give up in about 3 seconds. Every extra second costs enquiries.',
        })
    }
    if (signals.has_booking === false) {
        findings.push({
            title: 'No way to book online',
            detail: 'Customers researching after hours can’t book — so they call whoever answers first tomorrow.',
        })
    }
    if (signals.has_chat === false) {
        findings.push({
            title: 'No instant answers',
            detail: 'No chat or quick-enquiry option means questions wait — and warm leads go cold.',
        })
    }
    // SEO / on-page findings — only when the signal was actually captured.
    if (signals.has_meta_description === false) {
        findings.push({
            title: 'Blank Google preview',
            detail: 'With no meta description, Google shows a blank or scraped snippet in search — fewer people click through.',
        })
    }
    if (signals.has_title === false) {
        findings.push({
            title: 'No page title',
            detail: 'Search engines and browser tabs have nothing to show — the site looks unfinished and ranks poorly.',
        })
    }
    if (typeof signals.h1_count === 'number' && signals.h1_count === 0) {
        findings.push({
            title: 'No clear headline',
            detail: 'The page has no main heading, so visitors and Google both struggle to tell what the business does.',
        })
    }
    if (typeof signals.img_alt_coverage === 'number' && signals.img_alt_coverage < 0.5) {
        findings.push({
            title: 'Images invisible to Google',
            detail: 'Most images have no alt text, so search engines can’t read them and the site is harder to find.',
        })
    }
    return findings.slice(0, 4)
}

const NO_WEBSITE_POINTS: Finding[] = [
    {
        title: 'Invisible on Google',
        detail: 'People searching for your service find competitors with websites — you never even enter the race.',
    },
    {
        title: 'No after-hours front door',
        detail: 'Most people research at night. Without a site, there is nowhere to read about you, see photos, or leave details.',
    },
    {
        title: 'Word of mouth stops short',
        detail: 'A referral looks you up before calling. With nothing to find, some of those referrals quietly go elsewhere.',
    },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface Slide {
    dark?: boolean
    /** Suppress the page-counter footer (full-bleed imagery slides). */
    noFoot?: boolean
    body: ReactNode
}

export default async function WebsitePresentationPage({ params }: PresentationPageProps) {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) notFound()
    // Website deck only. Legacy website-pool rows may have pool = null.
    if (project.pool && project.pool !== 'website') notFound()

    const business = extractDeckBusiness(project.business_data, project.industry)
    const design = getFamilyDesign(getNicheFamily(business.industry))
    const urlSlug = project.slug || project.id
    const claimUrl = `${siteBaseUrl()}/claim/${urlSlug}`

    // Audit signals: project column first, else the originating lead_lists row.
    let signals: AuditSignalsLike | null =
        (project.audit_signals as AuditSignalsLike | null) || null
    if (!signals && project.lead_list_id) {
        const supabase = createAdminClient() as any
        const { data: lead } = await supabase
            .from('lead_lists')
            .select('audit_signals')
            .eq('id', project.lead_list_id)
            .maybeSingle()
        signals = (lead?.audit_signals as AuditSignalsLike | null) || null
    }

    const findings = auditFindings(signals)
    const hasWebsite = !!business.website

    const claimExpiry = project.claim_expires_at
        ? new Date(project.claim_expires_at).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : null

    const slides: Slide[] = []

    // 1. Cover
    const coverImage = business.photoUrls[0] || project.screenshot_url || null
    slides.push({
        dark: true,
        body: (
            <>
                {coverImage && <img className="bleed" src={coverImage} alt="" />}
                <div className="scrim" />
                <div className="s cover">
                    <div className="kicker">Your New Website — Ready to Claim</div>
                    <h1 className="display cover-name">{business.name}</h1>
                    <div className="cover-rule" />
                    <div className="cover-meta">
                        <span>
                            Built for {business.name}
                            {business.address ? ` · ${business.address}` : ''}
                        </span>
                        <span>{deckDate()}</span>
                    </div>
                </div>
            </>
        ),
    })

    // 2. What we found — real findings, or the no-website case. Omitted when
    //    there is a website but no audit data (no placeholder content).
    if (findings.length > 0) {
        slides.push({
            body: (
                <div className="s">
                    <div className="kicker">What we found</div>
                    <h2 className="display title">
                        Your current site is working against you.
                    </h2>
                    <div
                        className="cards"
                        style={{
                            gridTemplateColumns: `repeat(${findings.length === 4 ? 2 : findings.length}, 1fr)`,
                        }}
                    >
                        {findings.map((f) => (
                            <div className="card" key={f.title}>
                                <h3>{f.title}</h3>
                                <p className="evidence" style={{ fontStyle: 'normal' }}>
                                    {f.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        })
    } else if (!hasWebsite) {
        slides.push({
            body: (
                <div className="s">
                    <div className="kicker">What we found</div>
                    <h2 className="display title">
                        We couldn&rsquo;t find a website for {business.name} — here&rsquo;s
                        what that costs.
                    </h2>
                    <div className="cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {NO_WEBSITE_POINTS.map((f) => (
                            <div className="card" key={f.title}>
                                <h3>{f.title}</h3>
                                <p className="evidence" style={{ fontStyle: 'normal' }}>
                                    {f.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        })
    }

    // 3. The rebuild — full-bleed screenshot. Omitted when no screenshot.
    if (project.screenshot_url) {
        slides.push({
            dark: true,
            noFoot: true,
            body: (
                <>
                    <img className="bleed" src={project.screenshot_url} alt="" style={{ objectPosition: 'top' }} />
                    <div className="shot-band">
                        <span>The rebuild — already designed and built for {business.name}</span>
                        <span>{claimUrl.replace(/^https?:\/\//, '')}</span>
                    </div>
                </>
            ),
        })
    }

    // 4. What's included
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">What&rsquo;s included</div>
                <h2 className="display title">Everything a modern site needs. Nothing you don&rsquo;t.</h2>
                <div className="cards" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="card">
                        <h3>Looks right on every screen</h3>
                        <p className="evidence" style={{ fontStyle: 'normal' }}>
                            Designed mobile-first — crisp on a phone, a tablet and a desktop.
                        </p>
                    </div>
                    <div className="card">
                        <h3>Built to be found</h3>
                        <p className="evidence" style={{ fontStyle: 'normal' }}>
                            SEO fundamentals done properly: titles, descriptions, structure
                            and local business details Google understands.
                        </p>
                    </div>
                    <div className="card">
                        <h3>Fast to load</h3>
                        <p className="evidence" style={{ fontStyle: 'normal' }}>
                            Lightweight pages that open in moments — before visitors think
                            about leaving.
                        </p>
                    </div>
                    <div className="card">
                        <h3>Clear ways to reach you</h3>
                        <p className="evidence" style={{ fontStyle: 'normal' }}>
                            Tap-to-call, directions and a contact form front and centre, so
                            an interested visitor becomes an enquiry.
                        </p>
                    </div>
                </div>
            </div>
        ),
    })

    // 5. How claiming works
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">How claiming works</div>
                <h2 className="display title">Live in days, not months.</h2>
                <ol className="flow" style={{ maxWidth: '64cqw' }}>
                    <li>
                        <span>Claim your site on the claim page — it takes a couple of minutes.</span>
                    </li>
                    <li>
                        <span>
                            Send us your logo, photos and any wording changes through a simple
                            form. We handle every edit for you.
                        </span>
                    </li>
                    <li>
                        <span>
                            Your polished site goes live in 2–3 business days, hosted and
                            looked after by us.
                        </span>
                    </li>
                </ol>
            </div>
        ),
    })

    // 6. Pricing + claim window (from lib/claim-pricing.ts)
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">Simple pricing</div>
                <h2 className="display title">One payment. No surprises.</h2>
                <div className="invest">
                    <div>
                        <div className="invest-label">Standard</div>
                        <div className="display invest-num">
                            {CURRENCY_SYMBOL}
                            {DISPLAY_PRICING.standard}
                        </div>
                        <div className="invest-sub">
                            One-off, then {CURRENCY_SYMBOL}
                            {HOSTING_PRICING.standard.display}/mo hosting.
                        </div>
                    </div>
                    <div>
                        <div className="invest-label">Pro</div>
                        <div className="display invest-num">
                            {CURRENCY_SYMBOL}
                            {DISPLAY_PRICING.pro}
                        </div>
                        <div className="invest-sub">
                            One-off, then {CURRENCY_SYMBOL}
                            {HOSTING_PRICING.pro.display}/mo hosting.
                        </div>
                    </div>
                </div>
                <p className="roi">
                    {claimExpiry
                        ? `This build is reserved for ${business.name} until ${claimExpiry}. After that, the design is released.`
                        : `This build is reserved for ${business.name} for ${CLAIM_WINDOW_DAYS} days from delivery. After that, the design is released.`}
                </p>
            </div>
        ),
    })

    // 7. Claim CTA
    slides.push({
        dark: true,
        body: (
            <div className="s cta">
                <div className="kicker">Claim it</div>
                <h2 className="display title">It&rsquo;s already yours. Just say so.</h2>
                <p className="lede" style={{ maxWidth: '60cqw' }}>
                    See the full site live, exactly as your customers would:
                </p>
                <div className="cta-url">{claimUrl}</div>
                <p className="body" style={{ color: 'var(--muted)' }}>
                    Reply to this email or call us — we&rsquo;ll walk you through it.
                </p>
            </div>
        ),
    })

    return (
        <main className="deck">
            <style dangerouslySetInnerHTML={{ __html: deckCss(design) }} />
            {slides.map((slide, i) => (
                <section key={i} className={slide.dark ? 'dark' : undefined}>
                    {slide.body}
                    {i > 0 && !slide.noFoot && (
                        <div className="foot">
                            <span>{business.name} · Website Proposal</span>
                            <span>
                                {String(i + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                </section>
            ))}
        </main>
    )
}
