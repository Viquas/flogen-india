# Requirements: Flogen

**Defined:** 2026-03-18
**Core Value:** Maximize the number of high-quality websites generated per hour with minimal manual intervention, and convert generated websites into paying clients through a seamless claim-to-payment flow.

## v1.0 Requirements (Complete)

<!-- All v1.0 requirements shipped 2026-03-18. See MILESTONES.md for details. -->

### Foundation Fixes

- [x] **FIX-01**: Auto-fix returns the latest fix attempt (not original broken code) when both attempts fail, and sets status to 'error'
- [x] **FIX-02**: Queue processing uses database-level uniqueness constraint to prevent duplicate job claims
- [x] **FIX-03**: Background generation tasks use proper error tracking instead of fire-and-forget Promise chains
- [x] **FIX-04**: System prompt extracted from generator.ts into a separate versioned file
- [x] **FIX-05**: Generator module decomposed into focused modules (prompts, validation, cost tracking, error classification)
- [x] **FIX-06**: Debug .txt files removed from codebase and added to .gitignore

### Cost & Token Tracking

- [x] **COST-01**: Every AI generation logs input tokens, output tokens, model used, and estimated cost to a persistent table
- [x] **COST-02**: Cost estimation uses a configurable pricing table (not hardcoded) that can be updated when provider prices change
- [x] **COST-03**: Dashboard stats cards show running total spend for the current month
- [x] **COST-04**: Cost records include all AI calls (generation, enrichment, auto-fix retries), not just primary generation

### Error Classification

- [x] **ERR-01**: Error taxonomy defined with categories: syntax error, render error, missing sections, style issues, data mapping failure, timeout
- [x] **ERR-02**: Errors automatically classified using Babel validation output and preview error signals
- [x] **ERR-03**: Each error category has a targeted fix prompt (not one generic fix-all prompt)
- [x] **ERR-04**: Error classification stored on project record (error_type, error_details columns)

### Prompt Versioning

- [x] **PROMPT-01**: System prompt lives in a versioned, loadable format outside of generator.ts
- [x] **PROMPT-02**: Every generation records which prompt version was used
- [x] **PROMPT-03**: User can switch which prompt version to use for the next generation
- [x] **PROMPT-04**: Prompt versions stored in database with creation date and change notes

### Queue Health UI

- [x] **QUEUE-01**: Admin page shows count of queued, processing, completed, and failed jobs in real-time
- [x] **QUEUE-02**: Stuck jobs (processing > 10 min) are visually highlighted with warning indicator
- [x] **QUEUE-03**: One-click retry and cancel buttons for failed/stuck jobs
- [x] **QUEUE-04**: Job detail view shows error message, attempt count, and timestamps

### Quality Scoring

- [x] **QUAL-01**: Generated code evaluated for render success (renders without errors in preview)
- [x] **QUAL-02**: Generated code evaluated for section completeness (hero, about, services, contact, footer)
- [x] **QUAL-03**: Sub-scores aggregated into a 0-100 quality score stored on the project record
- [x] **QUAL-04**: Projects sortable by quality score in dashboard to prioritize review

### Few-Shot Template Seeding

- [x] **TMPL-01**: Templates tagged with industry/vertical metadata
- [x] **TMPL-02**: When generating for industry X, 1-2 approved examples from industry X are automatically injected as few-shot context
- [x] **TMPL-03**: Example selection picks highest-quality approved templates (by quality score or recency)
- [x] **TMPL-04**: Template content sanitized (business-specific data replaced with placeholders) before injection

### Analytics Dashboard

- [x] **ANAL-v1-01**: Dashboard page shows generation success/failure rate grouped by day/week
- [x] **ANAL-v1-02**: Average generation time displayed with p50/p95 latency breakdown
- [x] **ANAL-v1-03**: Metrics filterable by AI model and business industry
- [x] **ANAL-v1-04**: Cost summary showing total spend, cost per successful generation, cost per model

### Batch Autopilot

- [x] **AUTO-01**: One-button pipeline chains discover -> enqueue -> generate -> validate -> auto-fix -> report
- [x] **AUTO-02**: Failed projects surfaced with error context and classification after pipeline completes
- [x] **AUTO-03**: Real-time batch progress visible (X of Y complete, Z failed)
- [x] **AUTO-04**: Pipeline resumes from where it left off after interruption (idempotent resume)

