# Phase 15: Admin Fulfillment - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin-side workflow for processing paid client work: purchased clients list view with filters, client detail page, customer requests tab in the editor sidebar with status transitions, and redeploy button that replaces the existing Approve button for purchased projects. This is the operator's daily fulfillment tool.

</domain>

<decisions>
## Implementation Decisions

### Clients List View
- New "Clients" tab in admin sidebar nav at /dashboard/clients — dedicated page, not a filter on existing dashboard
- Each client card shows: business name, client name/email, Standard/Pro badge, purchase date, open request count, status badge
- Filters: status (Pending Customization, In Progress, Delivered) and plan (Standard/Pro). Sort by date (newest first default).
- Click a client → goes to /dashboard/clients/[id] client detail page (NOT directly to editor)
- Client detail page shows: client summary + full request list. "Edit Site" button opens editor.

### Request Queue Workflow
- Customer Requests tab in editor sidebar — Claude's discretion on chronological vs grouped-by-status display
- Action buttons per request for status transitions: Pending → "Start" button, In Progress → "Complete" button
- Optional notes on completion: clicking "Complete" shows a textarea "What did you do?" (optional, stored in admin_notes). Clicking "Start" transitions immediately, no notes.
- File attachments: Claude's discretion on inline downloads vs Supabase Storage links

### Redeploy Behavior
- Redeploy button REPLACES the existing "Approve" button for purchased client projects (same position, different label/behavior)
- Confirmation dialog before redeploy: "Deploy changes to [business name]?" with Cancel/Deploy buttons
- Redeploy action: save generated_code → increment version → create revision in project_revisions
- Auto-complete of in-progress requests: Claude's discretion (either auto-complete on redeploy or keep manual)
- After redeploy, portal status updates to reflect the change (e.g., "Updated on [date]") — client sees it next login. No email notification (deferred to v4.0).
- Code Drop workflow unchanged: paste code → preview in editor → click Redeploy to save + version bump. Two separate steps.

### Claude's Discretion
- Request tab display: chronological list vs grouped by status
- File download UX: inline thumbnails + download or link to storage
- Auto-complete in-progress requests on redeploy or keep manual
- Client detail page layout and information density
- How the "Updated on [date]" status appears in the portal

</decisions>

<specifics>
## Specific Ideas

- Code Drop + Redeploy is a two-step process: drop code (preview it), then Redeploy (deploy it). This gives you a preview step before the code goes live.
- The Clients nav item is distinct from the existing Dashboard — Dashboard shows all projects, Clients shows only purchased ones with fulfillment focus.
- Optional notes on "Complete" captures what was done without forcing documentation overhead.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-admin-fulfillment*
*Context gathered: 2026-03-25*
