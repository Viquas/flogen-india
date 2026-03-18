# Roadmap: Flogen

## Milestones

- [x] **v1.0 Internal Generation Engine** - Phases 1-5 (shipped 2026-03-18)
- [ ] **v2.0 Client Claim Flow** - Phases 6-10 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Internal Generation Engine (Phases 1-5) -- SHIPPED 2026-03-18</summary>

- [x] **Phase 1: Foundation Fixes** - Fix known bugs, decompose generator monolith, clean up codebase (completed 2026-03-17)
- [x] **Phase 2: Instrumentation** - Add cost tracking, error classification, prompt versioning, and queue health visibility (completed 2026-03-17)
- [x] **Phase 3: Quality and Intelligence** - Automated quality scoring, industry-aware template seeding, analytics dashboard (completed 2026-03-18)
- [x] **Phase 4: Batch Autopilot** - End-to-end pipeline orchestration from discovery to failure surfacing (completed 2026-03-18)
- [x] **Phase 5: UX Acceleration** - Keyboard-driven review, diff view, static export, preview pre-rendering (completed 2026-03-18)

### Phase 1: Foundation Fixes
**Goal**: The generation pipeline is reliable and the codebase is modular enough to safely extend
**Depends on**: Nothing (first phase)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06
**Plans**: 2/2 complete

### Phase 2: Instrumentation
**Goal**: Every AI generation produces structured cost, error, and prompt version data, and the operator can monitor queue health in real time
**Depends on**: Phase 1
**Requirements**: COST-01, COST-02, COST-03, COST-04, ERR-01, ERR-02, ERR-03, ERR-04, PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04, QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04
**Plans**: 3/4 complete

### Phase 3: Quality and Intelligence
**Goal**: Generated websites are automatically scored for quality, generation leverages the best approved outputs as few-shot examples, and the user has visual analytics across all generations
**Depends on**: Phase 2
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, TMPL-01, TMPL-02, TMPL-03, TMPL-04, ANAL-v1-01, ANAL-v1-02, ANAL-v1-03, ANAL-v1-04
**Plans**: 3/3 complete

### Phase 4: Batch Autopilot
**Goal**: The user can trigger one button and walk away while the system discovers, generates, scores, auto-fixes, and surfaces failures
**Depends on**: Phase 3
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04
**Plans**: 2/2 complete

### Phase 5: UX Acceleration
**Goal**: The review workflow is fast enough that the user spends seconds per project
**Depends on**: Phase 1
**Requirements**: KEY-01, KEY-02, KEY-03, KEY-04, DIFF-01, DIFF-02, DIFF-03, EXP-01, EXP-02, EXP-03, PRE-01, PRE-02, PRE-03
**Plans**: 4/4 complete

</details>

### v2.0 Client Claim Flow

**Milestone Goal:** Turn every generated website into a revenue opportunity with a 6-step client-facing claim flow: CTA injection, claim landing page, Razorpay payment, customization form, upsell, and confirmation with delivery timeline.

- [ ] **Phase 6: Foundation and CTA Injection** - Database schema, storage buckets, route groups, CTA bar on generated sites, geo-detection, pricing utility
- [ ] **Phase 7: Claim Landing Page** - Conversion-critical claim page with preview, pricing, domain options, trust elements, expired state
- [ ] **Phase 8: Payment and Confirmation** - Razorpay checkout, webhook verification, payment status polling, confirmation page with timeline
- [ ] **Phase 9: Customization and Upsell** - Post-payment customization form with file uploads, booking setup, strategy call upsell
- [ ] **Phase 10: Claim Analytics** - Funnel event tracking, claim_events table instrumentation, admin conversion dashboard

## Phase Details

