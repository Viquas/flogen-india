# Roadmap: Flogen

## Milestones

- [x] **v1.0 Internal Generation Engine** - Phases 1-5 (shipped 2026-03-18)
- [x] **v2.0 Client Claim Flow** - Phases 6-10 (shipped 2026-03-19)
- [x] **v3.0 Client Portal & Updated Funnel** - Phases 11-15 (shipped 2026-03-25)
- [ ] **v4.0 Somosite Agency Landing Page** - Phases 16-20 (in progress)

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

<details>
<summary>v2.0 Client Claim Flow (Phases 6-10) -- SHIPPED 2026-03-19</summary>

- [x] **Phase 6: Foundation and CTA Injection** - Database schema, storage buckets, route groups, CTA bar on generated sites, geo-detection, pricing utility (completed 2026-03-18)
- [x] **Phase 7: Claim Landing Page** - Conversion-critical claim page with preview, pricing, domain options, trust elements, expired state (completed 2026-03-19)
- [x] **Phase 8: Payment and Confirmation** - Razorpay checkout, webhook verification, payment status polling, confirmation page with timeline (completed 2026-03-19)
- [x] **Phase 9: Customization and Upsell** - Post-payment customization form with file uploads, booking setup, strategy call upsell (completed 2026-03-19)
- [x] **Phase 10: Claim Analytics** - Funnel event tracking, claim_events table instrumentation, admin conversion dashboard (completed 2026-03-18)

### Phase 6: Foundation and CTA Injection
**Goal**: The infrastructure for the entire claim flow exists (tables, buckets, routes, utilities), and every generated website displays a working CTA bar that drives prospects to the claim page
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, CTA-01, CTA-02, CTA-03, CTA-04
**Plans**: 3/3 complete

### Phase 7: Claim Landing Page
**Goal**: Prospects who click the CTA arrive at a high-converting, mobile-first claim page that presents the site preview, pricing plans, domain options, and trust elements -- everything needed to reach the "Pay" button
**Depends on**: Phase 6
**Requirements**: CLAIM-01, CLAIM-02, CLAIM-03, CLAIM-04, CLAIM-05, CLAIM-06, CLAIM-07, CLAIM-08, CLAIM-09, CLAIM-10
**Plans**: 3/3 complete

### Phase 8: Payment and Confirmation
**Goal**: Prospects can pay via Razorpay directly from the claim page and arrive at a confirmation page with their order summary and delivery timeline -- the minimum viable revenue path is complete
**Depends on**: Phase 7
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, CONF-01, CONF-02, CONF-03
**Plans**: 3/3 complete

### Phase 9: Customization and Upsell
**Goal**: After paying, clients submit their customization details (logo, colors, contacts, photos, text changes) and optionally book a strategy call -- the operator has everything needed to deliver the final site
**Depends on**: Phase 8
**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06, CUST-07, CUST-08, CUST-09, UPSELL-01, UPSELL-02, UPSELL-03, UPSELL-04
**Plans**: 3/3 complete

### Phase 10: Claim Analytics
**Goal**: The operator can see exactly where prospects drop off in the claim funnel and which sites convert best, enabling data-driven optimization of the claim flow
**Depends on**: Phase 8
**Requirements**: ANAL-01, ANAL-02, ANAL-03
**Plans**: 2/2 complete

</details>

<details>
<summary>v3.0 Client Portal & Updated Funnel (Phases 11-15) -- SHIPPED 2026-03-25</summary>

- [x] **Phase 11: Auth Infrastructure & Schema** - proxy.ts session middleware, Supabase Auth clients, DB migrations for client_requests table and new columns (completed 2026-03-24)
- [x] **Phase 12: Payment-First Claim Flow** - Harden webhook with dual verification, simplify claim page, USD-only pricing, test/live mode, server-side account creation (completed 2026-03-24)
- [x] **Phase 13: Portal Shell** - Auth-guarded portal layout, dashboard with site preview, login page, password setup on confirmation (completed 2026-03-24)
- [x] **Phase 14: Portal Features** - Change requests, domain management, logo upload with AI bg removal, booking setup, agent support payment (completed 2026-03-25)
- [x] **Phase 15: Admin Fulfillment** - Purchased clients list, customer requests queue, status transitions, redeploy button (completed 2026-03-25)

### Phase 11: Auth Infrastructure & Schema
**Goal**: The authentication layer and database schema required by all subsequent phases exist and are verified working -- proxy.ts protects portal routes without breaking webhooks, admin, or public pages
**Depends on**: Phase 10 (v2.0 complete)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, AUTH-03, AUTH-05
**Plans**: 2/2 complete