### Keyboard Shortcuts

- [x] **KEY-01**: j/k keys navigate between projects in dashboard grid
- [x] **KEY-02**: a/r/f/e keys approve, regenerate, fix, and open editor for focused project
- [x] **KEY-03**: Visual focus indicator (highlighted border) shows currently selected project
- [x] **KEY-04**: ? key shows help overlay listing all available shortcuts

### Diff View

- [x] **DIFF-01**: Side-by-side code diff view using Monaco diff editor for any two revisions
- [x] **DIFF-02**: Revision history list shows all revisions with timestamps, selectable for comparison
- [x] **DIFF-03**: Visual preview diff shows before/after rendered preview side-by-side in iframes

### Static Export

- [x] **EXP-01**: Generated React component exportable as self-contained static HTML with inlined Tailwind CSS
- [x] **EXP-02**: Exported HTML bundles fonts, icons, and images (no external dependencies)
- [x] **EXP-03**: One-click download button in editor exports as .html or .zip file

### Preview Pre-Rendering

- [x] **PRE-01**: Next 3-5 project records and generated code prefetched in background during review
- [x] **PRE-02**: Prefetch cache evicts old entries when user navigates past them
- [x] **PRE-03**: Navigating to a prefetched project displays instantly from cache

## v2.0 Requirements

Requirements for the client claim flow. Each maps to roadmap phases 6-10.

### Infrastructure

- [x] **INFRA-01**: New Supabase tables: `claims` and `customizations` with proper foreign keys to existing `projects` table
- [x] **INFRA-02**: Supabase Storage buckets: `site-screenshots` and `claim-uploads` with appropriate access policies
- [x] **INFRA-03**: Route group restructuring: `(admin)/` for dashboard/editor, `(client)/` for claim flow pages
- [x] **INFRA-04**: Screenshot generation for site previews (generated during site creation, stored in Supabase Storage)
- [x] **INFRA-05**: Geo-detection utility using Vercel's `x-vercel-ip-country` header with USD fallback

### CTA Injection

- [x] **CTA-01**: Every generated website displays a sticky bottom bar with "This website was made for {Business Name}" and a "Claim This Website" button linking to `/claim/{site_slug}`
- [x] **CTA-02**: CTA bar shows "X days left to claim" countdown based on server-side `expires_at` timestamp (5-day window)
- [x] **CTA-03**: CTA bar is style-isolated (inline styles, unique IDs) so it never conflicts with generated site styles
- [x] **CTA-04**: When a site's claim period has expired, the CTA bar shows "This offer has expired" with a "Request a new website" link

### Claim Landing Page

- [x] **CLAIM-01**: Claim page at `/claim/{site_slug}` displays a full-width preview (screenshot) of the generated website with business name
- [ ] **CLAIM-02**: Countdown timer shows days/hours/minutes/seconds until claim expiry, reading from server-provided `expires_at`
- [x] **CLAIM-03**: "What's Included" section displays 8 feature items in a responsive grid with icons
- [ ] **CLAIM-04**: Pricing section shows Standard (₹4,999 / $499) and Pro (₹9,999 / $1,299) plans side-by-side with Pro highlighted as recommended
- [ ] **CLAIM-05**: Geo-detection auto-selects INR or USD pricing on page load, with manual currency switch option
- [ ] **CLAIM-06**: After plan selection, domain options appear: connect existing domain, buy new domain (with availability search), or use free subdomain
- [x] **CLAIM-07**: Trust section with "Trusted by X businesses" count, testimonials (hideable if empty), and FAQ accordion
- [ ] **CLAIM-08**: Final CTA summarizes selections (plan + domain + price) and triggers Razorpay checkout
- [x] **CLAIM-09**: Page is server-side rendered, mobile-first, loads under 2.5s, with OG meta tags for WhatsApp/email sharing
- [x] **CLAIM-10**: Expired claims show "This offer has expired" with a "Request a new website" form (name + email + phone)

### Payment

