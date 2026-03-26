# Roadmap: Flogen

## Milestones

- [x] **v1.0 Internal Generation Engine** - Phases 1-5 (shipped 2026-03-18)
- [x] **v2.0 Client Claim Flow** - Phases 6-10 (shipped 2026-03-19)
- [x] **v3.0 Client Portal & Updated Funnel** - Phases 11-15 (shipped 2026-03-25)
- [x] **v4.0 Somosite Agency Landing Page** - Phases 16-20 (shipped 2026-03-26)
- [ ] **v5.0 Lead Lists & Custom Builds** - Phases 21-23 (in progress)

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

<details>
<summary>v4.0 Somosite Agency Landing Page (Phases 16-20) -- SHIPPED 2026-03-26</summary>

- [x] **Phase 16: Marketing Foundation** - (marketing) route group, layout, font loading, design tokens, marketing-constants.ts, root route change, responsive baseline (completed 2026-03-25)
- [x] **Phase 17: Hero, Trust & Problem** - Navigation bar, hero section, trust bar, problem section, scroll-triggered animations (completed 2026-03-25)
- [x] **Phase 18: How It Works, Portfolio & Benefits** - Three-step process, 6-site portfolio showcase, outcome-focused differentiators (completed 2026-03-25)
- [x] **Phase 19: Pricing, FAQ & Final CTA** - Three-tier pricing cards, objection-handling accordion, urgency-driven final CTA (completed 2026-03-25)
- [x] **Phase 20: Contact, Footer, Legal & Polish** - Contact form with email handler, footer, 3 legal pages, cookie consent, SEO metadata, PageSpeed optimization (completed 2026-03-25)

### Phase 16: Marketing Foundation
**Goal**: The (marketing) route group exists with its own layout, dark design system tokens, premium font stack, and centralized copy -- visiting / renders the landing page shell instead of redirecting to /dashboard, and all existing routes continue working
**Depends on**: Phase 15 (v3.0 complete)
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, DLS-01, DLS-02, DLS-04, DLS-05, INFRA-04
**Plans**: 1/1 complete

Plans:
- [x] 16-01-PLAN.md -- Marketing constants, (marketing) route group layout with dark design tokens + fonts, landing page shell, root route change

### Phase 17: Hero, Trust & Problem
**Goal**: The top three sections of the landing page are complete -- visitors see a sticky navigation bar, a compelling hero with browser mockup visual, trust signals, and an empathetic problem statement that creates emotional resonance
**Depends on**: Phase 16
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, DLS-03
**Plans**: 2/2 complete

Plans:
- [x] 17-01-PLAN.md -- Scroll animation hook, marketing constants update (nav/hero copy), sticky navbar with mobile hamburger
- [x] 17-02-PLAN.md -- Hero section with browser mockup + float animation, trust bar with Lucide icons, problem section, page.tsx wiring

### Phase 18: How It Works, Portfolio & Benefits
**Goal**: The middle sections of the landing page demonstrate competence -- visitors see a clear 3-step process, browse 6 demo site screenshots in polished browser mockups, and read outcome-focused differentiators that build purchase intent
**Depends on**: Phase 17
**Requirements**: PAGE-05, PAGE-06, PAGE-07
**Plans**: 2/2 complete

Plans:
- [x] 18-01-PLAN.md -- Update marketing constants to PRD copy, create HowItWorks and Benefits components
- [x] 18-02-PLAN.md -- Portfolio component with browser mockup cards and quality badges, wire all 3 into page.tsx

### Phase 19: Pricing, FAQ & Final CTA
**Goal**: The conversion sections are complete -- visitors can compare pricing tiers, get objections answered, and encounter a final urgency-driven call to action that pushes them to reach out
**Depends on**: Phase 18
**Requirements**: PAGE-08, PAGE-09, PAGE-10
**Plans**: 1/1 complete

Plans:
- [x] 19-01-PLAN.md -- Update constants to PRD copy, create Pricing (3-tier cards with Pro elevation), FAQ (hand-coded accordion), FinalCTA (urgency section), wire into page.tsx

### Phase 20: Contact, Footer, Legal & Polish
**Goal**: The landing page is complete and production-ready -- visitors can submit a contact form that sends an email, browse legal pages, accept/decline cookies, and the page scores 95+ on PageSpeed with full SEO metadata
**Depends on**: Phase 19
**Requirements**: PAGE-11, PAGE-12, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, INFRA-01, INFRA-02, INFRA-03
**Plans**: 2/2 complete

Plans:
- [x] 20-01-PLAN.md -- Contact form component + /api/contact email route + footer component + constants update + page wiring
- [x] 20-02-PLAN.md -- 3 legal pages (privacy, terms, refund) + cookie consent banner + SEO metadata + layout update

</details>

### v5.0 Lead Lists & Custom Builds

**Milestone Goal:** Add two new admin pipeline tools: (1) Lead Lists for discovery-only Google Places queries saved for cold calling, and (2) Custom Builds for one-off website generation from a Google Maps URL or pasted business data. Admin-only features, no client-facing changes.

