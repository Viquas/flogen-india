# Roadmap: Flogen

## Milestones

- [x] **v1.0 Internal Generation Engine** - Phases 1-5 (shipped 2026-03-18)
- [x] **v2.0 Client Claim Flow** - Phases 6-10 (shipped 2026-03-19)
- [ ] **v3.0 Client Portal & Updated Funnel** - Phases 11-15 (in progress)

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

### v3.0 Client Portal & Updated Funnel

**Milestone Goal:** Add Supabase Auth for client accounts, simplify the claim flow to payment-first (no pre-payment forms), build an authenticated client portal for domain management/customization/requests, and give the admin a fulfillment dashboard to process client work.

- [x] **Phase 11: Auth Infrastructure & Schema** - proxy.ts session middleware, Supabase Auth clients, DB migrations for client_requests table and new columns (completed 2026-03-24)
- [x] **Phase 12: Payment-First Claim Flow** - Harden webhook with dual verification, simplify claim page, USD-only pricing, test/live mode, server-side account creation (completed 2026-03-24)
- [x] **Phase 13: Portal Shell** - Auth-guarded portal layout, dashboard with site preview, login page, password setup on confirmation (completed 2026-03-24)
- [x] **Phase 14: Portal Features** - Change requests, domain management, logo upload with AI bg removal, booking setup, agent support payment (completed 2026-03-25)
- [ ] **Phase 15: Admin Fulfillment** - Purchased clients list, customer requests queue, status transitions, redeploy button

## Phase Details

### Phase 11: Auth Infrastructure & Schema
**Goal**: The authentication layer and database schema required by all subsequent phases exist and are verified working -- proxy.ts protects portal routes without breaking webhooks, admin, or public pages
**Depends on**: Phase 10 (v2.0 complete)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, AUTH-03, AUTH-05
**Success Criteria** (what must be TRUE):
  1. The `client_requests` table exists in Supabase with columns (id, claim_id, project_id, auth_user_id, type, status, content JSONB, created_at, updated_at), RLS enabled, and policies scoped to auth_user_id
  2. The `claims` table has a nullable `auth_user_id` UUID column with foreign key to `auth.users`, and the `projects` table has a nullable `cal_embed_slug` TEXT column
  3. `proxy.ts` at the project root refreshes Supabase auth session cookies and redirects unauthenticated requests from `/portal/*` to the login page -- visiting `/portal/` without a session redirects to `/portal/login`
  4. The Razorpay webhook at `/api/webhooks/razorpay` still returns 200 after proxy.ts is added (body is not consumed by middleware), the admin dashboard loads without auth prompts, and public claim pages load without redirects
**Plans**: 2 plans

Plans:
- [x] 11-01: DB migrations (client_requests table, claims.auth_user_id, projects.cal_embed_slug) and TypeScript types
- [x] 11-02: proxy.ts with whitelist matcher, Supabase proxy client, portal anon-key client

### Phase 12: Payment-First Claim Flow
**Goal**: The claim page is simplified to payment-first with a confirmation step before Razorpay checkout -- the webhook updates claim status and contact info, dual verification eliminates the race condition, and the confirmation page creates Supabase Auth accounts when clients set their password
**Depends on**: Phase 11
**Requirements**: FUNNEL-01, FUNNEL-02, FUNNEL-03, FUNNEL-04, FUNNEL-05, FUNNEL-06, FUNNEL-07, FUNNEL-08, AUTH-01, AUTH-06
**Success Criteria** (what must be TRUE):
  1. The claim page at `/claim/{slug}` shows the site preview, pricing cards ($499 Standard, $1,299 Pro, Premium "Contact Us"), and a "Get Started" button per plan -- no domain selection section, no pre-payment contact forms, no INR pricing or currency toggle
  2. Clicking "Get Started" shows a confirmation step (plan + price + "Confirm & Pay" button), then opens the Razorpay checkout modal -- `createRazorpayOrder()` creates a claim with only project_id, plan, and amount
  3. The webhook handler updates the claim to 'paid' and populates client_name, client_email, client_phone from the Razorpay payload -- the webhook does NOT create auth accounts
  4. The confirmation page uses dual verification (checks DB for webhook result, falls back to Razorpay Orders API) to resolve the race condition -- payment is confirmed within seconds
  5. After payment verification, the confirmation page prominently presents a password setup form with pre-filled read-only email -- setting the password creates a Supabase Auth account via `auth.admin.createUser()` and auto-logs the client in with redirect to /portal
  6. Setting `RAZORPAY_MODE=test` in env switches to test API keys, and all payment pages display a visible "Test Mode" banner
**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md -- Backend hardening: USD-only pricing, Razorpay test/live mode, webhook error handling, dual verification endpoint, simplified server action
- [x] 12-02-PLAN.md -- Claim page simplification: remove domain section and summary CTA, add confirmation step, Cal.com Premium popup, test mode banner
- [x] 12-03-PLAN.md -- Confirmation page rewrite: dual verification polling, password setup with account creation, auto-login and /portal redirect