- [ ] **PAY-01**: Razorpay order creation via server action with plan price + optional domain purchase price (amounts stored as integer paise)
- [ ] **PAY-02**: Razorpay inline checkout modal opens on the claim page with business info prefilled
- [ ] **PAY-03**: Razorpay webhook at `/api/webhooks/razorpay` verifies HMAC-SHA256 signature using raw request body (`request.text()`)
- [ ] **PAY-04**: Webhook processing is idempotent (deduplication via `x-razorpay-event-id`, claim status guards)
- [ ] **PAY-05**: On successful payment, claim record updates to `payment_status = 'completed'` and user redirects to customization form
- [ ] **PAY-06**: Failed/cancelled payments redirect back to claim page with subtle error banner and allow re-attempt
- [ ] **PAY-07**: Confirmation page polls for payment status (handles webhook-before-redirect race condition)

### Customization Form

- [ ] **CUST-01**: Customization form at `/claim/{site_slug}/customize` is only accessible after verified payment (server-side check)
- [ ] **CUST-02**: Logo upload (required) via Supabase Storage with drag-and-drop, thumbnail preview, 5MB max, PNG/JPG/SVG
- [ ] **CUST-03**: Brand color pickers (optional, default "keep current colors") with primary and secondary hex inputs
- [ ] **CUST-04**: Contact info pre-filled from Google Maps data (phone, email, address, hours, WhatsApp) -- editable
- [ ] **CUST-05**: Text changes textarea (1000 char limit) for headline/content modification requests
- [ ] **CUST-06**: Multi-photo upload (optional, max 10 photos, 5MB each) via Supabase Storage with thumbnails and remove button
- [ ] **CUST-07**: Booking system setup section visible only for Pro plan (service types, available days/hours, buffer time)
- [ ] **CUST-08**: On submit, creates customization record, updates site status to 'customizing', sends admin notification
- [ ] **CUST-09**: Progress indicator shows Step 1 (Payment) -> Step 2 (Customize - current) -> Step 3 (Go Live)

### Upsell

- [ ] **UPSELL-01**: After customization submission, strategy call upsell appears (free for Pro, 1,999 INR / $49 for Standard)
- [ ] **UPSELL-02**: Cal.com embed (iframe) for scheduling with available slots
- [ ] **UPSELL-03**: "No thanks, continue to confirmation" skip link is clearly visible and easy to find
- [ ] **UPSELL-04**: Standard plan call fee collected via Razorpay payment link before showing calendar

### Confirmation

- [ ] **CONF-01**: Confirmation page at `/claim/{site_slug}/confirmed` shows vertical timeline (payment, customization, updating, preview email, go live)
- [ ] **CONF-02**: "What to do in the meantime" section with actionable next steps
- [ ] **CONF-03**: Support contact section with WhatsApp link and email

### Analytics

- [ ] **ANAL-01**: Track all funnel events (preview view, claim page view, CTA click, plan selected, payment initiated, payment completed, customization submitted)
- [ ] **ANAL-02**: `claim_events` table stores events with timestamp, IP, user agent, site_slug
- [ ] **ANAL-03**: Admin dashboard shows conversion funnel visualization with drop-off rates

## Future Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Email Notifications

- **EMAIL-01**: Payment receipt email sent to client after successful payment
- **EMAIL-02**: Confirmation email with timeline and next steps
- **EMAIL-03**: Abandoned payment recovery email (sent 24h after incomplete checkout)

### Domain Registration

- **DOMAIN-01**: Automated domain registration via registrar API (GoDaddy/Namecheap)
- **DOMAIN-02**: Automated DNS configuration for purchased domains

### Automated Deployment

- **DEPLOY-01**: One-click deploy of finalized sites to hosting
- **DEPLOY-02**: SSL certificate provisioning for custom domains

### Autopilot Enhancements

- **AUTO-05**: Configurable pipeline stages (skip enrichment, add manual review gate)
- **AUTO-06**: Scheduled/cron-based autopilot runs
- **AUTO-07**: Smart batching by industry for LLM warm-up

### Quality Enhancements

- **QUAL-05**: Visual regression scoring via headless browser screenshots
- **QUAL-06**: Responsiveness check at 3 viewport widths

