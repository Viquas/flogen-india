# Requirements: Flogen

**Defined:** 2026-03-25
**Core Value:** Maximize the number of high-quality websites generated per hour with minimal manual intervention, and convert generated websites into paying clients through a seamless claim-to-payment flow.

## v3.0 Requirements

Requirements for Client Portal & Updated Funnel milestone. Each maps to roadmap phases.

### Payment-First Funnel

- [x] **FUNNEL-01**: Claim page removes all pre-payment forms — only interaction is plan selection and "Get Started" button
- [x] **FUNNEL-02**: Claim page removes domain selection section — domain management moves to portal post-payment
- [x] **FUNNEL-03**: Pricing switches to USD-only ($499 Standard, $1,299 Pro) — remove INR pricing, GST calculations, and geo-detection
- [x] **FUNNEL-04**: Razorpay test/live mode toggle via RAZORPAY_MODE env var with separate test/live key pairs
- [x] **FUNNEL-05**: Claim page shows "Test Mode" badge when RAZORPAY_MODE=test
- [x] **FUNNEL-06**: Premium plan card displays "Contact Us" CTA linking to WhatsApp/email (no payment flow)
- [x] **FUNNEL-07**: Analytics tracks premium_contact event when user clicks Premium "Contact Us"
- [x] **FUNNEL-08**: createRazorpayOrder() creates claim with only project_id, plan, amount — no contact info fields

### Authentication

