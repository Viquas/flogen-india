# Flogen

## What This Is

A bulk AI website generator and client conversion platform. Discovers businesses via Google Places, enriches their data, generates React/Tailwind landing pages using LLMs, and provides an admin editor for review/revision/approval. Generated websites include a client-facing claim flow that converts prospects into paying customers through Razorpay payments, post-payment customization, and upsell opportunities. Built for a single operator generating high volumes of business websites and converting them into revenue.

## Core Value

Maximize the number of high-quality websites generated per hour with minimal manual intervention, and convert generated websites into paying clients through a seamless claim-to-payment flow.

## Requirements

### Validated

<!-- v1.0: Internal Generation Engine (completed 2026-03-18) -->
- ✓ Google Places business discovery with pagination and deduplication — v1.0
- ✓ AI-powered website generation from business data (Gemini/OpenRouter/OpenAI fallback chain) — v1.0
- ✓ Streaming code generation with SSE and live preview — v1.0
- ✓ Dashboard with calendar view, project grid, and stats — v1.0
- ✓ Code editor with Monaco, live preview, and device mode switching — v1.0
- ✓ Revision system with AI-powered chat refinement — v1.0
- ✓ Auto-fix error recovery with retry logic — v1.0
- ✓ Batch creation from discovery results — v1.0
- ✓ Queue system with concurrent processing (max 3) — v1.0
- ✓ Supabase database with projects, batches, queue_jobs, revisions tables — v1.0
- ✓ File-based persistence (saved_html/) alongside database storage — v1.0
- ✓ Real-time project status updates via Supabase subscriptions — v1.0
- ✓ Template save/load system — v1.0
- ✓ Business data enrichment from Google Places — v1.0
- ✓ End-to-end batch autopilot (discover → generate → auto-fix → surface failures) — v1.0
- ✓ Generation quality scoring (auto-evaluate renders, sections, responsiveness) — v1.0
- ✓ Industry-aware template seeding (few-shot examples from approved outputs) — v1.0
- ✓ Cost and token tracking per generation across all providers — v1.0
- ✓ Smart error classification with targeted fix strategies — v1.0
- ✓ Keyboard-driven review workflow (j/k/a/r/f/e shortcuts) — v1.0
- ✓ Diff view for revisions (Monaco diff + visual comparison) — v1.0
- ✓ Static HTML export (self-contained download) — v1.0
- ✓ Generation analytics dashboard (success rate, timing, cost by model/industry) — v1.0
- ✓ Prompt versioning (versioned system prompts, tagged to generations) — v1.0
- ✓ Queue health and stuck job admin UI — v1.0
- ✓ Project data prefetch cache for instant navigation — v1.0
<!-- v2.0: Client Claim Flow (completed 2026-03-19) -->
- ✓ Sticky CTA bar with countdown on every generated site — v2.0
- ✓ Claim landing page with preview, geo-detected pricing, domain options, trust elements — v2.0
- ✓ Razorpay payment with HMAC webhook, idempotent processing, GST for India — v2.0
- ✓ Post-payment customization form (logo, colors, contacts, photos, text changes) — v2.0
- ✓ Booking system setup for Pro plan clients — v2.0
- ✓ Strategy call upsell with Cal.com (free for Pro, paid for Standard) — v2.0
- ✓ Confirmation page with timeline, polling, and support contacts — v2.0
- ✓ Geo-detection for INR/USD pricing via Vercel headers — v2.0
- ✓ Domain options (existing domain, buy new, free subdomain) — v2.0
- ✓ Supabase Storage file uploads (logos, photos) via server-proxy — v2.0
- ✓ Claim funnel analytics with 7 tracked events and admin dashboard — v2.0
- ✓ Expired offer handling with re-request form — v2.0
<!-- v3.0: Client Portal & Updated Funnel (completed 2026-03-25) -->
- ✓ Payment-first Razorpay flow (no pre-payment forms, contact info from webhook) — v3.0
- ✓ Razorpay test mode with test/live key switching — v3.0
- ✓ Supabase Auth account creation on confirmation page (post-payment) — v3.0
- ✓ Client portal with authenticated dashboard, site preview iframe, live URL — v3.0
- ✓ Domain management: free subdomain, connect existing (DNS verification), buy new (Domainr + AI suggestions) — v3.0
- ✓ Logo upload with Gemini Vision AI background removal — v3.0
- ✓ Single textarea for all change requests (text, colors, images, anything) — v3.0
- ✓ Booking setup for Pro plan clients (Cal.com embed slug) — v3.0
- ✓ $49 agent support payment (domain setup, logo fixes, minor edits) — v3.0
- ✓ client_requests table and CRUD API for all client submissions — v3.0
- ✓ Admin purchased clients view with customer request queue — v3.0
- ✓ Admin redeploy button (update code, increment version, save revision) — v3.0
- ✓ USD-only pricing ($499 Standard, $1,299 Pro, Premium "Contact Us") — v3.0
- ✓ Premium plan display-only card with "Contact Us" CTA — v3.0
- ✓ Updated claim page (remove domain selection, remove pre-payment forms) — v3.0
- ✓ Analytics: premium_contact event tracking — v3.0

