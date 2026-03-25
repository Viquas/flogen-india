---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Client Portal & Updated Funnel
status: complete
last_updated: "2026-03-25T01:36:10.000Z"
progress:
  total_phases: 15
  completed_phases: 15
  total_plans: 42
  completed_plans: 42
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Maximize the number of high-quality websites generated per hour with minimal manual intervention, and convert generated websites into paying clients through a seamless claim-to-payment flow.
**Current focus:** Phase 15 - Admin Fulfillment

## Current Position

Phase: 15 of 15 (Admin Fulfillment)
Plan: 2 of 2 in current phase (15-02 complete)
Status: Complete
Last activity: 2026-03-25 -- Completed 15-02 (editor fulfillment integration)

Progress: [**********] 100%

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 15
- Phases: 5/5 complete

**v2.0 Summary:**
- Total plans completed: 14
- Phases: 5/5 complete (phases 6-10)

**v3.0:**
- Total plans completed: 9
- Phases: 5/5 complete (phases 11-15)

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 11-01 | 2min | 2 | 4 |
| Phase 11 P02 | 2min | 3 tasks | 4 files |
| 12-01 | 7min | 2 | 11 |
| Phase 12 P02 | 3min | 2 tasks | 5 files |
| 12-03 | 3min | 2 | 4 |
| 13-01 | 3min | 2 | 8 |
| 13-02 | 4min | 2 | 11 |
| 14-01 | 4min | 2 | 5 |
| 14-02 | 5min | 2 | 9 |
| 14-03 | 6min | 2 | 8 |
| 14-04 | 4min | 2 | 6 |
| 15-01 | 4min | 2 | 6 |
| 15-02 | 6min | 2 | 6 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Relevant to current work:

- [11-01]: CHECK constraints over CREATE TYPE for enum values -- easier migration, no type dependency
- [11-01]: No CASCADE on claims.auth_user_id FK -- claim records survive auth user deletion
- [11-01]: RLS SELECT + INSERT only on client_requests -- admin uses service role bypass
- [11-02]: getUser() over getClaims() in proxy -- matches existing server.ts pattern, validates with auth server
- [11-02]: Strict whitelist matcher with only /portal/:path* and /auth/callback -- no catch-all
- [11-02]: Auth callback always redirects to /portal -- no redirect-back logic per locked decision
- [v3.0]: USD-only pricing ($499/$1,299) -- simplify payment flow
- [v3.0]: Payment-first (no pre-payment forms, contact from Razorpay webhook)
- [v3.0]: Supabase Auth for client portal (native to stack, RLS capable)
- [v3.0]: Gemini Vision for logo bg removal (green screen approach, remove.bg fallback)
- [v3.0]: Domainr API for domain availability (deprecated but functional, monitor)
- [v3.0]: Single textarea for change requests (admin interprets and executes)
- [v3.0]: Email notifications deferred to v4.0 (Instantly AI later)
- [v3.0]: proxy.ts whitelist matcher -- ONLY /portal/* and /auth/callback
- [12-01]: RAZORPAY_MODE env var defaults to 'test' with separate test/live key pairs
- [12-01]: Webhook throws on claim-not-found, returns 500 for Razorpay retries
- [12-01]: Dual verify endpoint: DB-first check, Razorpay API fallback, idempotent update
- [12-01]: client_name from payment.notes.name with email prefix fallback (no auth account creation)
- [12-02]: Inline card for confirmation step (not dialog/modal) -- simpler, no portal complexity
- [12-02]: Cal.com CDN embed via next/script lazyOnload -- npm package has React 19 peer dep conflict
- [12-02]: Two-click plan selection: first click selects, second click opens confirmation
- [12-02]: Mode-aware public key: NEXT_PUBLIC_RAZORPAY_MODE selects test/live key ID on client
- [12-03]: Duplicate user detection via createUser-then-catch (not listUsers) for O(1) performance
- [12-03]: Auto-login failure is non-fatal -- user created, manual login is fallback
- [12-03]: Timeline "Up next" step is "Set Up Your Account" (not Customization)
- [13-01]: (auth) route group for layout boundary -- separates public portal pages from auth-guarded dashboard
- [13-01]: isPublicPortalPage array in proxy.ts -- extensible pattern replacing single isLoginPage boolean
- [13-01]: Authenticated users NOT redirected from /portal/reset -- needed for password update after email callback
- [13-02]: (dashboard) route group separates auth-guarded pages from (auth) public pages
- [13-02]: Layout fetches claim/project for chrome only; page re-fetches for content (simpler than context provider)
- [13-02]: Preview URL uses /preview/{project.id} until Phase 14 subdomain provisioning
- [14-01]: FormData (not JSON) for POST /api/portal/requests to support file uploads alongside text
- [14-01]: Magic bytes validation includes PDF (0x25504446) in addition to images
- [14-01]: Admin client for storage uploads to bypass RLS/CORS
- [14-01]: Optimistic UI prepend on submit rather than refetch
- [14-02]: Google DoH JSON API for DNS verification (serverless-compatible, no system dig)
- [14-02]: Single domain-client.tsx with view state machine (grid/subdomain/connect/buy) rather than separate routes
- [14-02]: 6 registrar instruction sets: GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger, Other
- [14-02]: Verification token format: flogen-verify-{first8CharsOfClaimId} -- deterministic, no DB storage
- [14-03]: mediaType (not mimeType) for AI SDK ImagePart -- matches current @ai-sdk/provider-utils type definition
- [14-03]: Extended existing POST /api/portal/requests with optional type+metadata instead of separate logo save endpoint
- [14-03]: Transparent PNGs auto-save without bg removal prompt -- detected via IHDR byte 25 color type
- [14-03]: gemini-2.0-flash-exp model for bg removal -- green-screen approach with sharp pixel replacement
- [14-04]: Webhook early return pattern: check payment.notes.type before claim lookup to avoid unnecessary DB queries for agent payments
- [14-04]: Floating button uses usePathname() to self-hide on /portal/support rather than conditional rendering in layout
- [15-01]: Derived fulfillment status from request states (pending_customization/in_progress/delivered) -- not from claim status
- [15-01]: Separate client_requests query for count aggregation -- Supabase PostgREST count limitation
- [15-01]: Requests grouped by status on detail page: In Progress first, Pending second, Completed collapsed
- [15-02]: checkPurchaseStatus as reusable callback -- avoids duplicating claim check across cache-hit, fresh-load, and sidebar-select paths
- [15-02]: Optimistic UI for request status transitions with server-action revert on failure
- [15-02]: Left panel tab switcher only rendered for purchased projects -- zero visual change for normal editor workflow

### Pending Todos

None yet.

### Blockers/Concerns

- Supabase Auth needs to be configured in Supabase dashboard (new dependency)
- Domainr/RapidAPI key needed for domain availability checking
- Razorpay test mode keys needed (RAZORPAY_TEST_KEY_ID, RAZORPAY_TEST_KEY_SECRET)
- RESOLVED: Next.js 16 proxy.ts uses `export async function proxy` (verified and implemented)
- Gemini bg removal quality unknown on real logos -- prototype early in Phase 14

## Session Continuity

Last session: 2026-03-25
Stopped at: Completed 15-02-PLAN.md (editor fulfillment integration) -- ALL PLANS COMPLETE
Resume file: None
