/**
 * Shared helpers for the presentation decks
 * (app/(client)/pitch/[slug]/presentation and app/(client)/claim/[slug]/presentation).
 *
 * Both decks share one visual system: 16:9 sections, editorial typography sized
 * in container-query units (1cqw = 1% of slide width) so screen and the printed
 * 297mm x 167mm page render identical proportions. The accent color and font
 * stacks come from the niche-family registry.
 */

import { rankPhotos, buildPhotoMediaUrl } from '@/lib/ai/photo-selection'
import type { FamilyDesign } from './registry'

/* ------------------------------------------------------------------ */
/* business_data extraction                                            */
/* ------------------------------------------------------------------ */

export interface DeckBusiness {
    name: string
    industry: string | null
    address: string | null
    phone: string | null
    rating: number | null
    reviewCount: number | null
    website: string | null
    /** Ranked, proxy-resolved photo URLs (best first). Empty when none stored. */
    photoUrls: string[]
}

function str(v: unknown): string | null {
    return typeof v === 'string' && v.trim() ? v : null
}

function num(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Photos land in business_data either as Places photo refs
 * ({ name, widthPx, heightPx } — see lib/generation/claude-cli.ts) or, in older
 * rows, as plain URL strings. Normalize both to URLs, best photo first.
 */
function photoUrlsFrom(bd: Record<string, unknown>): string[] {
    const photos = bd.photos
    if (!Array.isArray(photos) || photos.length === 0) return []

    if (photos.every((p) => typeof p === 'string')) {
        return (photos as string[]).filter(Boolean)
    }

    const refs = photos.filter(
        (p): p is { name: string; widthPx: number; heightPx: number } =>
            !!p &&
            typeof p === 'object' &&
            typeof (p as { name?: unknown }).name === 'string' &&
            typeof (p as { widthPx?: unknown }).widthPx === 'number' &&
            typeof (p as { heightPx?: unknown }).heightPx === 'number',
    )
    if (refs.length === 0) return []

    const ranked = rankPhotos(refs)
    if (ranked.length > 0) return ranked.map((p) => p.url)
    // Everything below the quality floor — still better than nothing for a cover.
    return [buildPhotoMediaUrl(refs[0].name)]
}

export function extractDeckBusiness(
    businessData: Record<string, unknown> | null,
    industryColumn?: string | null,
): DeckBusiness {
    const bd = businessData || {}
    const contact = (bd.contactInfo || {}) as Record<string, unknown>
    return {
        name: str(bd.businessName) || str(bd.business_name) || 'Your Business',
        industry: industryColumn || str(bd.industry) || str(bd.category),
        address: str(contact.address) || str(bd.address) || str(bd.formattedAddress),
        phone:
            str(contact.phone) ||
            str(bd.internationalPhoneNumber) ||
            str(bd.phone),
        rating: num(bd.rating),
        reviewCount: num(bd.userRatingCount) ?? num(bd.reviewCount) ?? num(bd.review_count),
        website: str(bd.website) || str(bd.websiteUri),
        photoUrls: photoUrlsFrom(bd),
    }
}

/** Absolute site origin for URLs printed inside the deck (CTA slides). */
export function siteBaseUrl(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '')
}