- [x] **AUTH-01**: Supabase Auth account created server-side in webhook handler after payment.captured using auth.admin.createUser() with email from Razorpay payload
- [ ] **AUTH-02**: Confirmation page presents password field for first-time portal access — creates account linked to claim and project
- [x] **AUTH-03**: proxy.ts protects /portal/* routes with Supabase session validation — whitelist matcher to avoid breaking webhooks, admin, and public routes
- [x] **AUTH-04**: Portal login page with email + password for returning clients
- [x] **AUTH-05**: claims table gains auth_user_id column linking to Supabase Auth user
- [x] **AUTH-06**: Dual payment verification on confirmation page — webhook push + Razorpay API pull to handle race condition

### Client Portal

- [x] **PORTAL-01**: Authenticated portal dashboard at /portal with full-width iframe preview of client's live site
- [x] **PORTAL-02**: Live site URL display (subdomain or custom domain) with copy-to-clipboard button
- [x] **PORTAL-03**: Plan badge and site status indicator (Active, Customization Pending, Update in Progress)
- [ ] **PORTAL-04**: Change request submission via single textarea ("Tell us what you'd like to change") with optional file upload
- [ ] **PORTAL-05**: Request history showing all submitted requests with status badges (pending, in-progress, completed)
- [x] **PORTAL-06**: Mobile-responsive portal layout (works at 375px, mobile-first)
- [ ] **PORTAL-07**: $49 agent support payment via Razorpay — creates agent_call request in client_requests table

### Domain Management

- [ ] **DOMAIN-01**: Free subdomain auto-provisioned on payment ({business-slug}.flogen.com) — displayed immediately in portal
- [ ] **DOMAIN-02**: Connect existing domain flow — client enters domain, receives TXT record to add, portal polls DNS for verification
- [ ] **DOMAIN-03**: DNS verification status display (pending, verifying, verified, failed) with step-by-step text instructions
- [ ] **DOMAIN-04**: Domain availability search via Domainr API — client types desired domain, sees availability + external registrar links
- [ ] **DOMAIN-05**: AI domain suggestions — if desired domain unavailable, Gemini generates 15-20 alternatives, batch-checked against Domainr, only available domains shown
- [ ] **DOMAIN-06**: $49 agent domain setup payment — creates domain_setup request in client_requests table

### Logo & Customization

- [ ] **LOGO-01**: Logo upload in portal with drag-and-drop (PNG/JPEG, max 5MB)
- [ ] **LOGO-02**: AI background removal via Gemini Vision — detects non-transparent background, prompts user, processes with before/after preview
- [ ] **LOGO-03**: Client approves or reverts background removal result before saving
- [ ] **LOGO-04**: Cal.com booking setup field visible only for Pro plan — text input for embed slug stored in projects.cal_embed_slug

### Admin Fulfillment

- [ ] **ADMIN-01**: Purchased clients list view in admin dashboard — shows business name, client name/email, plan, purchase date, status badge, open request count
- [ ] **ADMIN-02**: Customer Requests tab in editor sidebar — lists all client_requests for a project with type, content, status, timestamp
- [ ] **ADMIN-03**: Request status transitions: admin toggles pending → in_progress → completed from Customer Requests tab
- [ ] **ADMIN-04**: Redeploy button — updates generated_code, increments version, saves revision to project_revisions, marks relevant requests as completed
- [ ] **ADMIN-05**: client_requests table with id, claim_id, project_id, auth_user_id, type enum, status enum, content JSONB, created_at, updated_at

### Schema Changes

- [x] **SCHEMA-01**: New client_requests table with RLS policies scoped to auth_user_id
- [x] **SCHEMA-02**: claims.auth_user_id column (nullable UUID, FK to auth.users)
- [x] **SCHEMA-03**: projects.cal_embed_slug column (nullable TEXT)

## v4.0 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Email & Notifications
- **NOTIF-01**: Email notification to client on redeploy (via Instantly AI)
- **NOTIF-02**: Admin notification on new customization request submission
- **NOTIF-03**: WhatsApp magic link delivery for portal access

### Advanced Portal
- **ADV-01**: Real-time site preview updates via Supabase subscription when admin redeploys
- **ADV-02**: Version history visible to client with change notes
- **ADV-03**: Site health monitoring and uptime status
- **ADV-04**: Multi-site dashboard for clients with multiple purchased sites

### Advanced Domain
- **ADVDOM-01**: Registrar-specific DNS instructions with deep links
- **ADVDOM-02**: PDF DNS setup guides per registrar

### Advanced Logo
- **ADVLOGO-01**: Manual logo crop and reposition tool
- **ADVLOGO-02**: Multi-logo support (horizontal, square, icon variants)

## Out of Scope

| Feature | Reason |
|---------|--------|
| INR pricing / multi-currency | USD-only for v3.0, simplifies testing surface |
| Email notifications | Deferred to v4.0 — will use Instantly AI |
| PDF DNS guides | Static text instructions instead — simpler to maintain |
| Social login (Google/GitHub) | Target users are business owners, not developers |
| Client-side code editor | Business owners can't edit code — textarea + admin fulfillment |
| Drag-and-drop page builder | Massive engineering effort for static HTML sites |
| Real-time chat with admin | WhatsApp handles real-time; change requests for async |
| In-app domain purchase | Clients buy externally, connect via DNS |
| Custom scheduling infrastructure | Cal.com handles all booking logic |
| Auto-deployment to custom domains | Manual DNS + hosting for now |
| RLS on existing tables | Application-level auth_user_id filtering — lower migration risk |
| Duplicate email handling | Edge case — handle manually if it arises |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FUNNEL-01 | Phase 12 | Complete |
| FUNNEL-02 | Phase 12 | Complete |
| FUNNEL-03 | Phase 12 | Complete |
| FUNNEL-04 | Phase 12 | Complete |
| FUNNEL-05 | Phase 12 | Complete |
| FUNNEL-06 | Phase 12 | Complete |
| FUNNEL-07 | Phase 12 | Complete |
| FUNNEL-08 | Phase 12 | Complete |
| AUTH-01 | Phase 12 | Complete |
| AUTH-02 | Phase 13 | Pending |
| AUTH-03 | Phase 11 | Complete |
| AUTH-04 | Phase 13 | Complete |
| AUTH-05 | Phase 11 | Complete |
| AUTH-06 | Phase 12 | Complete |
| PORTAL-01 | Phase 13 | Complete |
| PORTAL-02 | Phase 13 | Complete |
| PORTAL-03 | Phase 13 | Complete |
| PORTAL-04 | Phase 14 | Pending |
| PORTAL-05 | Phase 14 | Pending |
| PORTAL-06 | Phase 13 | Complete |
| PORTAL-07 | Phase 14 | Pending |
| DOMAIN-01 | Phase 14 | Pending |
| DOMAIN-02 | Phase 14 | Pending |
| DOMAIN-03 | Phase 14 | Pending |
| DOMAIN-04 | Phase 14 | Pending |
| DOMAIN-05 | Phase 14 | Pending |
| DOMAIN-06 | Phase 14 | Pending |
| LOGO-01 | Phase 14 | Pending |
| LOGO-02 | Phase 14 | Pending |
| LOGO-03 | Phase 14 | Pending |
| LOGO-04 | Phase 14 | Pending |
| ADMIN-01 | Phase 15 | Pending |
| ADMIN-02 | Phase 15 | Pending |
| ADMIN-03 | Phase 15 | Pending |
| ADMIN-04 | Phase 15 | Pending |
| ADMIN-05 | Phase 15 | Pending |
| SCHEMA-01 | Phase 11 | Complete |
| SCHEMA-02 | Phase 11 | Complete |
| SCHEMA-03 | Phase 11 | Complete |

**Coverage:**
- v3.0 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
