---
phase: 14-portal-features
plan: 02
subsystem: ui, api
tags: [dns, domainr, gemini, domain-verification, portal]

# Dependency graph
requires:
  - phase: 13-portal-shell
    provides: "Dashboard layout, auth guard pattern, portal navigation"
  - phase: 11-claim-to-portal
    provides: "Claims table with domain_option/domain_value fields, Supabase auth"
provides:
  - "/portal/domain page with 3-card grid for domain management"
  - "DNS TXT verification via Google DoH API"
  - "Domain availability search via Domainr/RapidAPI"
  - "AI domain suggestion generation via Gemini"
  - "4 portal API routes: subdomain, verify, search, suggest"
affects: [14-portal-features, deployment, domain-provisioning]

# Tech tracking
tech-stack:
  added: [domainr-api, google-doh]
  patterns: [portal-api-route-auth, registrar-aware-dns-instructions, debounced-search]

key-files:
  created:
    - lib/portal/dns-verify.ts
    - lib/portal/domain-search.ts
    - lib/portal/domain-suggest.ts
    - app/api/portal/domain/subdomain/route.ts
    - app/api/portal/domain/verify/route.ts
    - app/api/portal/domain/search/route.ts
    - app/api/portal/domain/suggest/route.ts
    - app/(portal)/portal/(dashboard)/domain/page.tsx
    - app/(portal)/portal/(dashboard)/domain/domain-client.tsx
  modified: []

key-decisions:
  - "Google DoH JSON API for DNS verification (no server-side dig, works in serverless)"
  - "Domainr via RapidAPI for domain availability (matches RESEARCH.md decision, RAPIDAPI_KEY required)"
  - "generateText with gemini-2.0-flash for domain suggestions (fast, cheap, text-only)"
  - "Single domain-client.tsx with view state machine (grid/subdomain/connect/buy) rather than separate route per flow"
  - "6 registrar instruction sets: GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger, Other"
  - "Batch availability checking with 5 concurrent requests max via Promise.allSettled"

patterns-established:
  - "Portal API route pattern: auth check, Zod validation, admin client, structured JSON response"
  - "DNS verification flow: generate token from claim ID, verify via DoH, update claim on success"
  - "Debounced search pattern: 500ms timeout ref with cleanup in useEffect"

requirements-completed: [DOMAIN-01, DOMAIN-02, DOMAIN-03, DOMAIN-04, DOMAIN-05]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 14 Plan 02: Domain Management Summary

**Domain page with free subdomain activation, DNS TXT verification for 6 registrars via Google DoH, Domainr availability search, and Gemini AI domain suggestions**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T00:34:54Z
- **Completed:** 2026-03-25T00:40:43Z
- **Tasks:** 2
- **Files created:** 9

## Accomplishments
- Full domain management page at /portal/domain with 3-card selection grid
- DNS verification flow with step-by-step instructions for 6 registrars (GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger, Other)
- Domain availability search via Domainr API with debounced input and registrar purchase links
- AI domain suggestions via Gemini with automatic second-round generation if fewer than 3 available
- Free subdomain activation with one-click claim update

## Task Commits

Each task was committed atomically:

1. **Task 1: Create domain lib utilities and API routes** - `051e4f3` (feat)
2. **Task 2: Create domain page with 3-card grid and all domain flows** - `795957a` (feat)

## Files Created/Modified
- `lib/portal/dns-verify.ts` - Google DoH TXT record verification and token generation
- `lib/portal/domain-search.ts` - Domainr API wrapper with availability check, search, and registrar deep links
- `lib/portal/domain-suggest.ts` - Gemini AI domain name suggestion generator
- `app/api/portal/domain/subdomain/route.ts` - POST endpoint for free subdomain activation
- `app/api/portal/domain/verify/route.ts` - POST endpoint for DNS TXT verification
- `app/api/portal/domain/search/route.ts` - GET endpoint for domain availability search
- `app/api/portal/domain/suggest/route.ts` - POST endpoint for AI suggestions with batch availability check
- `app/(portal)/portal/(dashboard)/domain/page.tsx` - Server component with auth guard and data fetch
- `app/(portal)/portal/(dashboard)/domain/domain-client.tsx` - Client component with 4-view state machine

## Decisions Made
- Used Google DoH JSON API (`dns.google/resolve`) for DNS verification -- works in serverless, no system dig required
- Single client component with view state machine (`grid | subdomain | connect | buy`) rather than separate routes per flow -- keeps shared state simple
- 6 registrar instruction sets with hardcoded step-by-step guides -- covers the most common registrars per plan requirements
- Batch availability checking with max 5 concurrent requests to avoid rate limiting on Domainr API
- Verification token format: `flogen-verify-{first8CharsOfClaimId}` -- deterministic, no DB storage needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ZodError.errors -> ZodError.issues**
- **Found during:** Task 1 (API route creation)
- **Issue:** Used `.error.errors[0].message` which does not exist on ZodError in current Zod version
- **Fix:** Changed to `.error.issues[0].message` across all 3 API routes with Zod validation
- **Files modified:** subdomain/route.ts, verify/route.ts, suggest/route.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 051e4f3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor API correction. No scope creep.

## Issues Encountered
None

## User Setup Required
- `RAPIDAPI_KEY` environment variable required for Domainr domain availability search
- `GOOGLE_GENERATIVE_AI_API_KEY` required for Gemini AI domain suggestions (may already be set)

## Next Phase Readiness
- Domain page is complete and navigable from portal dashboard
- Domain management flows are self-contained -- no dependencies on other Phase 14 plans
- $49 agent CTA links to /portal/support (placeholder for Plan 04)

---
*Phase: 14-portal-features*
*Completed: 2026-03-25*