## Out of Scope

| Feature | Reason |
|---------|--------|
| Stripe payments | Razorpay handles all markets (INR primary, USD secondary) |
| Multi-user admin auth | Single operator, internal admin tool |
| Client self-edit portal | Operator handles all customizations manually |
| Real-time chat support | WhatsApp + email support is sufficient |
| Automated domain registration | Manual DNS instructions for now, defer API integration |
| Automated site deployment | Manual deployment after customization, defer automation |
| Email sending (receipts, reminders) | No email service in stack yet, defer to future milestone |
| CMS for client content management | Static sites, operator-managed |
| Mobile admin app | Desktop browser workflow for admin |

## Traceability

### v1.0 (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 through FIX-06 | Phase 1 | Complete |
| COST-01 through COST-04 | Phase 2 | Complete |
| ERR-01 through ERR-04 | Phase 2 | Complete |
| PROMPT-01 through PROMPT-04 | Phase 2 | Complete |
| QUEUE-01 through QUEUE-04 | Phase 2 | Complete |
| QUAL-01 through QUAL-04 | Phase 3 | Complete |
| TMPL-01 through TMPL-04 | Phase 3 | Complete |
| ANAL-v1-01 through ANAL-v1-04 | Phase 3 | Complete |
| AUTO-01 through AUTO-04 | Phase 4 | Complete |
| KEY-01 through KEY-04 | Phase 5 | Complete |
| DIFF-01 through DIFF-03 | Phase 5 | Complete |
| EXP-01 through EXP-03 | Phase 5 | Complete |
| PRE-01 through PRE-03 | Phase 5 | Complete |

### v2.0 (Pending)

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 6 | Complete |
| INFRA-02 | Phase 6 | Complete |
| INFRA-03 | Phase 6 | Complete |
| INFRA-04 | Phase 6 | Complete |
| INFRA-05 | Phase 6 | Complete |
| CTA-01 | Phase 6 | Complete |
| CTA-02 | Phase 6 | Complete |
| CTA-03 | Phase 6 | Complete |
| CTA-04 | Phase 6 | Complete |
| CLAIM-01 | Phase 7 | Complete |
| CLAIM-02 | Phase 7 | Pending |
| CLAIM-03 | Phase 7 | Complete |
| CLAIM-04 | Phase 7 | Pending |
| CLAIM-05 | Phase 7 | Pending |
| CLAIM-06 | Phase 7 | Pending |
| CLAIM-07 | Phase 7 | Complete |
| CLAIM-08 | Phase 7 | Pending |
| CLAIM-09 | Phase 7 | Complete |
| CLAIM-10 | Phase 7 | Complete |
| PAY-01 | Phase 8 | Pending |
| PAY-02 | Phase 8 | Pending |
| PAY-03 | Phase 8 | Pending |
| PAY-04 | Phase 8 | Pending |
| PAY-05 | Phase 8 | Pending |
| PAY-06 | Phase 8 | Pending |
| PAY-07 | Phase 8 | Pending |
| CONF-01 | Phase 8 | Pending |
| CONF-02 | Phase 8 | Pending |
| CONF-03 | Phase 8 | Pending |
| CUST-01 | Phase 9 | Pending |
| CUST-02 | Phase 9 | Pending |
| CUST-03 | Phase 9 | Pending |
| CUST-04 | Phase 9 | Pending |
| CUST-05 | Phase 9 | Pending |
| CUST-06 | Phase 9 | Pending |
| CUST-07 | Phase 9 | Pending |
| CUST-08 | Phase 9 | Pending |
| CUST-09 | Phase 9 | Pending |
| UPSELL-01 | Phase 9 | Pending |
| UPSELL-02 | Phase 9 | Pending |
| UPSELL-03 | Phase 9 | Pending |
| UPSELL-04 | Phase 9 | Pending |
| ANAL-01 | Phase 10 | Pending |
| ANAL-02 | Phase 10 | Pending |
| ANAL-03 | Phase 10 | Pending |

**Coverage:**
- v1.0 requirements: 51 total -- 51 complete
- v2.0 requirements: 45 total
- Mapped to phases: 45/45
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 -- v2.0 phase mappings assigned*
