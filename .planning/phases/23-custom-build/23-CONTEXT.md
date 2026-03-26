# Phase 23: Custom Build - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Custom build modal with two tabs (Google Maps URL + upload business data), two API endpoints (from-url, from-data), `source='custom'` tracking on projects, /dashboard/custom page showing custom-built projects, sidebar nav item, and dashboard header CTA button. No lead list features (Phase 21-22).

</domain>

<decisions>
## Implementation Decisions

### Modal input handling
- Two tabs: "Google Maps URL" and "Upload Business Data"
- URL tab: accept any URL containing maps.google.com or goo.gl/maps. Extract Place ID or search query. Show error only if extraction fails entirely.
- Data tab: auto-detect format — try JSON.parse first; if valid JSON treat as structured data, if not treat as freeform text. User just pastes and clicks generate.
- Data tab: textarea for pasting PLUS a small "Upload file" button that reads .txt/.json file contents into the textarea
- On submit: close modal immediately, show "Starting generation..." toast. Project appears in dashboard grid when ready. User isn't blocked.
- "Generate Website" CTA at bottom of modal

### Custom builds page
- Same project grid layout as the main dashboard home (reuse existing project card pattern)
- Simple grid only — no date picker, no calendar, no stats. Just page title + project grid filtered by source='custom'
- Each card links to the editor (same as existing project cards)
- Empty state: simple "No custom builds yet" message, no CTA

### Dashboard header CTA
- "Custom Build" button to the LEFT of existing "+ New Batch" button
- Styled as secondary/outline with a tool icon (Wrench or PenTool from lucide-react)
- Always visible, opens the Custom Build modal on click

### Claude's Discretion
- Tab switching implementation (controlled tabs vs toggle)
- URL regex patterns for Place ID extraction
- Exact icon choice (Wrench vs PenTool vs other)
- Project card component reuse strategy
- Error message wording for invalid URLs or data

</decisions>

<specifics>
## Specific Ideas

- The modal should feel lightweight — two tabs, clear purpose, fast to use
- URL extraction should be forgiving — better to attempt and fail gracefully than reject valid URLs
- The custom builds page is deliberately simple — it's a filtered view, not a new dashboard

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-custom-build*
*Context gathered: 2026-03-26*
