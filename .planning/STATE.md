---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Client Portal & Updated Funnel
status: in-progress
last_updated: "2026-03-25T22:16:04Z"
progress:
  total_phases: 15
  completed_phases: 11
  total_plans: 34
  completed_plans: 32
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Maximize the number of high-quality websites generated per hour with minimal manual intervention, and convert generated websites into paying clients through a seamless claim-to-payment flow.
**Current focus:** Phase 12 - Payment-First Claim Flow

## Current Position

Phase: 12 of 15 (Payment-First Claim Flow)
Plan: 1 of 3 in current phase (12-01 complete)
Status: Executing Phase 12 -- Plan 01 complete, Plans 02-03 remaining
Last activity: 2026-03-25 -- Completed 12-01 (payment backend hardening)

Progress: [***░░░░░░] 20%

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 15
- Phases: 5/5 complete

**v2.0 Summary:**
- Total plans completed: 14
- Phases: 5/5 complete (phases 6-10)

**v3.0:**
- Total plans completed: 3
- Phases: 1/5 complete (phases 11-15)

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 11-01 | 2min | 2 | 4 |
| Phase 11 P02 | 2min | 3 tasks | 4 files |
| 12-01 | 7min | 2 | 11 |

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
Stopped at: Completed 12-01-PLAN.md (payment backend hardening)
Resume file: None