### Phase 13: Portal Shell
**Goal**: Paying clients can log in to an authenticated portal at `/portal` and see their site preview, live URL, and plan details -- the minimum viable portal proves the auth flow end-to-end
**Depends on**: Phase 12
**Requirements**: AUTH-02, AUTH-04, PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-06
**Success Criteria** (what must be TRUE):
  1. The confirmation page presents a password field where first-time clients set their portal password -- submitting it creates their auth session and the account is linked to their claim and project
  2. Returning clients can log in at `/portal/login` with email and password and are redirected to `/portal`
  3. The portal dashboard at `/portal` displays a full-width iframe preview of the client's generated site, their live URL (subdomain or custom domain) with a copy-to-clipboard button, a plan badge (Standard/Pro), and a site status indicator (Active, Customization Pending, Update in Progress)
  4. The portal layout is mobile-responsive and works at 375px width -- navigation, preview, and all information cards are usable on a phone screen
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md -- Portal login page with split layout, password reset flow, proxy.ts update for /portal/reset
- [x] 13-02-PLAN.md -- Auth-guarded portal layout and dashboard (preview iframe, URL card, plan badge, status indicator, responsive nav)

### Phase 14: Portal Features
**Goal**: Clients can manage their domain, upload a logo with AI background removal, submit change requests, set up booking (Pro), and pay for agent support -- all from the portal
**Depends on**: Phase 13
**Requirements**: PORTAL-04, PORTAL-05, PORTAL-07, DOMAIN-01, DOMAIN-02, DOMAIN-03, DOMAIN-04, DOMAIN-05, DOMAIN-06, LOGO-01, LOGO-02, LOGO-03, LOGO-04
**Success Criteria** (what must be TRUE):
  1. A client can type a change request into a single textarea, optionally attach a file, submit it, and see it appear in their request history with a "pending" status badge -- subsequent requests also appear in chronological order with status badges (pending, in-progress, completed)
  2. On payment, a free subdomain ({business-slug}.flogen.com) is auto-provisioned and displayed in the portal -- the client can also enter an existing domain, receive a TXT record to add at their registrar, and the portal polls DNS until verification succeeds (with step-by-step instructions and status display)
  3. A client can search for domain availability via Domainr, see external registrar links for available domains, and if their desired domain is unavailable, AI generates alternative suggestions that are batch-checked and only available options are shown
  4. A client can upload a logo (drag-and-drop, PNG/JPEG, max 5MB), Gemini Vision detects non-transparent backgrounds and offers removal with a before/after preview, and the client approves or reverts the result before saving
  5. Pro plan clients see a Cal.com booking setup field (embed slug input stored in `projects.cal_embed_slug`) that Standard clients do not see, and any client can pay $49 for agent support (domain setup or other assistance) via Razorpay
**Plans**: 4 plans

Plans:
- [ ] 14-01-PLAN.md -- Customize page with change request form, request history, portal requests API, nav enablement
- [ ] 14-02-PLAN.md -- Domain page with 3-card grid, free subdomain, DNS verification, Domainr search, AI suggestions
- [ ] 14-03-PLAN.md -- Logo upload with Gemini Vision green-screen background removal and approval flow
- [ ] 14-04-PLAN.md -- Support page with $49 agent payment, webhook differentiation, floating help button

### Phase 15: Admin Fulfillment
**Goal**: The operator can see all purchased clients, view and process their change requests, and redeploy updated sites -- completing the client-to-admin feedback loop
**Depends on**: Phase 14
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Success Criteria** (what must be TRUE):
  1. The admin dashboard has a "Clients" view listing all purchased clients with business name, client name/email, plan, purchase date, status badge, and open request count -- sortable and filterable
  2. Clicking a client in the list opens the editor with a "Customer Requests" tab in the sidebar showing all `client_requests` for that project with type, content preview, status badge, and timestamp
  3. The admin can transition a request through pending -> in_progress -> completed from the Customer Requests tab, and each transition updates the timestamp
  4. The admin can click a "Redeploy" button that saves updated generated_code, increments the project version, creates a revision record in project_revisions, and marks relevant in-progress requests as completed
**Plans**: TBD

Plans:
- [ ] 15-01: Purchased clients list view with filters and request count badges
- [ ] 15-02: Customer Requests tab in editor sidebar with status transitions
- [ ] 15-03: Redeploy button (code save, version bump, revision record, request completion)

## Progress

**Execution Order:**
Phases execute in numeric order: 11 -> 12 -> 13 -> 14 -> 15

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
| 14. Portal Features | 4/4 | Complete    | 2026-03-25 | - |
| 15. Admin Fulfillment | v3.0 | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-18*
*Last updated: 2026-03-25 -- Phase 14 plans finalized (4 plans, 2 waves)*
