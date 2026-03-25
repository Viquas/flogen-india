---
phase: 17-hero-trust-problem
plan: 02
subsystem: ui
tags: [react, tailwind, lucide-react, css-animations, marketing-landing-page]

# Dependency graph
requires:
  - phase: 17-hero-trust-problem
    provides: useScrollAnimation hook, SCROLL_ANIMATION_STYLES, Navbar component, marketing-constants
provides:
  - Hero section with browser mockup and CSS float animation
  - TrustBar component with Lucide icon mapping
  - Problem section with centered empathetic copy
  - Wired marketing page composing Navbar + Hero + TrustBar + Problem components
  - Layout with scroll animation CSS injected
affects: [18-how-portfolio-benefits, 19-pricing-faq-cta, 20-contact-footer-seo]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS keyframe float animation, Lucide icon map lookup, component extraction from monolithic page]

key-files:
  created:
    - components/marketing/hero.tsx
    - components/marketing/trust-bar.tsx
    - components/marketing/problem.tsx
  modified:
    - app/(marketing)/page.tsx
    - app/(marketing)/layout.tsx

key-decisions:
  - "Adapted TrustBar to actual TRUST_SIGNALS data shape (icon + label only, no value field)"
  - "Used inline <style> for float keyframe in Hero rather than layout global to scope animation"
  - "Kept page.tsx as server component -- client components handle own 'use client' boundary"

patterns-established:
  - "Component extraction: replace inline page sections with imported components from components/marketing/"
  - "Lucide icon mapping: const ICON_MAP object keyed by string name for dynamic icon rendering"
  - "Browser mockup: CSS-only frame with gradient placeholder, no image dependencies"

requirements-completed: [PAGE-02, PAGE-03, PAGE-04]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 17 Plan 02: Hero, Trust Bar & Problem Summary

**Hero with CSS-drawn browser mockup (desktop + floating mobile frame), trust bar with 4 Lucide-icon items, and centered problem/empathy section -- all wired into the marketing page shell**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T19:18:31Z
- **Completed:** 2026-03-25T19:22:28Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Hero section with two-column layout, headline, subheadline, dual CTAs, trust signal badge, and CSS-drawn browser mockup with gentle float animation
- Trust bar rendering 4 items with dynamically mapped Lucide icons in a responsive 2x2 / 4-col grid
- Problem section with centered empathetic copy, large headline, body text, and accent-colored emphasis
- Refactored page.tsx from monolithic inline sections to component composition (Navbar + Hero + TrustBar + Problem imported, remaining sections inline for later phases)
- Layout.tsx injected with SCROLL_ANIMATION_STYLES and section scroll-margin-top for fixed nav offset

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Hero section with browser mockup and float animation** - `0b3e60b` (feat)
2. **Task 2: Create Trust Bar, Problem section, and wire everything into page.tsx** - `bab8bb9` (feat)

## Files Created/Modified
- `components/marketing/hero.tsx` - Hero section with headline, CTAs, browser mockup with float animation
- `components/marketing/trust-bar.tsx` - 4-item trust signal strip with dynamic Lucide icon map
- `components/marketing/problem.tsx` - Centered problem/empathy section with accent emphasis
- `app/(marketing)/page.tsx` - Refactored to import Navbar, Hero, TrustBar, Problem as components
- `app/(marketing)/layout.tsx` - Added SCROLL_ANIMATION_STYLES import and section scroll-margin-top

## Decisions Made
- Adapted TrustBar to actual TRUST_SIGNALS data shape (icon + label, no value field) -- plan interface assumed a `value` field that doesn't exist in the constants
- Used inline `<style>` tag for the `@keyframes float` animation scoped to Hero component rather than polluting layout globals
- Kept page.tsx as a server component since Next.js App Router supports importing client components from server components
- Used actual icon names from constants (CheckCircle, Shield, BarChart, Clock) rather than plan-assumed names (Zap, Code)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted TrustBar to actual data shape**
- **Found during:** Task 2 (TrustBar creation)
- **Issue:** Plan interface assumed TRUST_SIGNALS has `{ icon, value, label }` but actual data is `{ icon, label }` only. Also assumed icons CheckCircle/Zap/Shield/Code but actual are CheckCircle/Shield/BarChart/Clock
- **Fix:** Built TrustBar using actual data shape (icon + label) and imported the correct Lucide icons
- **Files modified:** components/marketing/trust-bar.tsx
- **Verification:** TypeScript passes, icons render correctly
- **Committed in:** bab8bb9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug - plan/reality mismatch)
**Impact on plan:** Necessary adaptation to match actual data. No scope creep.

## Issues Encountered
- `npx tsc --noEmit` on individual files fails without tsconfig context (JSX flag, path aliases) -- used project-wide `npx tsc --noEmit` instead
- Pre-existing build failure in `lib/supabase/proxy.ts` (user_roles table not in Supabase types) -- unrelated to marketing work, out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Hero, TrustBar, and Problem sections fully functional
- Remaining inline sections (How It Works, Portfolio, Benefits, Pricing, FAQ, Final CTA, Contact, Footer) ready for component extraction in Phases 18-20
- Scroll animations operational on all new components
- Browser mockup uses gradient placeholders -- real screenshots deferred to post-MVP

## Self-Check: PASSED

All 5 created/modified files verified on disk. Both task commits (0b3e60b, bab8bb9) verified in git log.

---
*Phase: 17-hero-trust-problem*
*Completed: 2026-03-26*