### Active

<!-- v4.0: Somosite Agency Landing Page -->
- [ ] (marketing) route group with isolated layout, fonts, and styles
- [ ] Root route (/) serves agency landing page instead of dashboard redirect
- [ ] Navigation bar: sticky, transparent-to-solid on scroll, smooth anchor links, mobile hamburger
- [ ] Hero section: headline, subheadline, CTAs, browser mockup visual
- [ ] Trust bar: 4 credibility signals with Lucide icons
- [ ] Problem section: empathetic copy, centered, generous whitespace
- [ ] How It Works: 3-step cards with connecting visual, vertical timeline mobile
- [ ] Portfolio section: 6 demo site screenshots in browser mockup frames with "View Demo" links
- [ ] Benefits/differentiators section: outcome-focused, alternating layout
- [ ] Pricing section: 3-tier cards (Standard $499, Pro $1,299, Premium custom), Pro highlighted
- [ ] FAQ accordion: 7 objection-handling questions
- [ ] Final CTA section: dark background, urgency copy
- [ ] Contact form with email handler (POST /api/contact, reuse existing SMTP)
- [ ] Footer: 4 columns (Company, Product, Legal, Trust)
- [ ] Privacy policy page (/privacy)
- [ ] Terms of service page (/terms)
- [ ] Refund policy page (/refund)
- [ ] Cookie consent banner (localStorage preference)
- [ ] Linear-inspired dark DLS: #0A0A0A bg, #AF92FF accent, grain textures, translucent layers
- [ ] Typography: premium serif headings + Inter body, loaded via next/font
- [ ] Scroll-triggered animations (IntersectionObserver, CSS only, 600-800ms ease-out)
- [ ] SEO: meta title, description, OG image, canonical URL
- [ ] PageSpeed 95+ mobile and desktop
- [ ] All marketing copy centralized in lib/marketing-constants.ts
- [ ] Mobile-first responsive (375px, 640px, 1024px breakpoints)
- [ ] Demo portfolio sites generated and screenshotted for portfolio section

### Out of Scope

- Multi-user auth / RBAC — single operator for admin, Supabase Auth for clients only
- Public-facing API — no external consumers
- Rate limiting on admin — trusted local use only
- Mobile admin app — desktop browser workflow for admin
- Stripe payments — Razorpay only for all markets
- Domain registration (in-app purchase) — clients buy externally, connect via DNS
- CMS / client self-edit — operator handles all changes via admin editor
- Email notifications — deferred, will use Instantly AI later
- PDF DNS guides — static text instructions in portal instead
- INR pricing — USD-only for v3.0
- Custom scheduling infrastructure — Cal.com handles all booking logic
- Auto-deployment to custom domains — manual DNS + hosting setup for now

## Current Milestone: v4.0 Somosite Agency Landing Page

**Goal:** Build a premium agency landing page at somosite.com root that convinces cold email recipients the company is real, professional, and worth paying $499-$1,299 for a website. Also satisfies Razorpay verification requirements.

**Target features:**
- Full agency landing page with 12 sections in (marketing) route group
- Legal pages (privacy, terms, refund)
- Contact form email handler
- Cookie consent banner
- Linear-inspired dark DLS with #AF92FF brand purple accent
- Demo portfolio with 6 generated site screenshots
- 95+ PageSpeed, mobile-first, SEO-optimized

## Context