### Phase 6: Foundation and CTA Injection
**Goal**: The infrastructure for the entire claim flow exists (tables, buckets, routes, utilities), and every generated website displays a working CTA bar that drives prospects to the claim page
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, CTA-01, CTA-02, CTA-03, CTA-04
**Success Criteria** (what must be TRUE):
  1. The `claims` and `customizations` tables exist in Supabase with proper foreign keys to `projects`, and `site-screenshots` and `claim-uploads` Storage buckets are configured with appropriate access policies
  2. The admin dashboard and editor continue to function identically under the `(admin)/` route group, and a `(client)/` route group exists with a separate mobile-first layout and no admin navigation chrome
  3. Every newly generated website displays a sticky bottom CTA bar showing the business name and a "Claim This Website" button that links to `/claim/{site_slug}`, with a countdown showing days remaining until claim expiry
  4. The CTA bar never visually breaks or conflicts with the generated site's styles regardless of the site's CSS -- it is fully style-isolated with inline styles and unique IDs
  5. When a site's claim period has expired, the CTA bar displays "This offer has expired" with a "Request a new website" link instead of the claim button
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md -- Database schema, storage buckets, TypeScript types, geo-detection and pricing utilities
- [ ] 06-02-PLAN.md -- Route group restructuring: (admin)/ and (client)/ with layout separation
- [ ] 06-03-PLAN.md -- CTA bar injector and screenshot generator

### Phase 7: Claim Landing Page
**Goal**: Prospects who click the CTA arrive at a high-converting, mobile-first claim page that presents the site preview, pricing plans, domain options, and trust elements -- everything needed to reach the "Pay" button
**Depends on**: Phase 6
**Requirements**: CLAIM-01, CLAIM-02, CLAIM-03, CLAIM-04, CLAIM-05, CLAIM-06, CLAIM-07, CLAIM-08, CLAIM-09, CLAIM-10
**Success Criteria** (what must be TRUE):
  1. Visiting `/claim/{site_slug}` on a mobile device shows a server-rendered page with the site screenshot hero, business name, countdown timer (days/hours/minutes/seconds), "What's Included" feature grid, and pricing cards -- all above the fold or within one scroll, loading under 2.5 seconds
  2. The pricing section displays Standard and Pro plans side-by-side with correct INR or USD amounts based on the visitor's detected country, and the visitor can manually toggle between INR and USD
  3. After selecting a plan, domain options appear (connect existing domain, buy new domain with availability search, or free subdomain) and a final CTA summarizes selections with the total price
  4. The page includes trust elements (business count, testimonials section, FAQ accordion) and OG meta tags that produce a rich preview when shared via WhatsApp or email
  5. Expired claims show an "Offer expired" state with a "Request a new website" form collecting name, email, and phone -- not a dead page or 404
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md -- Layout font setup, hosting pricing, server-rendered sections (hero, features, trust, FAQ), expired form with server action
- [x] 07-02-PLAN.md -- Interactive client components (countdown timer, pricing with currency toggle, domain selection, summary CTA)
- [ ] 07-03-PLAN.md -- Page assembly: client orchestrator, server page with generateMetadata and SSR data fetching

### Phase 8: Payment and Confirmation
**Goal**: Prospects can pay via Razorpay directly from the claim page and arrive at a confirmation page with their order summary and delivery timeline -- the minimum viable revenue path is complete
**Depends on**: Phase 7
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. Clicking "Pay" on the claim page opens a Razorpay checkout modal with the correct plan price (in paise/cents), and after successful payment the user is redirected to the confirmation page -- even if the webhook arrives before or after the redirect
  2. The Razorpay webhook at `/api/webhooks/razorpay` verifies the HMAC-SHA256 signature using the raw request body, processes payments idempotently (duplicate webhook deliveries do not corrupt state), and updates the claim record to `payment_status = 'completed'`
  3. Failed or cancelled payments return the user to the claim page with a visible error message and the ability to retry payment without re-entering selections
  4. The confirmation page at `/claim/{site_slug}/confirmed` shows a vertical timeline (payment confirmed, customization pending, updating site, preview email, go live), support contact info with WhatsApp link, and actionable next steps
  5. The confirmation page polls for payment status on load, resolving the webhook-before-redirect race condition within 30 seconds
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md -- Razorpay SDK singleton, GST pricing update, createRazorpayOrder server action
- [ ] 08-02-PLAN.md -- Razorpay webhook handler with HMAC verification, claim status polling endpoint
- [ ] 08-03-PLAN.md -- Client-side checkout.js integration, summary CTA with GST line items, confirmation page with polling and timeline

