# Project Research Summary

**Project:** Flogen / WebGen v2.0 — Client Claim Flow
**Domain:** AI website generator with client conversion and payment pipeline
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

Flogen v2.0 converts an existing internal AI website generation tool into a revenue-generating platform by adding a client-facing claim flow. The product pattern is a 6-step funnel: CTA injection on generated sites, claim landing page, Razorpay payment, post-payment customization form, strategy call upsell, and confirmation page. The entire flow builds on a validated and shipped v1.0 stack (Next.js 16, Supabase, AI SDK v6) and requires only 5 new npm packages. The most significant architectural change is not a new library but a structural one: introducing public mobile-first SSR pages alongside existing admin pages using Next.js route groups (`(admin)/` and `(client)/`), which enables different layouts, meta tags, and script loading without touching any existing URLs.

The recommended approach ships the minimum viable funnel in strict dependency order — CTA injection first (it modifies existing HTML boilerplate and establishes the entry point), then the claim landing page (the conversion hub), then Razorpay payment (the revenue gate), then the customization form and confirmation page. Strategy call upsell and funnel analytics are deferred optimization layers. All 4 research areas return HIGH confidence because primary sources (official Razorpay, Supabase, Next.js, and Vercel documentation) were used throughout, with the sole MEDIUM areas being puppeteer-core + chromium-min version coupling (requires install-time verification) and WHOIS domain availability (best-effort, rate-limited by TLD).

The non-negotiable implementation risks are payment-specific and must be built correctly on day one, not retrofitted: Razorpay webhook signature verification requires `await request.text()` before any JSON parsing — using `request.json()` causes 100% signature failure in production. All amounts must be stored as integer paise/cents from the start. The confirmation page must implement polling because webhooks and browser redirects race with no ordering guarantee. File upload security requires server-side magic byte validation (the existing `uploadProjectAsset()` has zero validation). These four constraints shape the implementation order of every payment and upload task.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, Supabase, AI SDK v6, Zod, date-fns, Recharts) requires only 5 new packages. Infrastructure additions come from extending existing Supabase patterns (2 new Storage buckets, 3-4 new tables) and Next.js routing (route groups, public SSR pages). See `.planning/research/STACK.md` for full integration code patterns.

**Core technologies:**
- `razorpay` ^2.9.6: Payment SDK — sole payment provider per project constraints; provides `validatePaymentVerification` and `validateWebhookSignature` as built-in utilities, eliminating the need to reimplement HMAC verification
- Vercel `x-vercel-ip-country` header (via `@vercel/functions` or direct header access): Geo-detection for INR/USD pricing — free, zero-latency, no rate limits, available on all Vercel plans; external geo APIs add 50-200ms latency for zero benefit
- `puppeteer-core` ^24.x + `@sparticuz/chromium-min` ^133.x: Screenshot generation — required because generated sites use CSS Grid, animations, and arbitrary Tailwind that Satori/@vercel/og cannot render; generate during batch processing, not on claim page load
- `whoiser` ^1.18.0: Domain availability WHOIS lookup — zero-cost, zero-dependency; appropriate for low-volume informational display; upgrade path to paid API if rate limiting becomes an issue
- Cal.com iframe or inline script embed (NOT `@calcom/embed-react`): Strategy call booking — the npm package has unresolved React 19 peer dependency conflicts confirmed in GitHub issues #20814, #20681, #20990
- Supabase signed upload URLs + server-proxy pattern: Client file uploads — extends existing Supabase infrastructure; server generates signed URL, client uploads direct to avoid Next.js 1MB body limit; CORS risk is eliminated by routing through an API proxy route

**New packages to install:**
```
npm install razorpay whoiser @vercel/functions
npm install puppeteer-core @sparticuz/chromium-min
```

