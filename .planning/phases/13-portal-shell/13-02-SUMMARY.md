---
phase: 13-portal-shell
plan: 02
subsystem: ui
tags: [portal-dashboard, supabase-auth, iframe-preview, clipboard-api, responsive-nav, sonner]

# Dependency graph
requires:
  - phase: 13-portal-shell
    provides: Portal login page, (auth) route group, proxy.ts public page exclusion
  - phase: 11-portal-infra
    provides: proxy.ts auth redirect, Supabase server/admin clients, auth callback route
  - phase: 12-payment-first
    provides: Account creation with auth_user_id backfill on claims
provides:
  - Auth-guarded portal dashboard at /portal with iframe preview
  - Portal layout shell with responsive nav and personalized header
  - URL card with copy-to-clipboard and Visit Site button
  - Plan badge (Standard/Pro) and status indicator (3 states)
  - Logout server action via profile dropdown
  - deriveSiteStatus utility for Active/Customization Pending/Update in Progress
affects: [14-customization, 15-domain]

# Tech tracking
tech-stack:
  added: []
  patterns: [dashboard-route-group-layout, iframe-srcDoc-preview, status-derivation-from-requests]

key-files:
  created:
    - app/(portal)/portal/(dashboard)/layout.tsx
    - app/(portal)/portal/(dashboard)/page.tsx
    - app/(portal)/portal/(dashboard)/dashboard-client.tsx
    - app/(portal)/portal/logout-action.ts
    - components/portal/portal-nav.tsx
    - components/portal/portal-header.tsx
    - components/portal/site-preview.tsx
    - components/portal/url-card.tsx
    - components/portal/plan-badge.tsx
    - components/portal/status-indicator.tsx
    - lib/portal/status.ts
  modified: []

key-decisions:
  - "(dashboard) route group separates auth-guarded pages from (auth) public pages -- layout handles auth + chrome, page handles data"
  - "Layout fetches claim/project for header/nav chrome only; page re-fetches for content (simpler than shared context provider)"
  - "Preview URL uses /preview/{project.id} until Phase 14 subdomain provisioning"

patterns-established:
  - "Portal dashboard layout: (dashboard) route group with auth guard, claim/project fetch, responsive chrome"
  - "Status derivation: deriveSiteStatus(pendingCount, inProgressCount) returns status + Tailwind color classes"
  - "Iframe srcDoc pattern: constructHtmlBoilerplate(generated_code) for portal preview (no CTA bar injection)"

requirements-completed: [PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-06]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 13 Plan 02: Portal Dashboard Summary

**Auth-guarded dashboard at /portal with iframe site preview, URL copy-to-clipboard, plan badge, status indicator, and responsive nav shell**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T23:17:59Z
- **Completed:** 2026-03-24T23:21:38Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Full portal dashboard showing client's generated site in iframe preview (50vh desktop, 40vh mobile)
- URL card with copy-to-clipboard (navigator.clipboard + sonner toast) and Visit Site button (new tab)
- Plan badge with Standard (gray) / Pro (purple) visual differentiation
- Status indicator with 3 states: Active (green), Customization Pending (blue), Update in Progress (amber)
- Responsive navigation: bottom tab bar on mobile, horizontal header on desktop, 3 disabled "coming soon" items
- Personalized header with "Welcome, {Business Name}" and profile dropdown with logout
- Auth guard in layout using getUser() + redirect to /portal/login

## Task Commits

Each task was committed atomically:

1. **Task 1: Create portal components and status utility** - `e62adec` (feat)
2. **Task 2: Create auth-guarded dashboard layout and page** - `32ce3fa` (feat)

## Files Created/Modified
- `lib/portal/status.ts` - deriveSiteStatus utility with 3 status states and Tailwind color mappings
- `components/portal/plan-badge.tsx` - Standard/Pro badge with visual differentiation
- `components/portal/status-indicator.tsx` - Colored dot + label pill component
- `components/portal/url-card.tsx` - URL display with clipboard copy and external link buttons
- `components/portal/site-preview.tsx` - Iframe wrapper with srcDoc, sandbox, and loading skeleton
- `components/portal/portal-nav.tsx` - Responsive bottom tabs (mobile) / horizontal bar (desktop)
- `components/portal/portal-header.tsx` - Welcome header with avatar dropdown and logout action
- `app/(portal)/portal/logout-action.ts` - Server action for signOut + redirect
- `app/(portal)/portal/(dashboard)/layout.tsx` - Auth-guarded layout with fonts, header, nav, toaster
- `app/(portal)/portal/(dashboard)/page.tsx` - Server component fetching claim/project/status data
- `app/(portal)/portal/(dashboard)/dashboard-client.tsx` - Client component with responsive grid layout

## Decisions Made
- Used (dashboard) route group to separate auth-guarded pages from public (auth) pages, matching the pattern established in Plan 01
- Layout fetches claim/project for header and nav chrome; page re-fetches independently for content data (simpler than shared React context, Next.js can deduplicate)
- Preview URL displays `/preview/{project.id}` for now -- Phase 14 will upgrade to subdomain URL
- Removed unused client_requests queries and deriveSiteStatus call from layout (only page needs status)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed dead code in layout**
- **Found during:** Task 2 (dashboard layout)
- **Issue:** Layout had client_requests queries and deriveSiteStatus call whose result was discarded (unused variable)
- **Fix:** Removed the unnecessary queries and import. Only the page component needs status data.
- **Files modified:** `app/(portal)/portal/(dashboard)/layout.tsx`
- **Verification:** TypeScript compilation passes, no unused imports
- **Committed in:** `32ce3fa` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 dead code removal)
**Impact on plan:** Trivial cleanup. No scope creep.

## Issues Encountered
None

## User Setup Required
None - uses existing Supabase Auth setup from Phase 11. NEXT_PUBLIC_SITE_URL env var needed for preview URL construction.

## Next Phase Readiness
- Portal shell complete with auth guard, navigation, and dashboard
- Phase 14 customization pages will live inside the (dashboard) route group, inheriting the layout
- Disabled nav items (Domain, Customize, Support) ready to be enabled as Phase 14-15 pages are built
- Status indicator will update automatically as client_requests are created via Phase 14 customization flow

## Self-Check: PASSED

All 11 created files verified on disk. Both task commits (e62adec, 32ce3fa) verified in git log.

---
*Phase: 13-portal-shell*
*Completed: 2026-03-25*
