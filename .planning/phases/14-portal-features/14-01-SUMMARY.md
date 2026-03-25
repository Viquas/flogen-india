---
phase: 14-portal-features
plan: 01
subsystem: ui, api
tags: [portal, supabase, file-upload, formdata, drag-and-drop, react, sonner]

# Dependency graph
requires:
  - phase: 13-portal-shell
    provides: "Portal dashboard layout, nav, auth guard pattern"
  - phase: 11-portal-schema
    provides: "client_requests table, claims table with auth_user_id"
provides:
  - "POST /api/portal/requests -- create text_change requests with file attachments"
  - "GET /api/portal/requests -- list auth-scoped requests"
  - "/portal/customize page with request form and expandable history"
  - "RequestCard component for expandable request display"
  - "All portal nav items enabled (Dashboard, Domain, Customize, Support)"
affects: [14-portal-features, portal-admin]

# Tech tracking
tech-stack:
  added: []
  patterns: [FormData multipart upload with magic byte validation, optimistic UI with sonner toasts, expandable card with CSS max-height transition]

key-files:
  created:
    - app/api/portal/requests/route.ts
    - app/(portal)/portal/(dashboard)/customize/page.tsx
    - app/(portal)/portal/(dashboard)/customize/customize-client.tsx
    - components/portal/request-card.tsx
  modified:
    - components/portal/portal-nav.tsx

key-decisions:
  - "FormData (not JSON) for POST to support file uploads alongside text"
  - "Magic bytes validation includes PDF (0x25504446) in addition to images"
  - "Admin client for storage uploads to bypass RLS/CORS"
  - "Optimistic UI prepend on submit rather than refetch"

patterns-established:
  - "Portal API auth pattern: createClient().getUser() for auth, createAdminClient() for data queries"
  - "Portal page pattern: server component fetches + maps data, client component handles interactivity"
  - "File upload pattern: magic bytes validation + Supabase Storage at claim-uploads/{claimId}/requests/"

requirements-completed: [PORTAL-04, PORTAL-05, LOGO-04]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 14 Plan 01: Customize Page Summary

**Change request form with drag-and-drop file upload, magic-byte validation, and expandable request history at /portal/customize**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T00:34:54Z
- **Completed:** 2026-03-25T00:39:03Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- POST/GET API for client_requests with FormData multipart support and magic-byte file validation (PNG, JPG, WebP, PDF)
- Customize page with textarea (10-2000 chars), drag-and-drop file zone, inline validation, and submit with optimistic UI
- Expandable RequestCard component with type badges, relative time, status badges (pending/in_progress/completed), and file previews
- All four portal nav items enabled (Dashboard, Domain, Customize, Support)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create requests API route and enable nav items** - `f63bedd` (feat)
2. **Task 2: Create customize page with request form and expandable history** - `41f804d` (feat)

## Files Created/Modified
- `app/api/portal/requests/route.ts` - POST create + GET list requests API with file upload to Supabase Storage
- `app/(portal)/portal/(dashboard)/customize/page.tsx` - Server component with auth guard and data fetching
- `app/(portal)/portal/(dashboard)/customize/customize-client.tsx` - Client component with form, drag-and-drop, file chips, and request history
- `components/portal/request-card.tsx` - Expandable card with status badges, relative time, file previews
- `components/portal/portal-nav.tsx` - Enabled Domain, Customize, Support nav items

## Decisions Made
- Used FormData (not JSON) for POST to support file uploads alongside text description
- Added PDF magic bytes (0x25504446) validation alongside image types
- Used admin client for storage uploads to bypass RLS/CORS restrictions
- Optimistic UI: prepend new request to list on submit rather than refetching
- Content typed as `{ description: string; file_urls?: string[] }` cast from Json at server component boundary

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Json-to-RequestContent type mismatch**
- **Found during:** Task 2 (customize page)
- **Issue:** Supabase `content: Json` type not assignable to `RequestContent` interface (Json includes null)
- **Fix:** Cast content at server component boundary with fallback, select specific columns instead of `*`
- **Files modified:** app/(portal)/portal/(dashboard)/customize/page.tsx
- **Verification:** `npx tsc --noEmit` shows zero new errors in portal code
- **Committed in:** 41f804d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type safety fix required for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Customize page ready for Plan 03 (logo upload section can be added above the request form)
- Request history component supports all request types, currently filtered to text_change
- Portal nav fully enabled for Domain and Support pages (built in other plans)

## Self-Check: PASSED

All 5 created/modified files verified on disk. Both task commits (f63bedd, 41f804d) verified in git log.

---
*Phase: 14-portal-features*
*Completed: 2026-03-25*