/** "July 2026" — the prepared-on line for covers. */
export function deckDate(): string {
    return new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/* deck stylesheet                                                     */
/* ------------------------------------------------------------------ */

/**
 * The full deck stylesheet for a niche family. Injected as a plain <style> tag
 * by the presentation pages. Screen: vertically scrolled 16:9 slides on a
 * neutral ground with a page counter. Print: exact 297mm x 167mm pages,
 * one slide per page, backgrounds preserved.
 */
export function deckCss(d: FamilyDesign): string {
    return `
.deck {
  --accent: ${d.accent};
  --accent-soft: ${d.accentSoft};
  --ink: #191512;
  --paper: #FBF9F6;
  --muted: rgba(25, 21, 18, 0.6);
  --hairline: rgba(25, 21, 18, 0.16);
  font-family: ${d.bodyFont};
  background: #E7E3DC;
  padding: 44px 0 64px;
  min-height: 100vh;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.deck *, .deck *::before, .deck *::after { margin: 0; padding: 0; box-sizing: border-box; }
.deck img { display: block; }
.deck a { color: inherit; text-decoration: none; }

.deck section {
  position: relative;
  width: min(1180px, 94vw);
  aspect-ratio: 16 / 9;
  margin: 0 auto 44px;
  background: var(--paper);
  color: var(--ink);
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(25, 21, 18, 0.16);
  container-type: inline-size;
}
.deck section.dark { background: #171310; color: #F4EFE8; }
.deck section.dark { --muted: rgba(244, 239, 232, 0.6); --hairline: rgba(244, 239, 232, 0.2); }

/* Padded slide body — everything inside sizes in cqw (1cqw = 1% slide width). */
.deck .s {
  position: absolute; inset: 0;
  padding: 5.4cqw 6cqw 6.4cqw;
  display: flex; flex-direction: column;
}

/* Full-bleed imagery */
.deck .bleed { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.deck .scrim { position: absolute; inset: 0; background: linear-gradient(112deg, rgba(15, 12, 10, 0.92) 32%, rgba(15, 12, 10, 0.55) 68%, rgba(15, 12, 10, 0.35)); }

/* Typography */
.deck .display { font-family: ${d.displayFont}; font-weight: 800; line-height: 0.98; letter-spacing: -0.015em; }
.deck .kicker {
  font-size: 1.2cqw; font-weight: 700; letter-spacing: 0.34em; text-transform: uppercase;
  color: var(--accent); margin-bottom: 2.6cqw;
}
.deck section.dark .kicker { color: var(--accent-soft); }
.deck .title { font-size: 4.6cqw; max-width: 78cqw; margin-bottom: 3.4cqw; }
.deck .lede { font-size: 1.75cqw; line-height: 1.6; color: var(--muted); max-width: 40cqw; }
.deck .body { font-size: 1.55cqw; line-height: 1.6; }

/* Cover */
.deck .cover { justify-content: flex-end; }
.deck .cover-name { font-size: clamp(24px, 7.4cqw, 999px); max-width: 84cqw; margin: 1.6cqw 0 2.8cqw; }
.deck .cover-rule { width: 12cqw; height: 0.5cqw; background: var(--accent); margin-bottom: 3cqw; }
.deck .cover-meta { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--hairline); padding-top: 2.2cqw; font-size: 1.35cqw; color: var(--muted); letter-spacing: 0.06em; }

/* Two-column content */
.deck .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 6cqw; flex: 1; min-height: 0; align-items: start; }

/* Numbered flow (observed customer journey) */
.deck ol.flow { list-style: none; counter-reset: flow; }
.deck ol.flow li { position: relative; display: flex; gap: 1.8cqw; padding-bottom: 2.1cqw; counter-increment: flow; font-size: 1.55cqw; line-height: 1.45; }
.deck ol.flow li::before {
  content: counter(flow);
  flex: none; width: 2.8cqw; height: 2.8cqw; border-radius: 50%;
  background: var(--accent); color: #fff;
  font-size: 1.25cqw; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.deck ol.flow li:not(:last-child)::after {
  content: ""; position: absolute; left: 1.4cqw; top: 2.8cqw; bottom: 0;
  width: 1px; background: var(--hairline);
}
.deck ol.flow li > span { padding-top: 0.5cqw; }

/* Card rows (bottlenecks, outcomes, inclusions) */
.deck .cards { display: grid; gap: 2cqw; flex: 1; min-height: 0; align-content: start; }
.deck .card {
  background: #fff; border: 1px solid var(--hairline);
  padding: 2.4cqw 2.2cqw; display: flex; flex-direction: column; gap: 1.4cqw;
}
.deck .card h3 { font-family: ${d.displayFont}; font-size: 1.9cqw; line-height: 1.15; letter-spacing: -0.01em; }
.deck .card .evidence { font-size: 1.35cqw; line-height: 1.5; color: var(--muted); font-style: italic; }
.deck .card .cost {
  margin-top: auto; padding-top: 1.4cqw; border-top: 1px solid var(--hairline);
  font-family: ${d.displayFont}; font-size: 1.7cqw; font-weight: 800; color: var(--accent);
}

/* Automation slides */
.deck .chips { display: flex; flex-wrap: wrap; gap: 0.9cqw; margin-top: 2.4cqw; }
.deck .chip {
  font-size: 1.15cqw; font-weight: 600; letter-spacing: 0.04em;
  padding: 0.7cqw 1.4cqw; border-radius: 999px;
  background: var(--accent-soft); color: var(--accent);
}
.deck .badge {
  display: inline-block; margin-top: 2cqw; align-self: flex-start;
  font-size: 1.1cqw; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
  padding: 0.9cqw 1.6cqw; border: 1px solid var(--accent); color: var(--accent);
}
.deck ol.steps { list-style: none; counter-reset: step; }
.deck ol.steps li {
  counter-increment: step; display: flex; gap: 1.6cqw;
  padding: 1.5cqw 0; border-bottom: 1px solid var(--hairline);
  font-size: 1.5cqw; line-height: 1.45;
}
.deck ol.steps li::before {
  content: "0" counter(step);
  font-family: ${d.displayFont}; font-weight: 800; font-size: 1.5cqw; color: var(--accent);
}
.deck .impact {
  margin-top: 2.4cqw; background: var(--accent-soft); padding: 2cqw 2.2cqw;
  font-size: 1.55cqw; line-height: 1.55;
}
.deck .impact .impact-label {
  display: block; font-size: 1.05cqw; font-weight: 700; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 0.9cqw;
}

/* Rollout timeline */
.deck .timeline { display: grid; gap: 2.4cqw; flex: 1; align-content: start; }
.deck .tl-bar { display: flex; height: 1.1cqw; }
.deck .tl-bar span { flex: 1; background: var(--accent); }
.deck .tl-cols { display: grid; gap: 2.4cqw; }
.deck .tl-phase-label { font-size: 1.1cqw; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6cqw; }
.deck .tl-weeks { font-family: ${d.displayFont}; font-size: 1.9cqw; font-weight: 800; margin-bottom: 1.4cqw; }
.deck .tl-items { list-style: none; }
.deck .tl-items li { font-size: 1.35cqw; line-height: 1.5; color: var(--muted); padding: 0.55cqw 0 0.55cqw 1.6cqw; position: relative; }
.deck .tl-items li::before { content: ""; position: absolute; left: 0; top: 1.15cqw; width: 0.6cqw; height: 0.6cqw; background: var(--accent); }

/* Investment / pricing */
.deck .invest { display: grid; grid-template-columns: 1fr 1fr; gap: 4cqw; margin-bottom: 3.6cqw; }
.deck .invest-label { font-size: 1.15cqw; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.2cqw; }
.deck .invest-num { font-size: 5.4cqw; color: var(--accent); }
.deck .invest-sub { font-size: 1.35cqw; color: var(--muted); margin-top: 1cqw; }
.deck .roi { font-size: 1.7cqw; line-height: 1.65; max-width: 74cqw; border-left: 0.45cqw solid var(--accent); padding-left: 2.4cqw; }

/* Proof columns */
.deck .proof { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3.6cqw; flex: 1; align-content: start; }
.deck .proof h3 { font-family: ${d.displayFont}; font-size: 2cqw; line-height: 1.15; margin-bottom: 1.4cqw; padding-top: 1.8cqw; border-top: 0.45cqw solid var(--accent); }
.deck .proof p { font-size: 1.45cqw; line-height: 1.6; color: var(--muted); }

/* CTA slide */
.deck .cta { justify-content: center; align-items: flex-start; }
.deck .cta-url {
  font-family: ${d.displayFont}; font-weight: 800; font-size: 3.4cqw; letter-spacing: -0.01em;
  color: var(--accent-soft); background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--hairline); padding: 2.2cqw 3cqw; margin: 3cqw 0;
  overflow-wrap: anywhere;
}
.deck section.dark .cta-url { color: #fff; border-color: var(--accent); }

/* Screenshot slide */
.deck .shot-band {
  position: absolute; left: 0; right: 0; bottom: 0;
  background: rgba(15, 12, 10, 0.82); color: #F4EFE8;
  padding: 1.8cqw 6cqw; display: flex; justify-content: space-between; align-items: baseline;
  font-size: 1.3cqw; letter-spacing: 0.08em;
}

/* Per-slide footer */
.deck .foot {
  position: absolute; left: 6cqw; right: 6cqw; bottom: 2.6cqw;
  display: flex; justify-content: space-between;
  font-size: 1cqw; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--muted); pointer-events: none;
}
.deck .cover .cover-meta + .foot { display: none; }

/* Print — one slide per 297mm x 167mm page, backgrounds preserved. */
@media print {
  @page { size: 297mm 167mm; margin: 0; }
  html, body { background: #fff !important; }
  .deck { padding: 0; background: #fff; min-height: 0; }
  .deck section {
    width: 297mm; height: 167mm; aspect-ratio: auto;
    margin: 0; box-shadow: none;
    page-break-after: always; break-after: page;
  }
  .deck section:last-of-type { page-break-after: auto; break-after: auto; }
}
`
}
