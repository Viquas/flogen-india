---
phase: 20-contact-footer-legal-polish
plan: 02
subsystem: ui
tags: [legal, privacy, terms, refund, cookie-consent, seo, metadata, opengraph]

requires:
  - phase: 16-marketing-foundation
    provides: Marketing layout with design tokens and font setup
  - phase: 19-pricing-faq-final-cta
    provides: Footer with legal links pointing to /privacy, /terms, /refund

provides:
  - Privacy policy page at /privacy with GDPR, cookies, data collection sections
  - Terms of service page at /terms with pricing, IP, liability, governing law
  - Refund policy page at /refund with 30-day satisfaction guarantee
  - Cookie consent banner with localStorage persistence
  - Full SEO metadata (title, description, canonical, OG, Twitter card)

affects: [production-launch, razorpay-verification]

tech-stack:
  added: []
  patterns:
    - "Legal page pattern: server component, max-w-3xl centered, prose-style sections"
    - "Cookie consent: client component with localStorage hydration-safe pattern"
    - "SEO metadata: centralized in marketing layout with metadataBase for canonical"

key-files:
  created:
    - app/(marketing)/privacy/page.tsx
    - app/(marketing)/terms/page.tsx
    - app/(marketing)/refund/page.tsx
    - components/marketing/cookie-consent.tsx
  modified:
    - app/(marketing)/layout.tsx

key-decisions:
  - "Legal pages as server components for zero JS bundle impact"
  - "Cookie consent uses null initial state to avoid hydration mismatch"
  - "SEO metadata in layout applies to all marketing routes as defaults"
  - "OG image deferred (commented path reserved at /marketing/og.png)"

patterns-established:
  - "Legal page structure: py-16 sm:py-24, max-w-3xl, section h2 headings, mkt-text-secondary body"
  - "Cookie consent localStorage key: 'cookie-consent' with 'accepted'/'declined' values"

requirements-completed: [LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, INFRA-02, INFRA-03]

duration: 4min
completed: 2026-03-26
---

# Phase 20 Plan 02: Legal Pages, Cookie Consent & SEO Summary

**3 legal pages (privacy, terms, refund) with cookie consent banner and full SEO metadata for Razorpay verification and GDPR compliance**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T20:34:52Z
- **Completed:** 2026-03-25T20:38:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Complete privacy policy with GDPR rights, cookies, data retention, and third-party services sections
- Terms of service covering pricing ($499/$1,299/custom), IP, liability, refund reference, and governing law (India/Bangalore)
- Refund policy with 30-day satisfaction guarantee, eligibility, process, and exceptions
- Cookie consent banner with Accept/Decline buttons, localStorage persistence, and slide-up animation
- Full SEO metadata: title, description, canonical URL, OpenGraph, Twitter card, robots directives

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 3 legal pages and cookie consent banner** - `0edd54f` (feat)
2. **Task 2: Update marketing layout with SEO metadata and cookie consent** - `f255a0e` (feat)

## Files Created/Modified
- `app/(marketing)/privacy/page.tsx` - Privacy policy with 8 sections (GDPR, cookies, data retention, etc.)
- `app/(marketing)/terms/page.tsx` - Terms of service with 11 sections (pricing, IP, liability, etc.)
- `app/(marketing)/refund/page.tsx` - Refund policy with 7 sections (30-day guarantee, eligibility, process)
- `components/marketing/cookie-consent.tsx` - Client component with localStorage persistence and slide-up animation
- `app/(marketing)/layout.tsx` - Updated metadata (title, description, canonical, OG, Twitter) + CookieConsent render

## Decisions Made
- Legal pages are pure server components (no "use client") for zero JS overhead
- Cookie consent uses `useState<boolean | null>(null)` with useEffect to check localStorage, avoiding hydration mismatch
- OG image path reserved but commented out (design deferred to later)
- SEO metadata set at layout level so it applies as defaults to all marketing routes (individual pages override via their own metadata exports)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All legal pages live and linked from footer
- Cookie consent active on all marketing pages
- SEO metadata ready for production (OG image needs design later)
- Razorpay legal compliance requirements satisfied (privacy, terms, refund pages exist)

## Self-Check: PASSED

All 5 files verified on disk. Both task commits (`0edd54f`, `f255a0e`) verified in git log.

---
*Phase: 20-contact-footer-legal-polish*
*Completed: 2026-03-26*
