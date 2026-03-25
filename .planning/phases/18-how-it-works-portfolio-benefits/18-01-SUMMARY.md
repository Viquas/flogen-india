---
phase: 18-how-it-works-portfolio-benefits
plan: 01
subsystem: ui
tags: [react, lucide-react, marketing, landing-page, css-animation]

# Dependency graph
requires:
  - phase: 17-hero-trust-problem
    provides: "useScrollAnimation hook, ICON_MAP pattern, marketing CSS tokens"
provides:
  - "HowItWorks component with 3-step process and desktop/mobile layouts"
  - "Benefits component with 5 outcome-focused differentiators"
  - "Updated marketing-constants with PRD-locked copy for HOW_IT_WORKS, BENEFITS, PORTFOLIO"
affects: [18-02-portfolio, 19-pricing-faq-cta]

# Tech tracking
tech-stack:
  added: []
  patterns: [vertical-timeline-mobile, connecting-lines-desktop, icon-circle-pattern]

key-files:
  created:
    - components/marketing/how-it-works.tsx
    - components/marketing/benefits.tsx
  modified:
    - lib/marketing-constants.ts

key-decisions:
  - "Desktop connecting lines: dashed border between step circles, hidden on mobile"
  - "Mobile timeline: vertical line with numbered circles positioned absolute-left"
  - "Benefits subtitle added for visual balance (not in PRD, purely layout)"

patterns-established:
  - "Dual-layout pattern: hidden sm:grid for desktop, sm:hidden for mobile (separate markup)"
  - "Icon circle: w-12 h-12 rounded-full bg-[var(--mkt-accent)]/10 for benefit icons"

requirements-completed: [PAGE-05, PAGE-07]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 18 Plan 01: How It Works & Benefits Summary

**PRD-locked HowItWorks (3 steps with connecting lines/timeline) and Benefits (5 differentiators with icon grid) components, plus updated marketing constants for all Phase 18 sections**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T19:41:42Z
- **Completed:** 2026-03-25T19:46:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Updated HOW_IT_WORKS, BENEFITS, and PORTFOLIO constants to match PRD-locked copy exactly
- Built HowItWorks component with horizontal step cards + dashed connecting lines on desktop, vertical timeline with numbered circles on mobile
- Built Benefits component with 5 items in responsive 1/2/3-column grid, each with icon circle, heading, and description

## Task Commits

Each task was committed atomically:

1. **Task 1: Update marketing-constants.ts with PRD-locked copy** - `c4a28bf` (feat)
2. **Task 2: Create HowItWorks and Benefits components** - `dc04710` (feat)

## Files Created/Modified
- `lib/marketing-constants.ts` - Updated HOW_IT_WORKS (3 PRD steps), BENEFITS (5 PRD items), PORTFOLIO (6 PRD businesses + qualityBadges)
- `components/marketing/how-it-works.tsx` - 3-step process section with dual desktop/mobile layouts, Lucide icons, useScrollAnimation
- `components/marketing/benefits.tsx` - 5-benefit responsive grid with icon circles, hover effects, useScrollAnimation

## Decisions Made
- Desktop connecting lines use dashed border-top pseudo-positioned between step circles (CSS-only, no SVG)
- Mobile uses a completely separate markup block (sm:hidden) with vertical left-border timeline and absolute-positioned number circles
- Added a subtitle to Benefits section ("What makes us different from template builders and generic agencies") for visual consistency with other sections -- not in PRD but matches the pattern of all other sections having subtitles

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- HowItWorks and Benefits components ready to be wired into page.tsx (replacing inline placeholders)
- PORTFOLIO constants updated with qualityBadges array, ready for portfolio component in 18-02
- Page.tsx still uses inline sections for how-it-works and benefits -- 18-02 or a separate plan should swap them for the new components

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 18-how-it-works-portfolio-benefits*
*Completed: 2026-03-26*
