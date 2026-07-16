/**
 * Automation Growth Plan — presentation deck for automation-pool leads.
 *
 * Server-rendered, zero client JS. 16:9 slides on screen, exact 297mm x 167mm
 * pages in print (lib/presentations/pdf.ts renders this route to PDF).
 *
 * Content source: projects.automation_plan (validated against
 * AutomationPlanSchema) when present — ~10 slides. When absent, falls back to
 * the template pitch copy (buildPitchContent) as a shorter 6-slide deck.
 */

import { cache } from 'react'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AutomationPlanSchema, type AutomationPlan } from '@/lib/automation-plan/schema'
import { buildPitchContent } from '@/lib/pitch-content'
import { getNicheFamily, getFamilyDesign } from '@/lib/presentations/registry'
import {
    deckCss,
    deckDate,
    extractDeckBusiness,
    siteBaseUrl,
    type DeckBusiness,
} from '@/lib/presentations/deck'

interface PresentationPageProps {
    params: Promise<{ slug: string }>
}

const COLUMNS = 'id, slug, business_data, industry, pitch_angle, pool, automation_plan, plan_status, screenshot_url, audit_screenshot_url'

// Cached lookup — dedupes between generateMetadata and the page render.
// Cast to any: automation_plan/pool are new columns not yet in the generated
// types (same pattern as app/(client)/pitch/[slug]/page.tsx).
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
    if (!project) return { title: 'Automation Growth Plan' }

    const business = extractDeckBusiness(project.business_data, project.industry)
    return {
        title: `${business.name} — Automation Growth Plan`,
        description: `A custom automation plan prepared for ${business.name}.`,
        robots: { index: false, follow: false },
    }
}

interface Slide {
    dark?: boolean
    body: ReactNode
}

/* ------------------------------------------------------------------ */
/* Shared slides                                                       */
/* ------------------------------------------------------------------ */

function coverSlide(business: DeckBusiness, subtitle: string): Slide {
    const photo = business.photoUrls[0]
    return {
        dark: true,
        body: (
            <>
                {photo && <img className="bleed" src={photo} alt="" />}
                <div className="scrim" />
                <div className="s cover">
                    <div className="kicker">{subtitle}</div>
                    <h1 className="display cover-name">{business.name}</h1>
                    <div className="cover-rule" />
                    <div className="cover-meta">
                        <span>
                            Prepared exclusively for {business.name}
                            {business.address ? ` · ${business.address}` : ''}
                        </span>
                        <span>{deckDate()} · Esso Digital</span>
                    </div>
                </div>
            </>
        ),
    }
}

function whyUsSlide(): Slide {
    return {
        body: (
            <div className="s">
                <div className="kicker">Why Esso Digital</div>
                <h2 className="display title">We build first. You decide after.</h2>
                <div className="proof">
                    <div>
                        <h3>Local-business specialists</h3>
                        <p>
                            Websites and automations built specifically for trades, clinics,
                            salons, restaurants and other local operators — not enterprise
                            software squeezed into a small business.
                        </p>
                    </div>
                    <div>
                        <h3>Proof before payment</h3>
                        <p>
                            This plan was researched and prepared before we ever asked you for
                            a dollar. You see exactly what you get before you commit.
                        </p>
                    </div>
                    <div>
                        <h3>Weeks, not quarters</h3>
                        <p>
                            We work in small, fast phases. The first automation goes live in
                            weeks, and you feel the difference in your day-to-day immediately.
                        </p>
                    </div>
                </div>
            </div>
        ),
    }
}

function nextStepSlide(business: DeckBusiness, slug: string): Slide {
    return {
        dark: true,
        body: (
            <div className="s cta">
                <div className="kicker">Next step</div>
                <h2 className="display title">Let&rsquo;s switch it on.</h2>
                <p className="lede" style={{ maxWidth: '60cqw' }}>
                    The interactive version of this plan for {business.name} is live now:
                </p>
                <div className="cta-url">{`${siteBaseUrl()}/pitch/${slug}`}</div>
                <p className="body" style={{ color: 'var(--muted)' }}>
                    Reply to this email or call us — we&rsquo;ll take it from there.
                </p>
            </div>
        ),
    }
}

