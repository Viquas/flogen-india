# Phase 22: Lead Lists UI - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

/dashboard/leads page with date picker and batch cards, lead detail popup with RJSON viewer, CSV export per batch, and "Generate Website" from any lead. Uses the lead_lists table and API from Phase 21. No custom build features (Phase 23).

</domain>

<decisions>
## Implementation Decisions

### Leads page layout
- Date picker: button with dropdown ("Mon 26 Mar ▾") that opens a calendar popover
- Default date: today. Selecting a date loads all lead batches for that day.
- Batch card header: query used, number of leads, absolute timestamp ("14:32"), "Download CSV" button on right
- Lead row columns: Company Name, Email, Phone, Location (4 columns, matches spec)
- Rows are clickable — open detail popup
- Empty state: simple "No leads found for this date" with subtle icon. No CTA.

### RJSON detail popup
- Large modal (~800px wide), scrollable body
- Summary header at top: business name, rating stars, phone, address — readable format
- Below summary: full RJSON as formatted JSON with syntax highlighting in a <pre> block
- "Generate Website" CTA at the bottom of the modal

### Generate from lead
- No confirmation dialog — direct action on click
- Button shows loading state ("Generating...") then success state after API returns
- Lead row stays in list, "Generate Website" button changes to disabled with checkmark/status
- Generated project gets source='discovery' (not 'custom' — it came from Google Places)
- Modal closes after generation starts, success toast shown

### CSV export
- "Download CSV" button on the right side of each batch card header
- Client-side generation (no server endpoint needed)
- Columns: Company Name, Email, Phone, Location, Google Maps URL
- Filename: "leads-{query}-{date}.csv" (e.g., "leads-dentists-bangalore-2026-03-26.csv")

### Claude's Discretion
- Calendar popover implementation (native date input vs custom component)
- JSON syntax highlighting approach (CSS-only or lightweight library)
- Exact modal component (existing dialog pattern from admin codebase)
- Loading skeleton design while batches load
- Responsive behavior at smaller widths

</decisions>

<specifics>
## Specific Ideas

- Batch cards should feel like grouped sections, not floating cards — think Linear's list grouping
- The JSON viewer should be readable for quick scanning, not a code editor — just colored keys/values in a monospace block
- "Generate Website" should feel instant — optimistic UI, don't wait for full generation to complete

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-lead-lists-ui*
*Context gathered: 2026-03-26*
