---
phase: 14-portal-features
plan: 03
subsystem: ui, api
tags: [gemini, sharp, logo-upload, bg-removal, green-screen, drag-and-drop, supabase-storage]

# Dependency graph
requires:
  - phase: 14-01
    provides: customize page with placeholder for logo upload, client_requests table, POST /api/portal/requests
provides:
  - Logo upload API with PNG/JPEG validation and alpha detection
  - Gemini green-screen background removal with sharp pixel processing
  - LogoUpload component with full state machine (idle/uploading/uploaded/removing/preview/saving/saved)
  - Auto agent_call fallback when Gemini bg removal fails
  - Extended POST /api/portal/requests with type and metadata fields
affects: [14-04, portal-support]

# Tech tracking
tech-stack:
  added: [sharp]
  patterns: [gemini-green-screen-bg-removal, png-alpha-detection, image-upload-state-machine]

key-files:
  created:
    - lib/portal/png-utils.ts
    - lib/portal/logo-bg-removal.ts
    - app/api/portal/logo/upload/route.ts
    - app/api/portal/logo/remove-bg/route.ts
    - components/portal/logo-upload.tsx
  modified:
    - app/(portal)/portal/(dashboard)/customize/customize-client.tsx
    - app/(portal)/portal/(dashboard)/customize/page.tsx
    - app/api/portal/requests/route.ts

key-decisions:
  - "mediaType (not mimeType) for AI SDK ImagePart -- matches current @ai-sdk/provider-utils type definition"
  - "gemini-2.0-flash-exp model for bg removal per plan spec -- different from research doc's gemini-3.1-flash-image-preview"
  - "Extended existing POST /api/portal/requests with optional type+metadata instead of creating separate logo save endpoint"
  - "Transparent PNGs auto-save without bg removal prompt -- detected via IHDR color type byte"

patterns-established:
  - "Gemini green-screen pattern: prompt #00FF00 background, sharp pixel replacement (g>180, r<120, b<120) to alpha"
  - "PNG alpha detection via byte offset 25 color type -- zero-dependency, no sharp needed"
  - "Image upload state machine: idle > uploading > uploaded > (removing > preview) > saving > saved"

requirements-completed: [LOGO-01, LOGO-02, LOGO-03]

# Metrics
duration: 6min
completed: 2026-03-25
---

# Phase 14 Plan 03: Logo Upload with AI Background Removal Summary

**Logo drag-and-drop upload with Gemini green-screen bg removal, sharp pixel processing, side-by-side preview, and auto agent fallback**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-25T00:43:25Z
- **Completed:** 2026-03-25T00:49:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Logo upload with drag-and-drop, PNG/JPEG magic bytes validation, 5MB limit, and Supabase storage
- Gemini green-screen background removal pipeline: resize to 2000px max, prompt green background, sharp pixel replacement to alpha
- Side-by-side before/after preview with checkerboard transparency background
- Transparent PNG detection skips bg removal entirely (IHDR byte 25 alpha check)
- Auto agent_call request creation when Gemini bg removal fails
- Inline $49 agent CTA in logo upload section per CONTEXT.md locked decision

## Task Commits

Each task was committed atomically:

1. **Task 1: Create logo utilities, API routes, and install sharp** - `bb2031e` (feat)
2. **Task 2: Create LogoUpload component and integrate into customize page** - `e74555f` (feat)

## Files Created/Modified
- `lib/portal/png-utils.ts` - Zero-dependency PNG alpha channel detection via IHDR color type
- `lib/portal/logo-bg-removal.ts` - Gemini green-screen + sharp pixel replacement pipeline
- `app/api/portal/logo/upload/route.ts` - Auth-scoped logo upload with magic bytes validation
- `app/api/portal/logo/remove-bg/route.ts` - Gemini bg removal endpoint with agent fallback (maxDuration=60)
- `components/portal/logo-upload.tsx` - Full state machine: drag-and-drop, upload, bg removal, preview, save
- `app/(portal)/portal/(dashboard)/customize/customize-client.tsx` - Integrated LogoUpload component, added new props
- `app/(portal)/portal/(dashboard)/customize/page.tsx` - Passes userId, projectId, existingLogoUrl to client
- `app/api/portal/requests/route.ts` - Extended POST with optional type and metadata fields

## Decisions Made
- Used `mediaType` property on AI SDK ImagePart (not `mimeType`) matching current type definitions
- Extended existing requests API with type+metadata rather than creating a separate logo save endpoint -- simpler, consistent
- PNG alpha detection is zero-dependency (byte-level check) -- no sharp needed for detection
- Transparent PNGs auto-save without prompting user about background removal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ImagePart mimeType to mediaType**
- **Found during:** Task 1 (logo-bg-removal.ts)
- **Issue:** Plan specified `mimeType` on ImagePart but current AI SDK uses `mediaType`
- **Fix:** Changed property name to `mediaType` matching @ai-sdk/provider-utils type definition
- **Files modified:** lib/portal/logo-bg-removal.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** bb2031e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor property name fix. No scope creep.

## Issues Encountered
None -- pre-existing TS errors in unrelated files (claim-pricing, editor, generator) did not affect this plan.

## User Setup Required
None - uses existing GOOGLE_GENERATIVE_AI_API_KEY and Supabase credentials.

## Next Phase Readiness
- Logo upload fully functional on /portal/customize
- Agent fallback creates agent_call requests for Phase 14-04 (support page) to display
- POST /api/portal/requests now supports all request types via type field

---
*Phase: 14-portal-features*
*Completed: 2026-03-25*
