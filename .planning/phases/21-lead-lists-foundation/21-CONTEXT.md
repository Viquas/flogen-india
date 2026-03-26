# Phase 21: Lead Lists Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Schema migrations (lead_lists table, projects.source column), lead discovery API (POST /api/leads/discover), "Get List" CTA in the Discovery Engine modal, and sidebar nav update. No lead list UI page (Phase 22) or custom build features (Phase 23).

</domain>

<decisions>
## Implementation Decisions

### "Get List" CTA flow
- Button placement: next to existing "Run Autopilot" button, styled as secondary/outline
- Always visible (disabled when required fields empty), same as Autopilot button
- Loading state: button shows spinner + "Fetching..." text, modal stays open but buttons disabled
- On success: show toast "X leads saved, Y duplicates skipped", then close modal and navigate to /dashboard/leads
- Respects existing "Skip businesses with websites" toggle
- Deduplicates against existing leads in lead_lists by placeId — skip businesses already saved

### Missing data handling
- Save all results from Google Places regardless of data completeness (some may lack phone, address, etc.)
- Email column: show "—" when empty. Google Places rarely returns email directly — don't try to scrape
- Google Maps URL: use direct search URL format (https://www.google.com/maps/search/?api=1&query=Business+Name+Address)

### Discovery modal reuse
- Keep template/DLS pickers visible in the modal even for "Get List" — same modal for both flows, pickers are simply ignored by the lead list API
- "Get List" only needs: search term, location, industry, entries count

### Claude's Discretion
- Exact button styling (outline variant, color)
- Toast duration and positioning
- Migration file timestamp naming
- TypeScript type generation approach for lead_lists table

</decisions>

<specifics>
## Specific Ideas

- Toast should be informative: "12 leads saved, 3 duplicates skipped" — not just "Saved!"
- Lead dedup is by placeId across ALL batches (global dedup, not per-batch)
- The lead_lists table schema is specified in the PRD — follow it exactly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-lead-lists-foundation*
*Context gathered: 2026-03-26*