- Next.js App Router + Supabase + AI SDK stack
- v1.0 shipped generation engine (5 phases, 15 plans) — 2026-03-18
- v2.0 shipped client claim flow (5 phases, 14 plans) — 2026-03-19
- v3.0 shipped client portal & updated funnel (5 phases, 13 plans) — 2026-03-25
- v4.0 target: agency landing page at root URL for credibility + Razorpay verification
- Route groups: `(admin)/` for dashboard/editor, `(client)/` for claim flow, `(portal)/` for client portal, `(marketing)/` for landing page + legal pages (new)
- Tables: projects, batches, queue_jobs, revisions, cost_records, prompt_versions, quality_scores, templates, batch_runs, claims, customizations, claim_events, client_requests
- Supabase Storage: site-screenshots (public), claim-uploads (private)
- Supabase Auth: client portal authentication
- Razorpay for payments (USD-only), registered with somosite.com domain
- Client pages are mobile-first, SSR, Inter font
- Admin pages use Geist font, desktop-optimized
- Marketing pages: own font stack (premium serif headings + Inter body), dark DLS, isolated from admin/client
- No test suite — relies on TypeScript safety and manual testing
- Existing SMTP setup (nodemailer/Gmail) for preview emails — reusable for contact form
- CRITICAL: Never say "AI" on landing page — 44% negative brand perception when AI-generated is disclosed

## Constraints

- **Single operator**: Admin for one power user, client pages for prospects
- **Razorpay only**: All payments through Razorpay (USD-only for v3.0)
- **Existing schema**: Extend with new tables, don't modify existing
- **No breaking changes**: Generation pipeline and admin dashboard must keep working
- **Mobile-first client pages**: Prospects arrive from WhatsApp/email on phones
- **Supabase Storage**: File uploads via server-proxy (not direct signed URLs — CORS issues)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing Supabase schema | Avoid migration complexity, extend with new columns/tables | ✓ Good |
| All 12 v1.0 improvements in scope | Comprehensive upgrade of internal tool | ✓ Good |
| Maintain existing generation pipeline | Can't break what works while adding features | ✓ Good |
| Rename project WebGen → Flogen | Product evolution from generator to full platform | ✓ Good |
| Razorpay only (no Stripe) | Simplified payment integration, single provider | ✓ Good |
| 5-day claim expiry window | Creates urgency without being too aggressive | ✓ Good |
| Standard ₹4,999 / Pro ₹9,999 pricing | Competitive for Indian market, Pro includes booking | ✓ Good |
| Server-proxy uploads (not signed URLs) | Eliminates CORS issues with Supabase Storage | ✓ Good |
| Mobile-first client pages | Prospects arrive via WhatsApp/email on phones | ✓ Good |
| GST as separate line item for INR | Transparent pricing for Indian clients | ✓ Good |
| Cal.com iframe (not npm package) | React 19 peer dep incompatibility with @calcom/embed-react | ✓ Good |
| SVG uploads rejected | Security risk (XSS vector), accept PNG/JPG/WebP only | ✓ Good |
| CTA beacon tracking via sendBeacon + GET pixel | Cross-origin analytics from injected CTA bar | ✓ Good |

| USD-only pricing for v3.0 | Simplify payment flow, target international market | ✓ Good |
| Payment-first (no pre-payment forms) | Reduce friction, Razorpay collects contact info | ✓ Good |
| Supabase Auth for client portal | Native to existing stack, row-level security | ✓ Good |
| Gemini Vision for bg removal | Reuse existing AI provider, no new service dependency | ✓ Good |
| Domainr for domain availability | Free tier, simple API, sufficient for availability checks | ✓ Good |
| Single textarea for change requests | Admin interprets and executes, preserves design quality | ✓ Good |
| Email notifications deferred | Will use Instantly AI later, not blocking v3.0 | ✓ Good |
| Static DNS instructions (no PDFs) | Simpler implementation, update-friendly text format | ✓ Good |

| (marketing) route group isolation | Landing page has own fonts/styles, no admin/client imports | — Pending |
| Linear-inspired DLS with #AF92FF accent | Premium dark aesthetic matching reference export | — Pending |
| Hand-coded components (no shadcn/Radix) | Minimal bundle size for landing page, no new UI library deps | — Pending |
| CSS-only animations (no GSAP/Framer) | Performance + simplicity, IntersectionObserver for scroll triggers | — Pending |
| Premium serif headings (DM Serif Display/Outfit) | Contrast with Inter body, agency premium positioning | — Pending |
| Never say "AI" on landing page | 44% negative brand perception when AI-generated disclosed | — Pending |
| Demo sites as portfolio (not real clients) | No client testimonials at launch, fictional businesses for quality proof | — Pending |
| "Get Started" buttons scroll to contact (not payment) | Payment happens on /claim/[slug], not agency page | — Pending |

---
*Last updated: 2026-03-25 after v4.0 milestone start*
