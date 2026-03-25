---
phase: 16-marketing-foundation
plan: 01
subsystem: ui
tags: [nextjs, tailwind, marketing, landing-page, fonts, design-tokens]

# Dependency graph
requires: []
provides:
  - "(marketing) route group with isolated layout and dark design tokens"
  - "Centralized marketing copy constants (lib/marketing-constants.ts)"
  - "Landing page shell at / with 12 section placeholders"
  - "DM Serif Display + Inter font stack for marketing pages"
  - "Scoped CSS custom properties for Linear-inspired dark DLS"
affects: [17-above-fold, 18-social-proof, 19-conversion, 20-trust-contact]

# Tech tracking
tech-stack:
  added: [DM_Serif_Display (next/font), Inter (next/font)]
  patterns: [marketing route group isolation, scoped CSS tokens, centralized copy constants]

key-files:
  created:
    - lib/marketing-constants.ts
    - app/(marketing)/layout.tsx
    - app/(marketing)/page.tsx
  modified: []

key-decisions:
  - "Used --font-inter-marketing variable to avoid collision with client layout --font-inter"
  - "Scoped design tokens via .marketing CSS class + inline style tag instead of modifying globals.css"
  - "Grain texture via inline SVG data URI in ::before pseudo-element"
  - "Deleted app/page.tsx entirely -- marketing route group claims / route"

patterns-established:
  - "Marketing copy pattern: all strings in lib/marketing-constants.ts, imported by page components"
  - "Marketing layout pattern: font variables on wrapper div, scoped CSS custom properties"
  - "Section pattern: <section id='{name}'> with responsive padding and max-width container"
  - "Alternating sections: odd dark (#0A0A0A), even light (#FAFAFA) with text color swap"

requirements-completed: [ROUTE-01, ROUTE-02, ROUTE-03, DLS-01, DLS-02, DLS-04, DLS-05, INFRA-04]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 16 Plan 01: Marketing Foundation Summary

**Marketing route group with DM Serif Display/Inter fonts, Linear-inspired dark design tokens, centralized copy file, and landing page shell replacing root redirect**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T18:42:51Z
- **Completed:** 2026-03-25T18:47:40Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 deleted)

## Accomplishments
- Centralized all marketing copy in lib/marketing-constants.ts with 12 sections and typed exports
- Created isolated (marketing) route group with dark design tokens, grain texture, and premium font stack
- Replaced root route redirect with landing page shell rendering all section placeholders

## Task Commits

Each task was committed atomically:

1. **Task 1: Create centralized marketing copy constants** - `1fe9b39` (feat)
2. **Task 2: Create (marketing) route group with isolated layout and dark design tokens** - `2d2f75f` (feat)
3. **Task 3: Create landing page shell and replace root route redirect** - `c067fea` (feat)

## Files Created/Modified
- `lib/marketing-constants.ts` - All marketing copy for 12 landing page sections with type exports
- `app/(marketing)/layout.tsx` - Isolated layout with DM Serif Display + Inter, dark tokens, grain texture
- `app/(marketing)/page.tsx` - Landing page shell with all section placeholders using constants
- `app/page.tsx` - Deleted (was auth redirect, replaced by marketing route group)

## Decisions Made
- Used `--font-inter-marketing` variable name to avoid collision with client layout's `--font-inter`
- Applied design tokens via scoped `.marketing` class + inline `<style>` tag rather than modifying globals.css, keeping full isolation
- Implemented grain texture as inline SVG data URI in a CSS `::before` pseudo-element for zero-dependency noise overlay
- Deleted `app/page.tsx` entirely since `(marketing)/page.tsx` claims the `/` route in Next.js App Router

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Marketing layout and shell ready for Phase 17 (above-fold sections: hero visual, trust bar, problem)
- All section ids in place for anchor link navigation
- Design tokens established for consistent styling across all future marketing sections
- Portfolio placeholder images will need actual screenshots from demo sites (noted as known blocker in STATE.md)

## Self-Check: PASSED

- lib/marketing-constants.ts: FOUND
- app/(marketing)/layout.tsx: FOUND
- app/(marketing)/page.tsx: FOUND
- app/page.tsx: CONFIRMED DELETED
- Commit 1fe9b39: FOUND
- Commit 2d2f75f: FOUND
- Commit c067fea: FOUND

---
*Phase: 16-marketing-foundation*
*Completed: 2026-03-25*