- [x] **Phase 21: Lead Lists Foundation** - Schema migrations, lead discovery API, "Get List" CTA in Discovery Engine, sidebar nav item (completed 2026-03-26)
- [ ] **Phase 22: Lead Lists UI** - /dashboard/leads page with date picker and batch cards, lead detail popup with RJSON viewer, CSV export, "Generate Website" from lead
- [ ] **Phase 23: Custom Build** - Custom build modal with URL and data tabs, APIs, source tracking on projects, /dashboard/custom page, sidebar nav, dashboard CTA

## Phase Details

### Phase 21: Lead Lists Foundation
**Goal**: The database schema supports lead lists and project source tracking, the Discovery Engine has a "Get List" CTA that fetches Google Places results without triggering generation, and the sidebar has a Lead Lists menu item
**Depends on**: Phase 20 (v4.0 complete)
**Requirements**: SCHM-01, SCHM-02, LEAD-01, LEAD-02, LEAD-07
**Success Criteria** (what must be TRUE):
  1. A `lead_lists` table exists in Supabase with batch_id, business name, phone, email, address, maps URL, raw_data (JSONB), and appropriate indexes -- and TypeScript types are generated
  2. The `projects` table has a `source` column with values 'discovery', 'custom', or 'code-drop' (default 'discovery') -- existing projects are unaffected
  3. User can click "Get List" in the Discovery Engine modal and see Google Places results fetched and saved to the lead_lists table without any generation jobs being created
  4. A "Lead Lists" menu item appears in the sidebar under Fulfillment and navigates to /dashboard/leads
**Plans**: 2 plans

Plans:
- [x] 21-01: Schema migrations (lead_lists table, projects.source column) + TypeScript types
- [x] 21-02: Lead discovery API (POST /api/leads/discover), "Get List" CTA in Discovery Engine modal, sidebar nav update

### Phase 22: Lead Lists UI
**Goal**: The operator can browse lead batches by date, inspect individual leads with full RJSON data, export batches as CSV for cold calling, and send any lead into the website generation pipeline
**Depends on**: Phase 21
**Requirements**: LEAD-03, LEAD-04, LEAD-05, LEAD-06
**Success Criteria** (what must be TRUE):
  1. User can visit /dashboard/leads and see lead batches grouped by date with a date picker filter, each batch showing query, location, and lead count
  2. User can click a lead row to open a detail popup displaying the full RJSON data (business name, address, phone, email, website, rating, reviews, photos, hours, etc.)
  3. User can click "Generate Website" from a lead detail popup and the lead is sent through the existing generation pipeline (enrichment + generation), creating a project with source='discovery'
  4. User can click a CSV export button on any batch to download a file with name, email, phone, location, and maps URL columns
**Plans**: 2 plans

Plans:
- [ ] 22-01-PLAN.md -- Leads page with date picker, batch cards, lead rows table, server-side Supabase query
- [ ] 22-02-PLAN.md -- Lead detail modal with RJSON viewer, Generate Website API + CTA, CSV batch export

### Phase 23: Custom Build
**Goal**: The operator can generate a website from any Google Maps URL or raw business data in a single action, view all custom-built projects in a dedicated page, and access the feature from the dashboard header
**Depends on**: Phase 21
**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06
**Success Criteria** (what must be TRUE):
  1. User can click "Custom Build" on the dashboard header to open a modal with two tabs: "Google Maps URL" and "Upload Business Data"
  2. User can paste a Google Maps URL in the first tab, submit it, and a website is generated (Place ID extracted, data fetched, enriched, generated) -- the resulting project has source='custom'
  3. User can paste or type business data (text or JSON) in the second tab, submit it, and a website is generated from that data -- the resulting project has source='custom'
  4. User can visit /dashboard/custom and see only projects where source='custom', with the same grid/card layout as the main dashboard
  5. A "Custom Builds" menu item appears in the sidebar under Fulfillment and navigates to /dashboard/custom
**Plans**: TBD

Plans:
- [ ] 23-01: Custom build modal (Google Maps URL tab + Upload Business Data tab), POST /api/custom-build/from-url, POST /api/custom-build/from-data
- [ ] 23-02: /dashboard/custom page (filtered by source='custom'), sidebar nav update, dashboard header CTA

## Progress

**Execution Order:**
Phases execute in numeric order: 21 -> 22 -> 23

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
| 18. How It Works, Portfolio & Benefits | v4.0 | 2/2 | Complete | 2026-03-25 |
| 19. Pricing, FAQ & Final CTA | v4.0 | 1/1 | Complete | 2026-03-25 |
| 20. Contact, Footer, Legal & Polish | v4.0 | 2/2 | Complete | 2026-03-25 |
| 21. Lead Lists Foundation | v5.0 | 2/2 | Complete | 2026-03-26 |
| 22. Lead Lists UI | v5.0 | 0/2 | Not started | - |
| 23. Custom Build | v5.0 | 0/2 | Not started | - |

---
*Roadmap created: 2026-03-18*
*Last updated: 2026-03-26 -- Phase 22 planned (2 plans, 2 waves)*
