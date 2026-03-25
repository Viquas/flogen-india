# Phase 15: Admin Fulfillment - Research

**Researched:** 2026-03-25
**Domain:** Admin dashboard extension -- client list, request queue management, redeploy workflow
**Confidence:** HIGH

## Summary

Phase 15 completes the v3.0 loop by giving the admin operator the tools to manage purchased clients and fulfill their requests. The technical surface is well-understood: it extends the existing admin dashboard (sidebar nav, server actions, Supabase admin client pattern) and editor (client-side page with sidebar panels, approve button). No new libraries or infrastructure are needed.

The core work divides into three areas: (1) a new "Clients" tab at `/dashboard/clients` with a list view and `/dashboard/clients/[id]` detail page, (2) a "Customer Requests" tab injected into the editor sidebar for projects that have paid claims, and (3) a redeploy button that replaces the existing "Approve" button conditionally for purchased projects. All data access uses the existing `createAdminClient()` pattern (service role, bypasses RLS). The `client_requests` table already exists with the correct schema from Phase 11 (migration `20260325000001`). The `updateProjectWithCode()` function in `lib/ai/project-persistence.ts` already handles versioning and revision snapshots -- the redeploy action wraps this with request status updates.

**Primary recommendation:** Build in three waves -- (1) server actions + Clients list page, (2) Client detail page + editor Customer Requests tab, (3) Redeploy button replacing Approve for purchased projects.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New "Clients" tab in admin sidebar nav at /dashboard/clients -- dedicated page, not a filter on existing dashboard
- Each client card shows: business name, client name/email, Standard/Pro badge, purchase date, open request count, status badge
- Filters: status (Pending Customization, In Progress, Delivered) and plan (Standard/Pro). Sort by date (newest first default).
- Click a client -> goes to /dashboard/clients/[id] client detail page (NOT directly to editor)
- Client detail page shows: client summary + full request list. "Edit Site" button opens editor.
- Action buttons per request for status transitions: Pending -> "Start" button, In Progress -> "Complete" button
- Optional notes on completion: clicking "Complete" shows a textarea "What did you do?" (optional, stored in admin_notes). Clicking "Start" transitions immediately, no notes.
- Redeploy button REPLACES the existing "Approve" button for purchased client projects (same position, different label/behavior)
- Confirmation dialog before redeploy: "Deploy changes to [business name]?" with Cancel/Deploy buttons
- Redeploy action: save generated_code -> increment version -> create revision in project_revisions
- After redeploy, portal status updates to reflect the change (e.g., "Updated on [date]") -- client sees it next login. No email notification (deferred to v4.0).
- Code Drop workflow unchanged: paste code -> preview in editor -> click Redeploy to save + version bump. Two separate steps.

### Claude's Discretion
- Request tab display: chronological list vs grouped by status
- File download UX: inline thumbnails + download or link to storage
- Auto-complete in-progress requests on redeploy or keep manual
- Client detail page layout and information density
- How the "Updated on [date]" status appears in the portal

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Purchased clients list view in admin dashboard -- shows business name, client name/email, plan, purchase date, status badge, open request count | Extend sidebar-nav.tsx sections array; new server component page at `/dashboard/clients`; query joins claims + projects + client_requests count |
| ADMIN-02 | Customer Requests tab in editor sidebar -- lists all client_requests for a project with type, content, status, timestamp | New `CustomerRequestsTab` component in editor; fetched via server action `getProjectRequests(projectId)`; conditionally rendered when project has paid claim |
| ADMIN-03 | Request status transitions: admin toggles pending -> in_progress -> completed from Customer Requests tab | Server action `updateRequestStatus(requestId, newStatus, adminNotes?)` using admin client; optimistic UI update in editor |
| ADMIN-04 | Redeploy button -- updates generated_code, increments version, saves revision to project_revisions, marks relevant requests as completed | Wraps existing `updateProjectWithCode()` with additional request completion logic; replaces Approve button conditionally |
| ADMIN-05 | client_requests table with id, claim_id, project_id, auth_user_id, type enum, status enum, content JSONB, created_at, updated_at | Already exists (migration 20260325000001). TypeScript types already in `types/database.ts`. No schema work needed. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.95.3 (existing) | Admin client for all data queries | Already used in every admin server action |
| next | 16.1.6 (existing) | Server components, server actions, route handlers | Project framework |
| react | 19 (existing) | UI components | Project framework |
| tailwindcss | (existing) | Styling | Project convention |
| lucide-react | (existing) | Icons | Already used in sidebar-nav, editor, everywhere |
| sonner | (existing) | Toast notifications | Already configured in admin layout |
| date-fns | (existing) | Date formatting | Already used in dashboard and history sidebar |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Dialog | (existing) | Confirmation dialog for redeploy | Reuse existing Dialog/DialogContent pattern |
| shadcn DropdownMenu | (existing) | Filter dropdowns on Clients page | Same pattern as history-sidebar filters |
| shadcn Button | (existing) | Action buttons | Standard UI component |

