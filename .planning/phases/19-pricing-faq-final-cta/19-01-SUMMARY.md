---
phase: 19-pricing-faq-final-cta
plan: 01
subsystem: ui
tags: [pricing, faq, accordion, cta, marketing, tailwind, landing-page]

requires:
  - phase: 18-how-it-works-portfolio-benefits
    provides: "Page shell with component imports pattern, useScrollAnimation hook, marketing design tokens"
provides:
  - "3-tier pricing cards component with Pro elevation and mobile reorder"
  - "Hand-coded FAQ accordion with single-open state and CSS transitions"
  - "Urgency-driven Final CTA component with scarcity line and gradient background"
  - "PRD-locked copy for PRICING, FAQ, FINAL_CTA in marketing-constants"
affects: [20-contact-footer-seo]

tech-stack:
  added: []
  patterns:
    - "CSS order utilities for mobile-first card reordering"
    - "CSS max-height + opacity transition for accordion expand/collapse"
    - "Absolute-positioned badge pill for pricing card highlight"

key-files:
  created:
    - components/marketing/pricing.tsx
    - components/marketing/faq.tsx
    - components/marketing/final-cta.tsx
  modified:
    - lib/marketing-constants.ts
    - app/(marketing)/page.tsx

key-decisions:
  - "Pro card uses order-first on mobile for mobile-first reordering"
  - "FAQ accordion uses CSS max-height transition (not JS height measurement)"
  - "Final CTA secondary button styled as text link, not bordered button"
  - "Payment badges rendered as text (Visa, Mastercard, UPI) not SVG icons"

patterns-established:
  - "Pricing card elevation: border-2 + accent color + shadow-lg + scale-105 for highlighted tier"
  - "Accordion single-open: useState<number | null> with toggle on click"

requirements-completed: [PAGE-08, PAGE-09, PAGE-10]

duration: 4min
completed: 2026-03-26
---

# Phase 19 Plan 01: Pricing, FAQ & Final CTA Summary

**3-tier pricing cards with Pro elevation, 7-question hand-coded accordion, and urgency-driven Final CTA with scarcity line -- all PRD-locked copy**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T20:10:57Z
- **Completed:** 2026-03-25T20:15:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PRD-exact copy for all three sections (anchoring, guarantee, noHiddenFees, 7 FAQ questions, scarcity line)
- Pricing component with 3-tier cards, Pro card elevated (accent border, Most Popular badge, shadow, scale), mobile Pro-first via CSS order
- FAQ hand-coded accordion with single-open state, CSS max-height transition, chevron rotation animation
- Final CTA with gradient background differentiation, larger headline treatment, scarcity line, dual CTAs
- Page.tsx cleaned: 3 inline sections replaced with component imports, unused constant imports removed

## Task Commits

Each task was committed atomically:

1. **Task 1: Update marketing constants and create Pricing, FAQ, FinalCTA components** - `d377fb3` (feat)
2. **Task 2: Wire Pricing, FAQ, FinalCTA into page.tsx** - `48ab32e` (refactor)

## Files Created/Modified
- `lib/marketing-constants.ts` - Updated PRICING (anchoring, guarantee, noHiddenFees, PRD features), FAQ (7 PRD questions), FINAL_CTA (scarcity, PRD copy)
- `components/marketing/pricing.tsx` - 3-tier pricing cards with Pro elevation, check icons, guarantee badge, payment badges
- `components/marketing/faq.tsx` - Hand-coded accordion with useState, single-open, CSS max-height transition, chevron rotation
- `components/marketing/final-cta.tsx` - Gradient dark background, larger headline, scarcity line, primary + text-link CTAs
- `app/(marketing)/page.tsx` - Replaced 3 inline sections with Pricing, Faq, FinalCta imports

## Decisions Made
- Pro card uses `order-first sm:order-none` for mobile-first display (Pro appears first on mobile)
- FAQ accordion uses CSS `max-height` + `opacity` transition rather than JS height measurement -- simpler, sufficient for short answers
- Final CTA secondary button styled as plain text link (not bordered) -- feels more conversational for "Or contact us..." copy
- Payment badges rendered as middot-separated text (Visa, Mastercard, UPI) -- clean for MVP, avoids image dependencies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 19 sections complete (Pricing, FAQ, Final CTA)
- Contact form and Footer remain inline in page.tsx for Phase 20
- CONTACT and FOOTER constants still imported in page.tsx, ready for Phase 20 extraction

## Self-Check: PASSED

All 6 files verified on disk. Both task commits (d377fb3, 48ab32e) found in git log.

---
*Phase: 19-pricing-faq-final-cta*
*Completed: 2026-03-26*