/** Before/after proof — the prospect's real site next to the generated demo. */
function beforeAfterSlide(beforeUrl: string, afterUrl: string, business: DeckBusiness): Slide {
    return {
        body: (
            <div className="s">
                <div className="kicker">Before &amp; after</div>
                <h2 className="display title">Here&rsquo;s {business.name} today — and reimagined.</h2>
                <div className="cols" style={{ gap: '3cqw', alignItems: 'start' }}>
                    <figure style={{ margin: 0 }}>
                        <img
                            src={beforeUrl}
                            alt={`${business.name}'s current website`}
                            style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid var(--muted)' }}
                        />
                        <figcaption className="body" style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
                            Your site now
                        </figcaption>
                    </figure>
                    <figure style={{ margin: 0 }}>
                        <img
                            src={afterUrl}
                            alt={`A redesigned site for ${business.name}`}
                            style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid var(--muted)' }}
                        />
                        <figcaption className="body" style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
                            What we&rsquo;d build
                        </figcaption>
                    </figure>
                </div>
            </div>
        ),
    }
}

/* ------------------------------------------------------------------ */
/* Full deck: validated automation_plan present (~10 slides)           */
/* ------------------------------------------------------------------ */

function planSlides(
    plan: AutomationPlan,
    business: DeckBusiness,
    slug: string,
    media?: { beforeUrl?: string | null; afterUrl?: string | null },
): Slide[] {
    const slides: Slide[] = []

    slides.push(coverSlide(business, 'Automation Growth Plan'))

    // Before/after proof — only when we have BOTH the prospect's real site and a demo.
    if (media?.beforeUrl && media?.afterUrl) {
        slides.push(beforeAfterSlide(media.beforeUrl, media.afterUrl, business))
    }

    // We studied your business
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">01 — What we saw</div>
                <h2 className="display title">We studied how {business.name} runs today.</h2>
                <div className="cols">
                    <p className="lede">{plan.business_snapshot.summary}</p>
                    <ol className="flow">
                        {plan.business_snapshot.observed_flow.map((step, i) => (
                            <li key={i}>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        ),
    })

    // What it's costing you
    const bottleneckCols = plan.bottlenecks.length === 4 ? 2 : plan.bottlenecks.length
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">02 — The leaks</div>
                <h2 className="display title">What it&rsquo;s costing you right now.</h2>
                <div
                    className="cards"
                    style={{ gridTemplateColumns: `repeat(${bottleneckCols}, 1fr)` }}
                >
                    {plan.bottlenecks.map((b, i) => (
                        <div className="card" key={i}>
                            <h3>{b.title}</h3>
                            <p className="evidence">&ldquo;{b.evidence}&rdquo;</p>
                            <div className="cost">{b.cost_estimate}</div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    })

    // One slide per automation (schema caps at 3)
    plan.automations.forEach((a, i) => {
        slides.push({
            body: (
                <div className="s">
                    <div className="kicker">
                        The fix · Automation {i + 1} of {plan.automations.length}
                    </div>
                    <div className="cols" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 className="display title" style={{ maxWidth: 'none' }}>
                                {a.name}
                            </h2>
                            <p className="lede" style={{ maxWidth: 'none' }}>
                                {a.what_it_does}
                            </p>
                            <div className="chips">
                                {a.tools.map((t) => (
                                    <span className="chip" key={t}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <div className="badge">
                                ~{a.effort_weeks} week{a.effort_weeks === 1 ? '' : 's'} to build
                            </div>
                        </div>
                        <div>
                            <ol className="steps">
                                {a.how_it_works.map((step, j) => (
                                    <li key={j}>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                            <div className="impact">
                                <span className="impact-label">Impact</span>
                                {a.impact}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        })
    })

    // Rollout timeline
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">Rollout</div>
                <h2 className="display title">Live in weeks, not months.</h2>
                <div className="timeline">
                    <div className="tl-bar">
                        {plan.rollout.map((p, i) => (
                            <span
                                key={p.phase}
                                style={{ opacity: 1 - i * (0.6 / Math.max(plan.rollout.length - 1, 1)) }}
                            />
                        ))}
                    </div>
                    <div
                        className="tl-cols"
                        style={{ gridTemplateColumns: `repeat(${plan.rollout.length}, 1fr)` }}
                    >
                        {plan.rollout.map((p) => (
                            <div key={p.phase}>
                                <div className="tl-phase-label">Phase {p.phase}</div>
                                <div className="tl-weeks">{p.weeks}</div>
                                <ul className="tl-items">
                                    {p.items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
    })

    // Investment
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">Investment</div>
                <h2 className="display title">One build cost. One simple monthly.</h2>
                <div className="invest">
                    <div>
                        <div className="invest-label">Setup</div>
                        <div className="display invest-num">{plan.investment.setup_range}</div>
                        <div className="invest-sub">One-off — covers the full build and launch.</div>
                    </div>
                    <div>
                        <div className="invest-label">Ongoing</div>
                        <div className="display invest-num">{plan.investment.monthly_range}</div>
                        <div className="invest-sub">Keeps everything running, monitored and tuned.</div>
                    </div>
                </div>
                <p className="roi">{plan.investment.roi_narrative}</p>
            </div>
        ),
    })

    slides.push(whyUsSlide())
    slides.push(nextStepSlide(business, slug))

    return slides
}

/* ------------------------------------------------------------------ */
/* Fallback deck: no plan yet — template pitch copy (6 slides)         */
/* ------------------------------------------------------------------ */

function fallbackSlides(
    project: { business_data: Record<string, unknown> | null; industry?: string | null; pitch_angle?: string | null },
    business: DeckBusiness,
    slug: string,
): Slide[] {
    const content = buildPitchContent(project)

    const slides: Slide[] = []

    slides.push(coverSlide(business, 'Automation Opportunities'))

    // The opportunity
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">01 — The opportunity</div>
                <h2 className="display title">{content.headline}</h2>
                <p className="lede" style={{ maxWidth: '58cqw' }}>
                    {content.subhead}
                </p>
                {content.whatWeNoticed && (
                    <div className="impact" style={{ maxWidth: '58cqw' }}>
                        <span className="impact-label">What we noticed</span>
                        {content.whatWeNoticed}
                    </div>
                )}
            </div>
        ),
    })

    // Outcomes
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">02 — What changes for you</div>
                <h2 className="display title">Three things you stop worrying about.</h2>
                <div
                    className="cards"
                    style={{ gridTemplateColumns: `repeat(${content.outcomes.length}, 1fr)` }}
                >
                    {content.outcomes.map((o) => (
                        <div className="card" key={o.title}>
                            <h3>{o.title}</h3>
                            <p className="evidence" style={{ fontStyle: 'normal' }}>
                                {o.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        ),
    })

    // How working with us works
    slides.push({
        body: (
            <div className="s">
                <div className="kicker">03 — How it works</div>
                <h2 className="display title">We build it. You watch it run.</h2>
                <ol className="flow" style={{ maxWidth: '62cqw' }}>
                    <li>
                        <span>We build the automation for {business.name} — configured to how you actually work.</span>
                    </li>
                    <li>
                        <span>You watch it handle real enquiries, bookings and follow-ups for your business.</span>
                    </li>
                    <li>
                        <span>You only pay if you love it. If not, we part as friends — no invoice.</span>
                    </li>
                </ol>
            </div>
        ),
    })

    slides.push(whyUsSlide())
    slides.push(nextStepSlide(business, slug))

    return slides
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function AutomationPresentationPage({ params }: PresentationPageProps) {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) notFound()
    if (project.pool !== 'automation') notFound()

    const business = extractDeckBusiness(project.business_data, project.industry)
    const design = getFamilyDesign(getNicheFamily(business.industry))

    const parsed = project.automation_plan
        ? AutomationPlanSchema.safeParse(project.automation_plan)
        : null
    const plan = parsed?.success ? parsed.data : null

    // The public URL uses the slug when present; the route also resolves by id.
    const urlSlug = project.slug || project.id
    const slides = plan
        ? planSlides(plan, business, urlSlug, {
              beforeUrl: project.audit_screenshot_url,
              afterUrl: project.screenshot_url,
          })
        : fallbackSlides(project, business, urlSlug)

    return (
        <main className="deck">
            <style dangerouslySetInnerHTML={{ __html: deckCss(design) }} />
            {slides.map((slide, i) => (
                <section key={i} className={slide.dark ? 'dark' : undefined}>
                    {slide.body}
                    {i > 0 && (
                        <div className="foot">
                            <span>{business.name} · Automation Growth Plan</span>
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