Plans:
- [x] 11-01: DB migrations (client_requests table, claims.auth_user_id, projects.cal_embed_slug) and TypeScript types
- [x] 11-02: proxy.ts with whitelist matcher, Supabase proxy client, portal anon-key client

### Phase 12: Payment-First Claim Flow
**Goal**: The claim page is simplified to payment-first with a confirmation step before Razorpay checkout -- the webhook updates claim status and contact info, dual verification eliminates the race condition, and the confirmation page creates Supabase Auth accounts when clients set their password
**Depends on**: Phase 11
**Requirements**: FUNNEL-01, FUNNEL-02, FUNNEL-03, FUNNEL-04, FUNNEL-05, FUNNEL-06, FUNNEL-07, FUNNEL-08, AUTH-01, AUTH-06
**Plans**: 3/3 complete

Plans:
- [x] 12-01-PLAN.md -- Backend hardening: USD-only pricing, Razorpay test/live mode, webhook error handling, dual verification endpoint, simplified server action
- [x] 12-02-PLAN.md -- Claim page simplification: remove domain section and summary CTA, add confirmation step, Cal.com Premium popup, test mode banner
- [x] 12-03-PLAN.md -- Confirmation page rewrite: dual verification polling, password setup with account creation, auto-login and /portal redirect

### Phase 13: Portal Shell
**Goal**: Paying clients can log in to an authenticated portal at `/portal` and see their site preview, live URL, and plan details -- the minimum viable portal proves the auth flow end-to-end
**Depends on**: Phase 12
**Requirements**: AUTH-02, AUTH-04, PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-06
**Plans**: 2/2 complete

Plans:
- [x] 13-01-PLAN.md -- Portal login page with split layout, password reset flow, proxy.ts update for /portal/reset
- [x] 13-02-PLAN.md -- Auth-guarded portal layout and dashboard (preview iframe, URL card, plan badge, status indicator, responsive nav)

### Phase 14: Portal Features
**Goal**: Clients can manage their domain, upload a logo with AI background removal, submit change requests, set up booking (Pro), and pay for agent support -- all from the portal
**Depends on**: Phase 13
**Requirements**: PORTAL-04, PORTAL-05, PORTAL-07, DOMAIN-01, DOMAIN-02, DOMAIN-03, DOMAIN-04, DOMAIN-05, DOMAIN-06, LOGO-01, LOGO-02, LOGO-03, LOGO-04
**Plans**: 4/4 complete

Plans:
- [x] 14-01-PLAN.md -- Customize page with change request form, request history, portal requests API, nav enablement
- [x] 14-02-PLAN.md -- Domain page with 3-card grid, free subdomain, DNS verification, Domainr search, AI suggestions
- [x] 14-03-PLAN.md -- Logo upload with Gemini Vision green-screen background removal and approval flow
- [x] 14-04-PLAN.md -- Support page with $49 agent payment, webhook differentiation, floating help button

### Phase 15: Admin Fulfillment
**Goal**: The operator can see all purchased clients, view and process their change requests, and redeploy updated sites -- completing the client-to-admin feedback loop
**Depends on**: Phase 14
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Plans**: 2/2 complete

Plans:
- [x] 15-01-PLAN.md -- Clients list page, client detail page, server actions, sidebar nav update
- [x] 15-02-PLAN.md -- Editor: Customer Requests tab, status transitions, Redeploy button replacing Approve

</details>

### v4.0 Somosite Agency Landing Page

**Milestone Goal:** Build a premium agency landing page at somosite.com root that convinces cold email recipients the company is real, professional, and worth paying $499-$1,299 for a website. Also satisfies Razorpay verification requirements.

- [x] **Phase 16: Marketing Foundation** - (marketing) route group, layout, font loading, design tokens, marketing-constants.ts, root route change, responsive baseline (completed 2026-03-25)
- [x] **Phase 17: Hero, Trust & Problem** - Navigation bar, hero section, trust bar, problem section, scroll-triggered animations (completed 2026-03-25)
- [x] **Phase 18: How It Works, Portfolio & Benefits** - Three-step process, 6-site portfolio showcase, outcome-focused differentiators (completed 2026-03-25)
- [x] **Phase 19: Pricing, FAQ & Final CTA** - Three-tier pricing cards, objection-handling accordion, urgency-driven final CTA (completed 2026-03-25)
- [ ] **Phase 20: Contact, Footer, Legal & Polish** - Contact form with email handler, footer, 3 legal pages, cookie consent, SEO metadata, PageSpeed optimization

