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

### Active

<!-- v2.0: Client Claim Flow -->
- [ ] Sticky "Claim This Website" CTA bar with countdown on every generated site
- [ ] Claim landing page with site preview, pricing, domain options, trust elements
- [ ] Razorpay payment integration (INR pricing, webhook verification)
- [ ] Post-payment customization form (logo, colors, contacts, photos, text changes)
- [ ] Booking system setup for Pro plan clients
- [ ] Strategy call upsell (free for Pro, paid for Standard)
- [ ] Confirmation page with timeline and next steps
- [ ] Geo-detection for INR/USD pricing display
- [ ] Domain options (existing domain, buy new, free subdomain)
- [ ] Supabase Storage file uploads (logos, client photos) via signed URLs
- [ ] Claim flow analytics and conversion tracking
- [ ] Expired offer handling (grace states, re-request flow)

### Out of Scope

- Multi-user auth / RBAC — single operator, internal admin
- Public-facing API — no external consumers
- Rate limiting on admin — trusted local use only
- Mobile admin app — desktop browser workflow for admin
- CI/CD pipeline — deploy manually or via Vercel
- Stripe payments — Razorpay only for all markets
- Domain registration API integration — manual domain setup via DNS instructions
- Automated site deployment to hosting — manual for now
- CMS / client self-edit — operator handles all changes

## Current Milestone: v2.0 Client Claim Flow

**Goal:** Turn every generated website into a revenue opportunity with a 6-step client-facing claim flow: CTA injection → claim landing page → Razorpay payment → customization form → upsell → confirmation.

**Target features:**
- Sticky CTA bar with "5 days left to claim" countdown on generated sites
- High-converting claim landing page (preview, pricing, domain options, trust)
- Razorpay payment (Standard ₹4,999 / Pro ₹9,999, USD fallback $499 / $1,299)
- Post-payment customization form with file uploads
- Strategy call upsell
- Confirmation with delivery timeline
- Full conversion funnel analytics

## Context

- Brownfield project with established Next.js + Supabase + AI SDK stack
- v1.0 shipped 5 phases (15 plans) covering generation engine, instrumentation, quality, autopilot, UX
- Editor page is the most complex component (~56KB, client-side heavy)
- Generator decomposed into focused modules in v1.0
- No test suite exists — relies on manual testing and type safety
- Existing tables: projects, batches, queue_jobs, revisions, cost_records, prompt_versions, quality_scores, templates, batch_runs
- New tables needed: claims, customizations
- Client-facing pages must be mobile-first (WhatsApp/email prospects open on phone)
- Site preview screenshots needed for claim page hero (generate during site creation)

## Constraints

- **Single operator**: Admin features for one power user, client pages for prospects
- **Razorpay only**: All payments through Razorpay (INR primary, USD secondary)
- **Existing schema**: Extend with new tables (claims, customizations), don't modify existing
- **No breaking changes**: Generation pipeline and admin dashboard must keep working
- **Next.js App Router**: Server-side render client-facing pages for speed and SEO
- **Mobile-first client pages**: Prospects arrive from WhatsApp/email on phones
- **Supabase Storage**: File uploads (logos, photos) via signed URLs, not proxied through API

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing Supabase schema | Avoid migration complexity, extend with new columns/tables | ✓ Good |
| All 12 v1.0 improvements in scope | Comprehensive upgrade of internal tool | ✓ Good |
| Maintain existing generation pipeline | Can't break what works while adding features | ✓ Good |
| Rename project WebGen → Flogen | Product evolution from generator to full platform | — Pending |
| Razorpay only (no Stripe) | Simplified payment integration, single provider | — Pending |
| 5-day claim expiry window | Creates urgency without being too aggressive | — Pending |
| Standard ₹4,999 / Pro ₹9,999 pricing | Competitive for Indian market, Pro includes booking system | — Pending |
| Supabase Storage for file uploads | Already using Supabase, signed URLs for direct upload | — Pending |
| Mobile-first client pages | Prospects arrive via WhatsApp/email on phones | — Pending |

---
*Last updated: 2026-03-18 after v2.0 milestone start*