### Phase 9: Customization and Upsell
**Goal**: After paying, clients submit their customization details (logo, colors, contacts, photos, text changes) and optionally book a strategy call -- the operator has everything needed to deliver the final site
**Depends on**: Phase 8
**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06, CUST-07, CUST-08, CUST-09, UPSELL-01, UPSELL-02, UPSELL-03, UPSELL-04
**Success Criteria** (what must be TRUE):
  1. The customization form at `/claim/{site_slug}/customize` is only accessible after verified payment (server-side check rejects unpaid visitors) and displays a progress indicator showing Payment (done) -> Customize (current) -> Go Live
  2. The client can upload a logo (drag-and-drop, 5MB max, PNG/JPG, with thumbnail preview) and up to 10 photos (5MB each, with thumbnails and remove buttons) via Supabase Storage -- all uploads validated server-side for file type
  3. Contact info fields are pre-filled from the business's Google Maps data (phone, email, address, hours, WhatsApp) and the client can edit them, set brand colors, and submit text change requests (1000 char limit)
  4. Pro plan clients see a booking system setup section (service types, available days/hours, buffer time) that Standard plan clients do not see
  5. After customization submission, a strategy call upsell appears with a Cal.com scheduling embed (free for Pro, paid for Standard), and a clearly visible "No thanks, continue" skip link that proceeds to confirmation
**Plans**: 3 plans

Plans:
- [ ] 09-01-PLAN.md -- Upload API with magic byte validation, payment-gated customize page scaffold, progress indicator
- [ ] 09-02-PLAN.md -- Customization form components (logo, photos, colors, contact, text, booking) and form orchestrator with submission action
- [ ] 09-03-PLAN.md -- Strategy call upsell page with Cal.com iframe, conditional Standard plan payment, skip link

### Phase 10: Claim Analytics
**Goal**: The operator can see exactly where prospects drop off in the claim funnel and which sites convert best, enabling data-driven optimization of the claim flow
**Depends on**: Phase 8 (funnel must be live to produce data; can run in parallel with Phase 9)
**Requirements**: ANAL-01, ANAL-02, ANAL-03
**Success Criteria** (what must be TRUE):
  1. Every step of the claim funnel (preview view, claim page view, CTA click, plan selected, payment initiated, payment completed, customization submitted) is tracked as an event in the `claim_events` table with timestamp, IP, user agent, and site_slug
  2. The admin dashboard shows a conversion funnel visualization with counts at each step and drop-off percentages between steps, filterable by date range
  3. The analytics data includes revenue totals by plan type and conversion rates from generated site to paid claim
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 -> 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation Fixes | v1.0 | 2/2 | Complete | 2026-03-17 |
| 2. Instrumentation | v1.0 | 3/4 | Complete | 2026-03-17 |
| 3. Quality and Intelligence | v1.0 | 3/3 | Complete | 2026-03-18 |
| 4. Batch Autopilot | v1.0 | 2/2 | Complete | 2026-03-18 |
| 5. UX Acceleration | v1.0 | 4/4 | Complete | 2026-03-18 |
| 6. Foundation and CTA Injection | v2.0 | 3/3 | Complete | 2026-03-18 |
| 7. Claim Landing Page | v2.0 | 2/3 | In progress | - |
| 8. Payment and Confirmation | v2.0 | 0/3 | Not started | - |
| 9. Customization and Upsell | v2.0 | 0/3 | Not started | - |
| 10. Claim Analytics | v2.0 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-18*
*Last updated: 2026-03-19 -- Phase 9 planned (3 plans)*