**New environment variables:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_DEV_COUNTRY` (dev fallback), `CHROMIUM_REMOTE_URL` (optional).

**New Supabase Storage buckets:** `site-screenshots` (public, WebP previews for claim page hero) and `claim-uploads` (private, client-uploaded logos and photos).

**New database tables:** `claims` (full lifecycle tracking), `customizations` (post-payment form data), `claim_events` (funnel analytics event log). No modifications to existing tables.

### Expected Features

The funnel has 8 feature areas. Research provides explicit table stakes, differentiators, and anti-features for each. See `.planning/research/FEATURES.md` for the full breakdown including complexity ratings and dependency maps.

**Must have — blocks revenue if missing:**
- Sticky CTA bar injected into generated HTML with real countdown tied to `claim_expires_at` — funnel entry point; fake/resetting countdowns kill trust immediately
- Claim landing page with SSR site preview (screenshot hero + lazy iframe), Standard/Pro pricing cards in INR/USD based on geo, trust elements (guarantee badge, Razorpay logo, social proof), business-specific content, mobile-first layout, and SEO/OG meta
- Domain selection section within the claim page (free subdomain as default/fallback, existing domain input, "help me buy a domain" option) — removes a purchase barrier without requiring domain registration infrastructure
- Razorpay Standard Checkout with server-side order creation, client-side checkout.js modal, webhook verification (`payment.captured`), client-side verification backup, idempotent order creation, and payment failure recovery
- Post-payment multi-step customization form with logo upload, photo uploads (up to 10), pre-filled contact details from `business_data`, color palette selection, text change requests, and per-step persistence keyed by `claim_id`
- Confirmation page with order summary, delivery timeline, contact info, and payment receipt reference

**Should have — deferred but not v2+:**
- Strategy call upsell (between customization form and confirmation): Cal.com/Calendly iframe, skip button must be equally prominent as book button, Pro plan frames it as included benefit
- Funnel analytics: `claim_events` table + Recharts visualization in admin dashboard showing step-by-step conversion and drop-off rates; Recharts already installed from v1.0

**Defer to v2+:**
- In-flow domain registration (explicitly out of scope per PROJECT.md)
- Live preview with real-time changes applied
- Automated email confirmation (requires separate email service)
- Abandoned payment recovery email
- A/B testing claim page variants
- Video walkthrough of generated site

**Anti-features to actively avoid:** Fake countdown that resets on refresh, blocking site preview behind email gate, custom payment form touching card data (PCI), multiple upsells post-payment, mandatory account creation for confirmation access, auto-playing media.

### Architecture Approach

The v2.0 architecture extends the existing monolithic Next.js App Router structure with hard separation between admin and client-facing concerns using route groups, new API route namespaces, and new lib/ modules — all following established project patterns. The admin side retains its service-role Supabase access (no auth, single operator). Client-facing claim pages are fully public SSR routes; security comes from unguessable project UUIDs and Razorpay signature verification rather than session auth. See `.planning/research/ARCHITECTURE.md` for full schema DDL, data flow diagrams, and signed URL sequence.

**Major components:**
1. `app/(admin)/dashboard/` and `app/(admin)/editor/` — existing pages moved into route group, unchanged; sidebar desktop layout
2. `app/(client)/claim/[slug]/` — public SSR claim flow (landing, customize, confirmed) with mobile-first layout, no navigation chrome, SEO meta
3. `app/api/claims/create-order/`, `app/api/claims/[claimId]/customize/`, `app/api/webhooks/razorpay/` — payment API routes, all using `createAdminClient()` (consistent with existing pattern)
4. `app/api/uploads/signed-url/` — server-generated upload URL with claim status gate before issuing the URL
5. `lib/cta-injector.ts` — injects sticky CTA bar into `constructHtmlBoilerplate()` output as pure HTML/CSS/vanilla JS at render time (not generation time); Option A recommended: inject before `</body>`, not into iframe
6. `lib/razorpay.ts`, `lib/geo.ts`, `lib/claims.ts`, `lib/tracking.ts` — new business logic modules following the existing lib/ pattern
7. Database: `claims` (1:many from `projects`) -> `customizations` (1:1 from `claims`), plus optional `claim_events`; small optional additions to `projects` table: `slug`, `claim_expires_at`, `screenshot_url`

**Data flow:** discovery -> enrichment -> generation -> `constructHtmlBoilerplate()` (with CTA bar injected) -> claim initiated by prospect clicking CTA -> claim page SSR -> Razorpay order created server-side -> checkout modal -> webhook confirms payment -> customization form -> operator delivers site.

### Critical Pitfalls

1. **Razorpay webhook raw body trap (P1)** — Call `await request.text()` first, then `JSON.parse()`. Never use `await request.json()`. Using the parsed body for HMAC verification fails 100% of the time in production due to key ordering and whitespace differences. Must be built correctly from day one; this is the largest single risk in the project.

2. **Paise conversion errors (P2)** — Build `lib/pricing.ts` with hardcoded integer paise/cents values (`standard: { inr_paise: 499900, usd_cents: 49900 }`) before any Razorpay order creation. Never compute from rupee values via float multiplication. Verify amount in the webhook matches expected plan price exactly.

3. **Webhook vs. redirect race condition (P3)** — Confirmation page must poll claim status every 2 seconds for up to 30 seconds after redirect. Never depend solely on the browser redirect callback. Webhook and confirmation page are designed together in the same implementation step.

4. **Razorpay key secret exposure (P4)** — Only `RAZORPAY_KEY_ID` uses `NEXT_PUBLIC_` prefix. The `RAZORPAY_KEY_SECRET` must never be client-accessible. Add runtime validation that throws in production if a test-mode key (`rzp_test_`) is detected.

5. **File upload security (P6)** — Client-reported `file.type` is spoofable. Validate PNG/JPEG/WebP magic bytes server-side. Reject SVG entirely (embedded script attack vector). The existing `uploadProjectAsset()` has zero validation and must not be reused as-is for client-submitted files.

6. **CTA bar CSS isolation (P8)** — Generated pages have their own z-index hierarchies, Tailwind classes, and `position: fixed` elements. Render the CTA as a sibling to an iframe containing the preview, or use inline styles only with `z-index: 2147483647`. Test against 20+ generated pages before shipping.

7. **Signed URL expiry (P7)** — Supabase upload signed URLs expire in 2 hours (fixed, not configurable). Store the storage path in the database, not the URL. Generate fresh signed URLs at render time for operator review.

## Implications for Roadmap

Research confirms a 4-phase delivery sequence based on strict feature dependencies. See the full dependency graph in `.planning/research/FEATURES.md`.

### Phase 1: Foundation — Data Model and Route Architecture
**Rationale:** All other phases reference the `claims` table and the `(client)/` route group. This work has no UI value but unblocks everything else. The CTA injector is included here because it is the funnel entry point and touches existing lib/ code.
**Delivers:** `claims`, `customizations`, `claim_events` tables with indexes; `site-screenshots` and `claim-uploads` Storage buckets; `(admin)/` and `(client)/` route groups with separate layouts; `lib/cta-injector.ts` with CTA bar injected into generated HTML; `lib/geo.ts` for INR/USD currency detection; `lib/pricing.ts` with hardcoded paise/cents values; Razorpay SDK singleton in `lib/razorpay.ts`.
**Avoids:** P8 (CTA isolation approach locked in here), P14 (route group prevents layout leakage between admin and client pages), P2 (pricing utility built before any order creation).
**Research flag:** Standard patterns. No additional research needed.

### Phase 2: Claim Landing Page
**Rationale:** Depends on Phase 1 (claims table, slug routing, CTA link target). The claim page is the conversion hub and the most complex individual page. It must be built and validated before payment is added to it.
**Delivers:** `/claim/[slug]` fully SSR-rendered page with: site screenshot hero (WebP from `site-screenshots` bucket), lazy-loaded interactive iframe preview, Standard/Pro pricing cards with INR/USD geo-detection, domain selection UI, trust elements, FAQ accordion, mobile-first layout, SEO meta and OG image using `generateMetadata`.
**Avoids:** P9 (countdown with UTC timestamp, re-synced every 60s), P10 (Vercel geo header with manual toggle and INR default), P13 (performance: screenshot hero not live iframe above the fold, SSR for initial paint, minimal client JS).
**Research flag:** Standard SSR patterns. Note: verify puppeteer-core + @sparticuz/chromium-min version pairing at install time before screenshot generation is implemented.

### Phase 3: Payment Flow and Confirmation
**Rationale:** Depends on Phase 2 (the "Pay" button lives on the claim page). All three payment pitfalls (P1, P2, P3) are interdependent and must be implemented as a unit. Webhook handler and confirmation page are designed together to prevent the race condition.
**Delivers:** Server-side order creation (`/api/claims/create-order`), Razorpay checkout.js modal integration with prefilled client details, webhook handler (`/api/webhooks/razorpay/`) with raw body signature verification and idempotent processing, client-side payment verification backup (`/api/claims/[claimId]/verify-payment/`), payment failure recovery UI, confirmation page with polling loop (2s interval, 30s max), order summary, and delivery timeline.
**Avoids:** P1 (raw body webhook), P2 (paise via pricing utility already built in Phase 1), P3 (polling on confirmation page), P4 (key secret never in `NEXT_PUBLIC_`), P5 (idempotent order creation checking existing `razorpay_order_id`), P12 (runtime key mode validation on Razorpay SDK init).
**Research flag:** All patterns are fully documented in STACK.md. Implementation discipline is the risk, not missing knowledge. Verify Razorpay live mode KYC status before starting this phase (operational dependency that can block go-live).

### Phase 4: Post-Payment Customization and Upsell
**Rationale:** Depends on Phase 3 (accessible only after payment confirmed). File upload architecture must be decided before building the form. Recommended: server-proxy upload route rather than direct signed URL uploads (eliminates CORS entirely per P11).
**Delivers:** Multi-step customization form at `/claim/[slug]/customize/` with: logo upload, up to 10 photo uploads, pre-filled contact details from `business_data`, hex color palette picker with preset swatches, text change requests textarea (2000 char max), per-step persistence in `customizations` table. Strategy call upsell with Cal.com iframe prefilled with client name and email. Confirmation page enhancements (domain setup instructions, referral prompt).
**Avoids:** P6 (MIME magic byte validation server-side, SVG rejected), P7 (store paths not URLs in `customizations` table), P11 (server-proxy upload route eliminates CORS entirely).
**Research flag:** Standard multi-step form and file upload patterns. Cal.com iframe embed approach is confirmed. No additional research needed.

### Phase 5: Funnel Analytics
**Rationale:** Deferred until the funnel is live and producing real data. Recharts and Supabase are already in the stack. The `claim_events` table is created in Phase 1 but only instrumented here.
**Delivers:** Event logging on all client-facing claim pages (`/api/tracking/event/`), server-side event logging from webhook handler, admin dashboard section with funnel bar chart (step counts + drop-off %), revenue totals by plan, date range filter reusing existing dashboard UI patterns.
**Avoids:** Premature analytics overhead before the funnel is validated with real data.
**Research flag:** Standard patterns. Recharts funnel visualization is well-established.

### Phase Ordering Rationale

- Phases 1 through 3 form the minimum viable revenue funnel. A prospect can see a CTA on a generated site, visit the claim page, pay, and receive a confirmation. Revenue flows before Phase 4 begins.
- Phase 4 transforms a completed payment into a deliverable — the operator has everything needed to customize and ship the site.
- Phase 5 adds observability to optimize what is already working, not speculation about what might work.
- Database migrations for all 3 new tables should be scripted in Phase 1 even if `claim_events` is not actively used until Phase 5 — prevents migration drift.
- The confirmation page shell (with polling) is built in Phase 3; domain setup instructions and referral prompt enhancements are added in Phase 4.

### Research Flags

All 5 phases use well-documented patterns with HIGH confidence sources. No phase requires a `/gsd:research-phase` call.

Phases with specific install-time verification needed:
- **Phase 2:** Verify `puppeteer-core` + `@sparticuz/chromium-min` compatible version pairing by checking the @sparticuz/chromium-min releases before running `npm install`.

Operational dependencies to verify before phases begin:
- **Phase 3:** Confirm Razorpay live mode KYC approval. Configure live-mode webhook URLs in Razorpay Dashboard. Without live mode, the payment phase cannot go to production.
- **Phase 4:** Confirm Cal.com (or Calendly) account with a configured event type URL for the strategy call upsell iframe.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 5 new packages verified via official GitHub repos and npm registry. Razorpay, Vercel geo headers, Supabase signed URLs, Next.js route handlers all confirmed via official docs. Cal.com React 19 incompatibility confirmed via 3 open GitHub issues. Only gap: puppeteer-core + @sparticuz/chromium-min version coupling requires install-time verification. |
| Features | HIGH | 8-step claim flow is grounded in specific table columns, API methods, and implementation patterns — not generic SaaS research. MVP vs. defer split is explicit and justified against PROJECT.md constraints. Anti-features are documented with clear rationale. |
| Architecture | HIGH | Route group approach, data flow, and component boundaries validated against Next.js App Router docs. Full schema DDL provided in ARCHITECTURE.md. 1:many and 1:1 table relationships are well-defined. |
| Pitfalls | HIGH | All 6 critical pitfalls are verified against official documentation. P1 confirmed via Razorpay docs and multiple GitHub issues. P6 confirmed by reading existing `lib/supabase/storage.ts` (zero validation). P11 confirmed via multiple Supabase GitHub CORS issues. Prevention code is provided for each pitfall. |

**Overall confidence:** HIGH

### Gaps to Address

- **Puppeteer + Chromium version pairing:** Verify the exact compatible pair at install time by checking the @sparticuz/chromium-min releases page. A version mismatch causes silent failures. Allocate time for this in Phase 2 planning.

- **Upload architecture decision:** STACK.md recommends Supabase signed upload URLs; PITFALLS.md documents a confirmed CORS problem with direct signed URL uploads from browsers (P11). Recommendation is to use a server-proxy upload route (`/api/claims/upload/`) instead — client sends the file to Next.js API, server uploads to Supabase using the service role key. This eliminates CORS entirely. Lock this in at Phase 4 kickoff.

- **Screenshot trigger point:** Screenshots must be generated during batch processing, not on claim page load. The exact trigger — post-generation hook in `updateProjectWithCode()`, or on-demand on first claim page visit with a cache — is an implementation decision to resolve in Phase 1 or Phase 2 planning.

- **Razorpay live mode activation:** Razorpay requires KYC verification before live mode is enabled. This is an operational dependency outside code that can block Phase 3 from going to production. Initiate KYC verification early.

- **Expired claim UX:** Research identified that expired claims should show an "Offer expired" state with a grace period option to request renewal, rather than a dead 404 page. The exact state machine transitions (`expired` -> `renewal_requested`) are not fully specified and need design decisions during Phase 2 or Phase 3 planning.

- **Cal.com TypeScript declarations:** The `<cal-inline>` custom element used in JSX requires a TypeScript declaration file. This is a minor implementation detail but causes `TypeScript error TS2339` without it. Add a `components/claim/cal-inline.d.ts` file in Phase 4.

## Sources

### Primary (HIGH confidence)
- Razorpay Node.js SDK v2.9.6 GitHub + official integration docs — payment order creation, HMAC signature verification, webhook validation, live/test mode separation
- Vercel request headers reference + @vercel/functions API reference — `x-vercel-ip-country` geo header behavior and geolocation helper
- Supabase Storage API reference — `createSignedUploadUrl`, `uploadToSignedUrl`, bucket fundamentals, RLS patterns
- Next.js App Router official docs — Route Groups, route handlers, raw body access, hydration error patterns, `generateMetadata`
- Vercel Puppeteer deployment guide and official template — @sparticuz/chromium-min serverless deployment pattern
- Cal.com GitHub issues #20814, #20681, #20990 — React 19 peer dependency conflict confirmed unresolved

### Secondary (MEDIUM confidence)
- @sparticuz/chromium-min blog post on Vercel cold-start performance — approach confirmed; exact version mapping requires install-time verification
- whoiser npm registry and GitHub (LayeredStudio/whoiser) — WHOIS library functional; TLD rate limiting is environment-dependent
- Multiple Next.js + Razorpay integration guides — cross-verified patterns for order creation, webhook handling, and checkout.js integration

### Tertiary (informational only, not load-bearing for implementation decisions)
- Nielsen Norman Group on progressive disclosure — cited in FEATURES.md for customization form design rationale
- Conversion rate statistics for countdown timers, video, and personalized CTAs — directional guidance for feature prioritization

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