### Alternatives Considered
None. This phase uses zero new packages. Every capability is covered by existing dependencies.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
app/(admin)/
  dashboard/
    clients/
      page.tsx               # Server component: Clients list view (ADMIN-01)
      actions.ts             # Server actions: getClients, updateRequestStatus, redeployProject
      clients-list.tsx       # Client component: filters, sorting, card grid
    clients/[id]/
      page.tsx               # Server component: Client detail view
      client-detail.tsx      # Client component: request list, actions, edit site button
  editor/
    page.tsx                 # Modified: conditional Approve vs Redeploy button
components/
  admin/
    customer-requests-tab.tsx  # Editor sidebar tab for request queue (ADMIN-02)
    redeploy-dialog.tsx        # Confirmation dialog before redeploy (ADMIN-04)
```

### Pattern 1: Server Action with Admin Client
**What:** All Phase 15 data queries use `createAdminClient()` (service role, bypasses RLS). This is the established admin pattern -- admin routes never use the anon-key client.
**When to use:** Every admin dashboard page and server action.
**Example:**
```typescript
// app/(admin)/dashboard/clients/actions.ts
"use server"
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getClients(filters?: { status?: string; plan?: string }) {
    const supabase = createAdminClient()

    // Join claims + projects + count open requests
    let query = supabase
        .from('claims')
        .select(`
            id,
            project_id,
            plan,
            status,
            client_name,
            client_email,
            paid_at,
            projects!inner(id, business_data, slug, version, updated_at),
            client_requests(id, status)
        `)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('paid_at', { ascending: false })

    if (filters?.plan) {
        query = query.eq('plan', filters.plan)
    }

    const { data, error } = await query
    if (error) return { success: false, error: error.message }
    return { success: true, data }
}
```

### Pattern 2: Conditional Editor UI Based on Purchase Status
**What:** The editor page currently has no concept of "purchased" projects. To conditionally show Redeploy vs Approve, the editor needs to know if the loaded project has a paid claim.
**When to use:** When loading a project in the editor, check for a paid claim.
**Example:**
```typescript
// Inside editor's handleSelectProject or project loading logic
async function checkPurchaseStatus(projectId: string): Promise<{ isPurchased: boolean; claimId?: string; clientName?: string }> {
    const supabase = createAdminClient()
    const { data: claim } = await supabase
        .from('claims')
        .select('id, client_name, status')
        .eq('project_id', projectId)
        .in('status', ['paid', 'customizing', 'completed'])
        .limit(1)
        .single()

    return {
        isPurchased: !!claim,
        claimId: claim?.id,
        clientName: claim?.client_name ?? undefined,
    }
}
```

### Pattern 3: Sidebar Nav Extension
**What:** The sidebar nav in `components/dashboard/sidebar-nav.tsx` uses a static `sections` array with `{ label, items: [{ title, href, icon }] }` structure. Adding a "Clients" tab is a one-line array addition.
**When to use:** Adding the Clients nav item.
**Example:**
```typescript
// Add to the "Manage" section or create a new "Fulfillment" section
{
    label: "Fulfillment",
    items: [
        { title: "Clients", href: "/dashboard/clients", icon: Users },
    ],
}
```

### Pattern 4: Redeploy as Wrapped updateProjectWithCode
**What:** The existing `updateProjectWithCode()` in `lib/ai/project-persistence.ts` already handles: (1) snapshot current code as revision, (2) increment version, (3) update generated_code. Redeploy wraps this with additional steps: mark in-progress requests as completed and revalidate portal paths.
**When to use:** Redeploy button action.
**Example:**
```typescript
export async function redeployProject(projectId: string, adminNotes?: string) {
    const { updateProjectWithCode } = await import('@/lib/ai/project-persistence')
    const supabase = createAdminClient()

    // 1. Get current generated_code from the project (editor may have modified it)
    const { data: project } = await supabase
        .from('projects')
        .select('generated_code')
        .eq('id', projectId)
        .single()

    if (!project?.generated_code) {
        return { success: false, error: 'No code to deploy' }
    }

    // 2. Save + version bump + revision snapshot (existing function)
    const result = await updateProjectWithCode(projectId, project.generated_code)
    if (!result.success) return result

    // 3. Optionally auto-complete in-progress requests
    // (Claude's discretion -- recommend auto-complete)
    await supabase
        .from('client_requests')
        .update({
            status: 'completed',
            admin_notes: adminNotes || 'Completed via redeploy',
        })
        .eq('project_id', projectId)
        .eq('status', 'in_progress')

    // 4. Update project status to 'deployed' (not 'review')
    await supabase
        .from('projects')
        .update({ status: 'deployed', updated_at: new Date().toISOString() })
        .eq('id', projectId)

    revalidatePath('/dashboard/clients')
    revalidatePath(`/editor?id=${projectId}`)

    return { success: true }
}
```

### Anti-Patterns to Avoid
- **Fetching claim data in every editor render:** Check purchase status once when a project is loaded, not on every re-render. Store in state.
- **Separate redeploy persistence logic:** Do NOT duplicate the version-bump + revision-snapshot logic. Always call `updateProjectWithCode()` and layer additional behavior around it.
- **Direct Supabase queries from client components:** All admin data flows through server actions. The editor is a client component, so it calls server actions for data.
- **Hard-coding client statuses in the UI:** Use the same `STATUS_STYLES` pattern from `components/portal/request-card.tsx` -- a const map, not inline conditionals.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version snapshots | Custom versioning | `updateProjectWithCode()` from `lib/ai/project-persistence.ts` | Already handles snapshot + increment + update atomically |
| Request type/status labels | Inline label maps | Shared `TYPE_LABELS` and `STATUS_STYLES` constants | Already defined in `components/portal/request-card.tsx`; extract and share |
| Date formatting | Custom date helpers | `date-fns` format/formatDistanceToNow | Already used throughout the codebase |
| Filter dropdowns | Custom select UI | shadcn DropdownMenu | Matches existing history-sidebar pattern exactly |
| Confirmation dialogs | Custom modal | shadcn Dialog | Already used for delete confirmation and outreach modal in editor |
| Toast notifications | Custom alert system | `sonner` toast | Already configured in admin layout |

**Key insight:** Phase 15 is pure integration work. Every building block exists. The value is in wiring them together correctly, not building new primitives.

## Common Pitfalls

### Pitfall 1: updateProjectWithCode Sets Status to 'review'
**What goes wrong:** `updateProjectWithCode()` hardcodes `status: 'review'` in its update. For redeploy, we want `status: 'deployed'`.
**Why it happens:** The function was designed for the generation/revision flow, not deployment.
**How to avoid:** After calling `updateProjectWithCode()`, immediately update the status to `'deployed'` in a separate query. Do NOT modify `updateProjectWithCode()` -- it's used by the generation pipeline.
**Warning signs:** Redeployed projects showing up as "Review" instead of "Deployed" in the dashboard.

### Pitfall 2: Editor Page is Client-Side Only
**What goes wrong:** The editor (`app/(admin)/editor/page.tsx`) is a `"use client"` component. It loads project data via the `getProjectById` server action called from `useEffect`. You cannot use server-side data fetching patterns (like Supabase server client) directly in the editor.
**Why it happens:** The editor was built as a fully client-side SPA-like experience for real-time code editing.
**How to avoid:** All new data fetching (claim status check, client requests list) must be via server actions called from the editor client component. Add a `getProjectClaimAndRequests(projectId)` server action that returns both in one call.
**Warning signs:** Import errors from using `cookies()` or server-only APIs in the editor page.

### Pitfall 3: Supabase Join Syntax for Count Aggregation
**What goes wrong:** Supabase PostgREST does not support `COUNT(*)` in embedded selects directly. You can't do `client_requests(count)` to get the number of open requests.
**Why it happens:** PostgREST limitation -- embedded resources return arrays, not aggregates.
**How to avoid:** Fetch client_requests as an array in the join and count client-side: `data.client_requests.filter(r => r.status !== 'completed').length`. Alternatively, use an RPC function for the count, but client-side counting is simpler for the expected data volumes (< 50 requests per client).
**Warning signs:** Empty or null request counts despite requests existing in the database.

### Pitfall 4: Stale Editor State After Server Action
**What goes wrong:** Calling a server action (like `updateRequestStatus`) from the editor doesn't automatically update the client-side React state.
**Why it happens:** Server actions with `revalidatePath` only revalidate server component pages. The editor is a client component that manages its own state.
**How to avoid:** After the server action succeeds, optimistically update the local request list state (same pattern used in `customize-client.tsx` for portal requests). Refetch only on error.
**Warning signs:** Status badges not updating after clicking Start/Complete until manual page refresh.

### Pitfall 5: Editor Query Param Context
**What goes wrong:** The editor uses `?id=` search params to load a project. When navigating from `/dashboard/clients/[id]` to the editor, the link must include the project ID as a query param.
**Why it happens:** The editor doesn't use dynamic route segments -- it reads from `useSearchParams().get('id')`.
**How to avoid:** The "Edit Site" button on the client detail page must link to `/editor?id={project_id}`, not `/editor/{project_id}`.
**Warning signs:** Editor loads with no project data after clicking "Edit Site" from the client detail page.

### Pitfall 6: Claim Status Filtering for "Active" Clients
**What goes wrong:** Querying claims with only `status = 'paid'` misses clients in later stages.
**Why it happens:** Claims move through statuses: `paid -> customizing -> completed`.
**How to avoid:** Always filter with `.in('status', ['paid', 'customizing', 'completed'])` for active clients, matching the portal's own query pattern in `(portal)/portal/(dashboard)/layout.tsx`.
**Warning signs:** Clients disappearing from the list after admin starts working on their site.

## Code Examples

### Server Action: Get Purchased Clients with Request Counts
```typescript
// app/(admin)/dashboard/clients/actions.ts
"use server"
import { createAdminClient } from '@/lib/supabase/admin'

