---
phase: 11-auth-infrastructure-schema
plan: 02
subsystem: auth
tags: [supabase-ssr, proxy, next16, session-management, cookie-bridge, pkce]

# Dependency graph
requires:
  - phase: none
    provides: existing @supabase/ssr and next.js 16 already installed
provides:
  - proxy.ts at project root with whitelist matcher for portal route protection
  - updateSession utility with Supabase cookie bridge and getUser() session refresh
  - createPortalClient() anon-key server client for identity verification
  - /auth/callback route handler for PKCE code exchange
affects: [13-portal-shell, 14-portal-features, 12-payment-razorpay]

# Tech tracking
tech-stack:
  added: []
  patterns: [proxy-whitelist-matcher, cookie-bridge-reassignment, two-client-pattern, pkce-code-exchange]

key-files:
  created:
    - proxy.ts
    - lib/supabase/proxy.ts
    - lib/supabase/portal.ts
    - app/auth/callback/route.ts
  modified: []

key-decisions:
  - "Used getUser() over getClaims() in proxy -- matches existing server.ts pattern, validates with auth server"
  - "Strict whitelist matcher with only /portal/:path* and /auth/callback -- no broad catch-all"
  - "Auth callback redirects to /portal on success, /portal/login on failure -- no redirect-back logic"

patterns-established:
  - "Proxy whitelist: only add routes to matcher config that need session handling"
  - "Cookie bridge reassignment: inside setAll, reassign response = NextResponse.next({ request }) then set cookies on new response"
  - "Two-client pattern: createPortalClient (anon) for identity, createAdminClient (service role) for data"

requirements-completed: [AUTH-03]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 11 Plan 02: Proxy & Auth Clients Summary

**Next.js 16 proxy.ts with Supabase session refresh, portal route protection via whitelist matcher, createPortalClient anon-key utility, and /auth/callback PKCE handler**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T21:25:56Z
- **Completed:** 2026-03-24T21:28:31Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments
- proxy.ts at project root with named `proxy` export and strict whitelist matcher targeting only /portal/:path* and /auth/callback
- updateSession utility with proper cookie bridge reassignment pattern, getUser() session validation, and redirect logic for unauthenticated portal requests
- createPortalClient() mirrors existing server.ts cookie bridge pattern with anon key for identity verification in portal server components
- /auth/callback route handler for Supabase PKCE code exchange (email confirmations, password reset links)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create proxy.ts and updateSession utility** - `dfee9aa` (feat)
2. **Task 2: Create portal client and auth callback route** - `3c92d4e` (feat)
3. **Task 3: Verify proxy does not break existing routes** - verification only, no commit

## Files Created/Modified
- `proxy.ts` - Next.js 16 proxy entry point with whitelist matcher for /portal/:path* and /auth/callback
- `lib/supabase/proxy.ts` - updateSession utility with cookie bridge, getUser() session refresh, portal redirect logic
- `lib/supabase/portal.ts` - createPortalClient() anon-key server client for identity verification in portal routes
- `app/auth/callback/route.ts` - GET handler for PKCE code exchange via exchangeCodeForSession, redirects to /portal

## Decisions Made
- Used `getUser()` over `getClaims()` in proxy -- matches existing server.ts pattern and validates tokens with auth server. Portal traffic is low-volume so the round-trip cost is acceptable.
- Strict whitelist matcher with only two patterns -- avoids breaking Razorpay webhook (reads request.text() for HMAC), admin routes, and public claim pages.
- Auth callback always redirects to /portal (no redirect-back logic) per locked decision -- portal is single-page, no deep links worth preserving.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Supabase Auth email provider must be enabled in Supabase dashboard (documented as prerequisite in 11-CONTEXT.md, not part of this plan).

## Next Phase Readiness
- Auth middleware layer complete -- all portal routes will be protected by proxy.ts
- createPortalClient() ready for use in portal server components and API routes (Phase 13)
- /auth/callback ready to handle email confirmation and password reset flows
- Two-client pattern established: portal client (anon) for identity, admin client (service role) for data queries

## Self-Check: PASSED

All 4 created files verified present. Both task commits (dfee9aa, 3c92d4e) verified in git log.

---
*Phase: 11-auth-infrastructure-schema*
*Completed: 2026-03-25*
