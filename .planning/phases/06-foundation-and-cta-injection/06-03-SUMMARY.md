---
phase: 06-foundation-and-cta-injection
plan: 03
subsystem: ui, infra
tags: [cta-bar, puppeteer, screenshot, webp, supabase-storage, iframe, countdown-timer]

# Dependency graph
requires:
  - phase: 06-01
    provides: claim-pricing.ts with CLAIM_WINDOW_DAYS, database schema with screenshot_url and claim_expires_at columns
  - phase: 06-02
    provides: (client)/claim/[slug]/page.tsx placeholder, html-boilerplate.ts utility, supabase admin client
provides:
  - CTA bar injector (injectCtaBar) that adds style-isolated sticky bar to generated HTML
  - Screenshot generator (generateScreenshot) that renders HTML to WebP and uploads to Supabase Storage
  - Claim page rendering generated site with CTA bar in full-viewport iframe
affects: [phase-07-claim-landing, phase-08-payments, phase-09-upsell]

# Tech tracking
tech-stack:
  added: [puppeteer-core, "@sparticuz/chromium-min"]
  patterns: [inline-style-isolation, html-string-injection, iframe-srcDoc-rendering]

key-files:
  created:
    - webgen/lib/cta-injector.ts
    - webgen/lib/screenshot.ts
  modified:
    - webgen/next.config.ts
    - webgen/package.json
    - webgen/app/(client)/claim/[slug]/page.tsx

key-decisions:
  - "All CTA styles inline with flogen-cta-* ID prefix for complete style isolation"
  - "60-second countdown interval (not 1s) for minute-level precision and lower CPU"
  - "puppeteer headless: true (chromium-min has no headless property, use puppeteer native)"
  - "iframe srcDoc for rendering CTA-injected HTML inline without separate route"

patterns-established:
  - "HTML injection pattern: insert before </body> using string replace, never modify constructHtmlBoilerplate"
  - "Style isolation: inline styles + unique ID prefixes for any HTML injected into generated sites"
  - "Screenshot pipeline: puppeteer-core + chromium-min for serverless WebP generation"

requirements-completed: [INFRA-04, CTA-01, CTA-02, CTA-03, CTA-04]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 6 Plan 3: CTA Bar Injector, Screenshot Generator, and Claim Page Wiring Summary

**Style-isolated CTA bar with countdown timer injected into generated sites via iframe, plus Puppeteer screenshot pipeline for WebP previews**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T17:42:19Z
- **Completed:** 2026-03-18T17:46:25Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- CTA bar injector with business name display, "Claim This Website" button, countdown timer (60s interval), and expired state handling
- Screenshot generator using puppeteer-core + @sparticuz/chromium-min for serverless WebP rendering with Supabase Storage upload
- Claim page updated to render generated site with CTA bar in full-viewport iframe using srcDoc

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CTA bar injector with countdown timer and expired state** - `6597dd2` (feat)
2. **Task 2: Create screenshot generator and update next.config.ts** - `588872d` (feat)
3. **Task 3: Wire CTA bar into claim page** - `035c7ce` (feat)

## Files Created/Modified
- `webgen/lib/cta-injector.ts` - CTA bar HTML builder and injector with CtaConfig interface, countdown timer, expired state
- `webgen/lib/screenshot.ts` - Puppeteer-based screenshot generator that renders to WebP and uploads to Supabase Storage
- `webgen/next.config.ts` - Added serverExternalPackages for puppeteer-core and @sparticuz/chromium-min
- `webgen/package.json` - Added puppeteer-core and @sparticuz/chromium-min dependencies
- `webgen/app/(client)/claim/[slug]/page.tsx` - Updated from placeholder to full CTA-injected iframe rendering

## Decisions Made
- Used inline styles exclusively for CTA bar (no Tailwind) with `flogen-cta-*` ID prefixes for complete isolation from generated site CSS
- Set countdown timer to 60-second interval (not 1s) since minute-level precision is sufficient and reduces CPU overhead
- Used `headless: true` directly since `@sparticuz/chromium-min` does not expose a `headless` property (corrected from plan's `chromium.headless`)
- Rendered CTA-injected HTML via iframe `srcDoc` attribute -- no separate API route needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed chromium.headless reference**
- **Found during:** Task 2 (Screenshot generator)
- **Issue:** Plan specified `headless: chromium.headless` but `@sparticuz/chromium-min` does not expose a `headless` property
- **Fix:** Changed to `headless: true` which is the correct puppeteer-core option
- **Files modified:** webgen/lib/screenshot.ts
- **Verification:** TypeScript compilation passes with no errors in screenshot.ts
- **Committed in:** 588872d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API correction. No scope creep.

## Issues Encountered
- Git repo root is at `/Users/sohail` (home directory), so file staging required absolute paths from repo root rather than relative paths from project directory. Resolved by staging from correct root.

## User Setup Required
None - no external service configuration required. Puppeteer chromium binary is fetched at runtime from remote URL.

## Next Phase Readiness
- CTA bar injection pipeline is complete and wired end-to-end in the claim page
- Screenshot generator ready for integration into batch processing (autopilot)
- Phase 6 is now complete (3/3 plans done)
- Ready for Phase 7 (claim landing page with pricing)
- Razorpay API keys still needed before Phase 8

## Self-Check: PASSED

All 5 files verified present. All 3 task commits verified in git log.

---
*Phase: 06-foundation-and-cta-injection*
*Completed: 2026-03-18*
