---
phase: 13-portal-shell
plan: 01
subsystem: auth
tags: [supabase-auth, login, password-reset, pkce, ssr-cookies, next-font]

# Dependency graph
requires:
  - phase: 11-portal-infra
    provides: proxy.ts auth redirect logic, auth callback route, Supabase server client
  - phase: 12-payment-first
    provides: confirmed-actions.ts SSR cookie bridge login pattern
provides:
  - Portal login page at /portal/login with split layout
  - Password reset page at /portal/reset with PKCE callback handling
  - Server actions for signInWithPassword and resetPasswordForEmail
  - Updated proxy.ts with isPublicPortalPage array pattern
affects: [13-02-portal-dashboard, 14-customization]

# Tech tracking
tech-stack:
  added: []
  patterns: [portal-auth-layout-route-group, isPublicPortalPage-array-pattern, ssr-cookie-bridge-login]

key-files:
  created:
    - app/(portal)/portal/(auth)/layout.tsx
    - app/(portal)/portal/(auth)/login/page.tsx
    - app/(portal)/portal/(auth)/login/login-form.tsx
    - app/(portal)/portal/(auth)/login/login-actions.ts
    - app/(portal)/portal/(auth)/reset/page.tsx
    - app/(portal)/portal/(auth)/reset/reset-form.tsx
    - app/(portal)/portal/(auth)/reset/reset-actions.ts
  modified:
    - lib/supabase/proxy.ts

key-decisions:
  - "(auth) route group for layout boundary without auth checks -- separates public portal pages from dashboard"
  - "isPublicPortalPage array pattern in proxy.ts -- extensible for future public portal pages"
  - "Authenticated users NOT redirected from /portal/reset -- needed for password update after email callback"

patterns-established:
  - "Portal auth layout: (auth) route group wraps login/reset with fonts but no auth guard"
  - "isPublicPortalPage: array-based check in proxy.ts replaces single isLoginPage boolean"
  - "SSR cookie bridge: createServerClient with cookieStore for server action auth calls"

requirements-completed: [AUTH-04]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 13 Plan 01: Portal Login & Password Reset Summary

**Split-layout login page with SSR cookie bridge auth and PKCE-based password reset flow at /portal/login and /portal/reset**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T23:11:28Z
- **Completed:** 2026-03-24T23:14:54Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Login page with split layout (brand panel left, form right on desktop, stacked on mobile) using warm cream aesthetic
- Password reset flow: forgot password sends Supabase email -> auth callback exchanges PKCE code -> user sets new password on /portal/reset
- Server actions using proven SSR cookie bridge pattern from confirmed-actions.ts
- proxy.ts updated with isPublicPortalPage array to exclude both /portal/login and /portal/reset from auth redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Create login page with split layout and server actions** - `8caaf1a` (feat)
2. **Task 2: Create password reset page and update proxy.ts** - `223bd58` (feat)

## Files Created/Modified
- `app/(portal)/portal/(auth)/layout.tsx` - Auth layout with Inter + Signifier fonts, no auth check
- `app/(portal)/portal/(auth)/login/page.tsx` - Split-layout login page with brand panel and form
- `app/(portal)/portal/(auth)/login/login-form.tsx` - Client form with login/reset modes, show/hide password
- `app/(portal)/portal/(auth)/login/login-actions.ts` - loginWithPassword and sendPasswordReset server actions
- `app/(portal)/portal/(auth)/reset/page.tsx` - Centered reset page with logo and back-to-login link
- `app/(portal)/portal/(auth)/reset/reset-form.tsx` - Password + confirm form with client-side match validation
- `app/(portal)/portal/(auth)/reset/reset-actions.ts` - updatePassword server action via createClient session
- `lib/supabase/proxy.ts` - isPublicPortalPage array replaces isLoginPage, /portal/reset excluded from redirect

## Decisions Made
- Used (auth) route group as layout boundary to separate public portal pages from auth-guarded dashboard pages (Plan 02 will create separate (dashboard) layout)
- Changed proxy.ts from single `isLoginPage` boolean to `isPublicPortalPage` array -- more extensible for future public portal pages
- Authenticated users NOT redirected away from /portal/reset -- they need access to complete the password reset flow after the PKCE callback sets their session

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod error property name**
- **Found during:** Task 1 (login server actions)
- **Issue:** Used `parsed.error.errors[0]` but Zod uses `.issues` not `.errors`
- **Fix:** Changed to `parsed.error.issues[0].message`
- **Files modified:** `app/(portal)/portal/(auth)/login/login-actions.ts`
- **Verification:** TypeScript compilation passes with no portal-related errors
- **Committed in:** `8caaf1a` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial API name correction. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Uses existing Supabase Auth setup from Phase 11.

## Next Phase Readiness
- Login and reset pages ready for manual testing once dev server running
- Portal dashboard (Plan 02) can now create its own (dashboard) route group with auth guard layout
- Password reset flow depends on existing /auth/callback route (already built in Phase 11)
- NEXT_PUBLIC_SITE_URL env var needed for correct reset email redirect URL

## Self-Check: PASSED

All 8 created/modified files verified on disk. Both task commits (8caaf1a, 223bd58) verified in git log.

---
*Phase: 13-portal-shell*
*Completed: 2026-03-25*
