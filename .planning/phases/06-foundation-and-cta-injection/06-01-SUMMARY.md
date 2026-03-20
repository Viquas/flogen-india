---
phase: 06-foundation-and-cta-injection
plan: 01
subsystem: database
tags: [supabase, postgres, sql, typescript, geo-detection, pricing, storage-buckets]

# Dependency graph
requires: []
provides:
  - "claims and customizations SQL schema (setup-claims-schema.sql)"
  - "TypeScript Database type definitions for claims and customizations tables"
  - "projects table extended with slug, claim_expires_at, screenshot_url columns"
  - "site-screenshots (public) and claim-uploads (private) storage buckets"
  - "geo-detection utility (getCurrencyFromRequest) using Vercel IP headers"
  - "claim pricing utility with hardcoded INR/USD paise/cents values"
affects: [07-claim-flow, 08-payment-integration, 09-upsell, 10-delivery]

# Tech tracking
tech-stack:
  added: []
  patterns: [currency-from-request-header, paise-cents-integer-pricing, supabase-storage-buckets]

key-files:
  created:
    - webgen/scripts/setup-claims-schema.sql
    - webgen/lib/geo.ts
    - webgen/lib/claim-pricing.ts
  modified:
    - webgen/types/database.ts

key-decisions:
  - "Used integer paise/cents for all monetary amounts to avoid floating-point rounding errors"
  - "Default currency is INR (primary market) with fallback from x-vercel-ip-country header"
  - "Added updated_at triggers on claims and customizations tables for automatic timestamp management"
  - "Used ON CONFLICT DO NOTHING for storage bucket creation to make script idempotent"

patterns-established:
  - "Integer pricing: All amounts stored as paise (INR) or cents (USD), never floats"
  - "Geo-detection: Use x-vercel-ip-country header with NEXT_PUBLIC_DEV_COUNTRY env fallback"
  - "Separate pricing files: claim-pricing.ts for client plans, pricing.ts for AI model costs"

requirements-completed: [INFRA-01, INFRA-02, INFRA-05]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 6 Plan 01: Data Foundation Summary

**Claims/customizations SQL schema, Supabase storage buckets, geo-detection utility, and INR/USD integer pricing for Standard and Pro plans**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T17:01:28Z
- **Completed:** 2026-03-18T17:03:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Complete SQL DDL for claims and customizations tables with indexes, constraints, and updated_at triggers
- Storage bucket configuration for site-screenshots (public, 2MB, webp/png) and claim-uploads (private, 5MB, png/jpeg/webp)
- TypeScript Database type extended with claims and customizations table definitions plus new project columns
- Geo-detection utility returning INR for Indian visitors and USD for all others via Vercel IP header
- Claim pricing utility with hardcoded integer paise/cents values (Standard: 4999 INR / 499 USD, Pro: 9999 INR / 1299 USD)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL setup script and update TypeScript database types** - `b312cb8` (feat)
2. **Task 2: Create geo-detection and claim pricing utilities** - `24612b0` (feat)

## Files Created/Modified
- `webgen/scripts/setup-claims-schema.sql` - Full DDL for claims, customizations tables, indexes, storage buckets, triggers
- `webgen/types/database.ts` - Added claims and customizations type definitions, extended projects with slug/claim_expires_at/screenshot_url
- `webgen/lib/geo.ts` - Geo-detection utility using x-vercel-ip-country header
- `webgen/lib/claim-pricing.ts` - Hardcoded pricing for Standard and Pro plans in INR and USD

## Decisions Made
- Used integer paise/cents for all monetary amounts to avoid floating-point rounding errors
- Default currency is INR (primary market) with fallback from x-vercel-ip-country header
- Added updated_at triggers on claims and customizations tables for automatic timestamp management
- Used ON CONFLICT DO NOTHING for storage bucket creation to make script idempotent
- Kept Currency type locally defined in both geo.ts and claim-pricing.ts (simple 2-value union, no shared types file needed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
**SQL script must be run in Supabase SQL Editor.** The script at `webgen/scripts/setup-claims-schema.sql` needs to be executed against the Supabase database to create the claims and customizations tables, indexes, storage buckets, and project column additions. This is a one-time setup step.

## Next Phase Readiness
- Database schema ready for claim flow API endpoints (Phase 7)
- TypeScript types in place for type-safe Supabase queries
- Pricing and geo utilities ready for claim page and payment integration
- Storage buckets configured for screenshot and client upload workflows

---
*Phase: 06-foundation-and-cta-injection*
*Completed: 2026-03-18*