## Phase Details

### Phase 16: Marketing Foundation
**Goal**: The (marketing) route group exists with its own layout, dark design system tokens, premium font stack, and centralized copy -- visiting / renders the landing page shell instead of redirecting to /dashboard, and all existing routes continue working
**Depends on**: Phase 15 (v3.0 complete)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, DLS-01, DLS-02, DLS-04, DLS-05, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Visiting `/` in a browser renders the marketing landing page layout (dark background, correct fonts) instead of redirecting to `/dashboard`
  2. The (marketing) route group has its own layout.tsx that loads DM Serif Display (or chosen serif) for headings and Inter for body via next/font, completely isolated from admin (Geist) and client (Inter) font stacks
  3. A `lib/marketing-constants.ts` file exports all marketing copy (headlines, subheadlines, CTAs, feature descriptions, FAQ content, pricing data) and every text string on the landing page reads from this file -- no hardcoded copy in components
  4. Design tokens (#0A0A0A background, #AF92FF accent, grain texture, translucent layers) are applied to the layout and all marketing components use them consistently
  5. All existing routes (/dashboard, /claim/*, /preview/*, /portal/*) load and function exactly as before -- no regressions from the root route change or new route group
**Plans**: 1 plan

Plans:
- [x] 16-01-PLAN.md -- Marketing constants, (marketing) route group layout with dark design tokens + fonts, landing page shell, root route change

### Phase 17: Hero, Trust & Problem
**Goal**: The top three sections of the landing page are complete -- visitors see a sticky navigation bar, a compelling hero with browser mockup visual, trust signals, and an empathetic problem statement that creates emotional resonance
**Depends on**: Phase 16
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, DLS-03
**Success Criteria** (what must be TRUE):
  1. The navigation bar is sticky at the top, transitions from transparent to solid background on scroll, contains smooth-scrolling anchor links to each section, and collapses into a hamburger menu on mobile (below 640px)
  2. The hero section displays a headline, subheadline, two CTA buttons ("See Our Work" scrolling to portfolio, "View Pricing" scrolling to pricing), and a browser mockup visual with a subtle float animation
  3. The trust bar shows 4 credibility signals (sites delivered count, turnaround time, satisfaction rate, technologies used) with Lucide icons in a horizontal row
  4. The problem section presents empathetic copy about the pain of having a bad website, centered with generous whitespace, readable and impactful
  5. All sections animate in on scroll (fade-in/slide-up, 600-800ms ease-out) using IntersectionObserver with CSS transitions only -- no JavaScript animation libraries
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md -- Scroll animation hook, marketing constants update (nav/hero copy), sticky navbar with mobile hamburger
- [x] 17-02-PLAN.md -- Hero section with browser mockup + float animation, trust bar with Lucide icons, problem section, page.tsx wiring

### Phase 18: How It Works, Portfolio & Benefits
**Goal**: The middle sections of the landing page demonstrate competence -- visitors see a clear 3-step process, browse 6 demo site screenshots in polished browser mockups, and read outcome-focused differentiators that build purchase intent
**Depends on**: Phase 17
**Requirements**: PAGE-05, PAGE-06, PAGE-07
**Success Criteria** (what must be TRUE):
  1. The How It Works section shows 3 numbered step cards (e.g., "Tell us about your business", "We design your site", "Go live") with icons and connecting visual lines between steps on desktop, collapsing to a vertical timeline on mobile
  2. The Portfolio section displays 6 demo site screenshots inside browser mockup frames, each with a business name, category label, and a "View Demo" link -- placeholder images are used until real screenshots are generated in a future milestone
  3. The Benefits section presents outcome-focused differentiators (e.g., "Launch in 48 hours", "Mobile-first design", "Built to convert") in an alternating left-right layout on desktop or a clean grid, with each benefit having an icon, heading, and short description
**Plans**: 2 plans

Plans:
- [ ] 18-01-PLAN.md -- Update marketing constants to PRD copy, create HowItWorks and Benefits components
- [ ] 18-02-PLAN.md -- Portfolio component with browser mockup cards and quality badges, wire all 3 into page.tsx

### Phase 19: Pricing, FAQ & Final CTA
**Goal**: The conversion sections are complete -- visitors can compare pricing tiers, get objections answered, and encounter a final urgency-driven call to action that pushes them to reach out
**Depends on**: Phase 18
**Requirements**: PAGE-08, PAGE-09, PAGE-10
**Success Criteria** (what must be TRUE):
  1. The Pricing section shows 3 cards: Standard ($499), Pro ($1,299, highlighted as "Most Popular" with a visual badge), and Premium ("Custom pricing", "Contact Us" CTA) -- each card lists included features, and "Get Started" buttons scroll to the contact form
  2. The FAQ section is an accordion with 7 objection-handling questions (e.g., turnaround time, revision policy, what's included, refund policy) -- clicking a question expands/collapses the answer with smooth animation, only one open at a time
  3. The Final CTA section has a dark background contrasting with the page, urgency-focused copy, and primary + secondary CTA buttons that scroll to the contact form
**Plans**: 1 plan

Plans:
- [ ] 19-01-PLAN.md -- Update constants to PRD copy, create Pricing (3-tier cards with Pro elevation), FAQ (hand-coded accordion), FinalCTA (urgency section), wire into page.tsx

### Phase 20: Contact, Footer, Legal & Polish
**Goal**: The landing page is complete and production-ready -- visitors can submit a contact form that sends an email, browse legal pages, accept/decline cookies, and the page scores 95+ on PageSpeed with full SEO metadata
**Depends on**: Phase 19
**Requirements**: PAGE-11, PAGE-12, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. The contact form collects name, email, business name (optional), and message -- submitting it sends an email to the operator via POST /api/contact using the existing nodemailer/Gmail SMTP setup, shows a success confirmation, and handles errors gracefully
  2. The footer displays 4 columns (Company, Product, Legal, Trust) with relevant links, payment method badges, and copyright -- legal links navigate to /privacy, /terms, and /refund
  3. Privacy policy (/privacy), terms of service (/terms), and refund policy (/refund) pages exist within the (marketing) route group, each with properly formatted legal content and consistent dark styling
  4. A cookie consent banner appears on first visit with Accept/Decline buttons, persists the preference in localStorage, and does not reappear after a choice is made
  5. The landing page has meta title, description, OG image, and canonical URL set in the (marketing) layout, and scores 95+ on both mobile and desktop PageSpeed (optimized images, minimal JS, proper next/image usage)
**Plans**: 1 plan

Plans:
- [ ] 20-01: TBD
- [ ] 20-02: TBD
- [ ] 20-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 16 -> 17 -> 18 -> 19 -> 20

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation Fixes | v1.0 | 2/2 | Complete | 2026-03-17 |
| 2. Instrumentation | v1.0 | 3/4 | Complete | 2026-03-17 |
| 3. Quality and Intelligence | v1.0 | 3/3 | Complete | 2026-03-18 |
| 4. Batch Autopilot | v1.0 | 2/2 | Complete | 2026-03-18 |
| 5. UX Acceleration | v1.0 | 4/4 | Complete | 2026-03-18 |
| 6. Foundation and CTA Injection | v2.0 | 3/3 | Complete | 2026-03-18 |
| 7. Claim Landing Page | v2.0 | 3/3 | Complete | 2026-03-19 |
| 8. Payment and Confirmation | v2.0 | 3/3 | Complete | 2026-03-19 |
| 9. Customization and Upsell | v2.0 | 3/3 | Complete | 2026-03-19 |
| 10. Claim Analytics | v2.0 | 2/2 | Complete | 2026-03-18 |
| 11. Auth Infrastructure & Schema | v3.0 | 2/2 | Complete | 2026-03-24 |
| 12. Payment-First Claim Flow | v3.0 | 3/3 | Complete | 2026-03-24 |
| 13. Portal Shell | v3.0 | 2/2 | Complete | 2026-03-24 |
| 14. Portal Features | v3.0 | 4/4 | Complete | 2026-03-25 |
| 15. Admin Fulfillment | v3.0 | 2/2 | Complete | 2026-03-25 |
| 16. Marketing Foundation | v4.0 | 1/1 | Complete | 2026-03-25 |
| 17. Hero, Trust & Problem | v4.0 | 2/2 | Complete | 2026-03-25 |
| 18. How It Works, Portfolio & Benefits | 2/2 | Complete    | 2026-03-25 | - |
| 19. Pricing, FAQ & Final CTA | 1/1 | Complete   | 2026-03-25 | - |
| 20. Contact, Footer, Legal & Polish | v4.0 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-18*
*Last updated: 2026-03-26 -- Phase 19 planned (1 plan, wave 1)*