interface ClientListItem {
    claimId: string
    projectId: string
    businessName: string
    clientName: string | null
    clientEmail: string | null
    plan: 'standard' | 'pro'
    paidAt: string | null
    slug: string | null
    openRequestCount: number
    totalRequestCount: number
    projectVersion: number
    projectUpdatedAt: string
}

export async function getClients(filters?: {
    status?: string
    plan?: string
}): Promise<{ success: boolean; data?: ClientListItem[]; error?: string }> {
    const supabase = createAdminClient()

    const { data: claims, error } = await supabase
        .from('claims')
        .select(`
            id, project_id, plan, status, client_name, client_email, paid_at,
            projects!inner(id, business_data, slug, version, updated_at)
        `)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('paid_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    if (!claims) return { success: true, data: [] }

    // Fetch all requests for these projects in one query
    const projectIds = claims.map(c => c.project_id)
    const { data: requests } = await supabase
        .from('client_requests')
        .select('id, project_id, status')
        .in('project_id', projectIds)

    const requestsByProject = new Map<string, typeof requests>()
    for (const r of requests ?? []) {
        const existing = requestsByProject.get(r.project_id) ?? []
        existing.push(r)
        requestsByProject.set(r.project_id, existing)
    }

    const clients: ClientListItem[] = claims.map(claim => {
        const project = claim.projects as any
        const bd = project?.business_data as Record<string, unknown>
        const reqs = requestsByProject.get(claim.project_id) ?? []

        return {
            claimId: claim.id,
            projectId: claim.project_id,
            businessName: (bd?.businessName as string) ?? 'Unknown Business',
            clientName: claim.client_name,
            clientEmail: claim.client_email,
            plan: claim.plan,
            paidAt: claim.paid_at,
            slug: project?.slug ?? null,
            openRequestCount: reqs.filter(r => r.status !== 'completed').length,
            totalRequestCount: reqs.length,
            projectVersion: project?.version ?? 1,
            projectUpdatedAt: project?.updated_at ?? claim.paid_at ?? '',
        }
    })

    // Apply client-side filters (plan filter can also be done in query)
    let filtered = clients
    if (filters?.plan) {
        filtered = filtered.filter(c => c.plan === filters.plan)
    }

    return { success: true, data: filtered }
}
```

### Server Action: Update Request Status
```typescript
// In the same actions.ts
export async function updateRequestStatus(
    requestId: string,
    newStatus: 'in_progress' | 'completed',
    adminNotes?: string
) {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'completed' && adminNotes) {
        updateData.admin_notes = adminNotes
    }

    const { error } = await supabase
        .from('client_requests')
        .update(updateData)
        .eq('id', requestId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/clients')
    return { success: true }
}
```

### Editor: Conditional Approve vs Redeploy
```typescript
// Conditional rendering in editor toolbar area (line ~1176 of editor/page.tsx)
{isPurchasedProject ? (
    <Button
        onClick={() => setIsRedeployDialogOpen(true)}
        disabled={!generatedCode}
        size="sm"
        className="h-8 text-[10px] uppercase tracking-wider gap-2 px-3 transition-all bg-blue-600 hover:bg-blue-700 text-white font-bold border-none shadow-md shadow-blue-100"
    >
        <Rocket className="h-3 w-3" />
        Redeploy
    </Button>
) : (
    <Button
        onClick={handleApprove}
        disabled={!generatedCode}
        size="sm"
        className="h-8 text-[10px] uppercase tracking-wider gap-2 px-3 transition-all bg-green-600 hover:bg-green-700 text-white font-bold border-none shadow-md shadow-green-100"
    >
        <Check className="h-3 w-3" />
        Approve
    </Button>
)}
```

### Sidebar Nav Addition
```typescript
// components/dashboard/sidebar-nav.tsx -- add to sections array
{
    label: "Fulfillment",
    items: [
        { title: "Clients", href: "/dashboard/clients", icon: Users },
    ],
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All projects in one dashboard view | Separate Clients view for purchased projects | Phase 15 | Clean separation of generated vs purchased projects |
| Approve button always visible | Conditional Approve/Redeploy based on purchase status | Phase 15 | Different workflow for purchased vs generated projects |
| No request queue in editor | Customer Requests tab in editor sidebar | Phase 15 | Admin can see and manage requests while editing |

**No deprecated/outdated patterns in this phase.** All work builds on established patterns.

## Open Questions

1. **Client detail page vs editor: where does request management live?**
   - What we know: CONTEXT.md says both the client detail page AND the editor have request management. Client detail page shows the full request list, editor has a "Customer Requests" tab.
   - What's unclear: Should status transitions (Start/Complete) be available in BOTH places, or only in the editor?
   - Recommendation: Available in both. The client detail page is for triage, the editor is for active work. Both call the same server action.

2. **How to determine "status" for the client list card badges**
   - What we know: CONTEXT.md says filter by "Pending Customization, In Progress, Delivered" but these don't match claim statuses directly.
   - What's unclear: Is this a derived status based on request states?
   - Recommendation: Derive from requests: "Pending Customization" = has pending requests + no in_progress; "In Progress" = has at least one in_progress request; "Delivered" = all requests completed (or no requests). This maps to the fulfillment workflow, not the claim status.

3. **Auto-complete in-progress requests on redeploy (Claude's discretion)**
   - Recommendation: Auto-complete. The redeploy IS the delivery of the work. Keeping requests open after deploying the changes creates cognitive overhead with no benefit. Admin can always add notes before redeploying.

4. **Request tab display: chronological vs grouped-by-status (Claude's discretion)**
   - Recommendation: Grouped by status with chronological order within groups. Show "In Progress" first (active work), then "Pending" (next up), then "Completed" (done, collapsed). This matches a Kanban mental model without the visual overhead.

5. **"Updated on [date]" in portal (Claude's discretion)**
   - Recommendation: Add the `projects.updated_at` timestamp to the portal dashboard's site status area. Format as "Last updated [relative time]" (e.g., "Last updated 2 hours ago"). The portal layout already fetches `project.version` and `project.updated_at` -- just display it.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `components/dashboard/sidebar-nav.tsx` -- sidebar nav structure and pattern
- Codebase analysis: `app/(admin)/editor/page.tsx` -- editor page architecture, approve button location (line 1176), sidebar panel pattern
- Codebase analysis: `lib/ai/project-persistence.ts` -- `updateProjectWithCode()` function signature, versioning logic, revision snapshots
- Codebase analysis: `app/(admin)/dashboard/actions.ts` -- server action patterns, `approveProject()` as the function to conditionally replace
- Codebase analysis: `types/database.ts` -- `client_requests`, `claims`, `projects` type definitions with all columns
- Codebase analysis: `supabase/migrations/20260325000001_create_client_requests.sql` -- table structure, RLS policies, indexes
- Codebase analysis: `app/api/portal/requests/route.ts` -- client_requests JSONB content structure: `{ description, file_urls, ...metadata }`
- Codebase analysis: `components/portal/request-card.tsx` -- TYPE_LABELS and STATUS_STYLES constants (reusable in admin)
- Codebase analysis: `app/(portal)/portal/(dashboard)/layout.tsx` -- portal data fetching pattern showing claim status filter `['paid', 'customizing', 'completed']`

### Secondary (MEDIUM confidence)
- Codebase analysis: `app/(admin)/dashboard/funnel/page.tsx` -- server component page pattern for admin views with data fetching

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero new packages, all existing patterns
- Architecture: HIGH - extends existing admin dashboard and editor with well-understood patterns
- Pitfalls: HIGH - all identified from direct codebase analysis, especially the `updateProjectWithCode` status override and client-side editor state management

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- pure codebase integration, no external API dependencies)
