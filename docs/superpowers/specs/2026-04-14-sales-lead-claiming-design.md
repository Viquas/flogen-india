# Sales Lead Claiming & Portal Refinement

**Date:** 2026-04-14
**Status:** Approved
**Author:** Claude + Vicky

## Problem

The Sales CRM currently shows all leads to all salespeople in a shared pool with no ownership. When one salesperson starts working a lead, others don't know and may duplicate effort. We need an assignment mechanism so salespeople can take ownership of leads, and others can see which leads are taken.

## Naming Disambiguation

The word "claim" is already used in this codebase for the **client claim flow** (`claims` table, `/claim/[slug]` route, Razorpay payment). To avoid confusion, this spec uses **"assign"** for salesperson lead ownership:

- `projects.assigned_to` — salesperson who owns the lead
- `assignLead()` / `unassignLead()` — server actions
- "Assigned to: Ravi K." — UI labels

The existing `claims` table and client claim flow are completely unrelated and unchanged.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Domain separation | Separate path (`/sales`) | Already wired, simplest option, no infra changes |
| Assignment mechanism | Click-to-assign with atomic UPDATE | Race-safe, no new tables, fits existing `projects` pattern |
| Post-assign visibility | Visible but locked | Full transparency — everyone sees who owns what, grayed out |
| Lead source | All review/approved projects | Every generated project enters the sales pool automatically |
| Leads page layout | Tabbed pool (Available / My Leads) | Clean mental model, user-selected from mockup |

## Design

### 1. Database Changes

**Migration: `20260414000001_add_lead_assignment.sql`**

> **Ordering dependency:** This migration must run after `20260410000001_sales_crm.sql` which adds the `sales_*` columns to projects.

Add two columns to the `projects` table:

```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_assigned_to
  ON projects(assigned_to) WHERE assigned_to IS NOT NULL;
```

- `assigned_to IS NULL` means the lead is unassigned and available
- The atomic assignment query prevents race conditions:
  ```sql
  UPDATE projects SET assigned_to = :userId, assigned_at = now()
  WHERE id = :projectId AND assigned_to IS NULL
  ```
  If another salesperson assigned it between page load and click, the UPDATE affects 0 rows and we return an error.

**RLS note:** All reads and writes go through `createAdminClient()` (service role key), same pattern as existing sales queries. The anon key cannot read `assigned_to` directly. Do not use Supabase Realtime subscriptions on this column with the anon key.

**TypeScript types:** Add `assigned_to: string | null` and `assigned_at: string | null` to the projects Row/Insert/Update types in `types/database.ts`. Also add the five existing `sales_*` columns that are currently missing from the types (the code works around this with `as any` casts — this is the opportunity to fix it):
- `sales_status: string`
- `sales_last_contact_at: string | null`
- `sales_last_contact_by: string | null`
- `sales_call_count: number`
- `sales_next_followup_at: string | null`

### 2. Server Actions

**File: `app/(sales)/sales/actions.ts`**

Add two new actions:

#### `assignLead(projectId: string)`
- Calls `requireSales()` to get `{ userId, isAdmin }`
- Runs atomic UPDATE: `SET assigned_to = userId, assigned_at = now() WHERE id = projectId AND assigned_to IS NULL`
- If 0 rows affected: return `{ error: "Lead already assigned to another salesperson" }`
- If success: `revalidatePath('/sales/leads')`, return `{ success: true }`

#### `unassignLead(projectId: string)`
- Calls `requireSales()` to get `{ userId, isAdmin }`
- If admin: can unassign any lead (releases it back to pool)
- If salesperson: can only unassign their own leads (`WHERE assigned_to = userId`)
- Sets `assigned_to = NULL, assigned_at = NULL`
- Revalidates `/sales/leads`

### 3. Data Access Changes

**File: `lib/sales/get-leads.ts`**

Update `getSalesLeads()` to accept a new `tab` parameter:

```typescript
interface LeadFilters {
  tab?: 'available' | 'mine'  // NEW
  userId?: string              // NEW — required for 'mine' tab
  status?: SalesStatus[]
  search?: string
  industry?: string
  hasFollowup?: boolean
  limit?: number
}
```

Query logic by tab:
- **`available` (default):** `status IN ('review', 'approved')` — returns ALL leads (unassigned + assigned-by-others). Unassigned leads have `assigned_to IS NULL`. Assigned leads show the assignee's info.
- **`mine`:** `assigned_to = userId` with NO status filter — shows all leads assigned to the user regardless of pipeline status. This means a salesperson keeps seeing their lead even after it moves to `deployed` or other states, until explicitly unassigned.

Add to the return type:
```typescript
interface SalesLeadRow {
  // ... existing fields ...
  assignedTo: string | null       // NEW — user ID of assignee
  assignedToEmail: string | null  // NEW — resolved email for display
  assignedAt: string | null       // NEW
}
```

Add separate count queries for tab badges (two independent cached functions — not bundled):
```typescript
export const getAvailableCount = cache(async () => {
  // COUNT where status IN ('review','approved') AND assigned_to IS NULL
  return number
})

export const getMyLeadCount = cache(async (userId: string) => {
  // COUNT where assigned_to = userId
  return number
})
```

These are separate from `getSalesLeads` and will each make their own DB round-trip. This is intentional — React `cache()` deduplicates by reference identity, so bundling them with the main query would not save round-trips and would add complexity.

**Also update `getLeadDetail()`:** Add `assigned_to, assigned_at` to the select list and populate `assignedTo`, `assignedToEmail`, `assignedAt` fields on the return object. Resolve `assignedToEmail` the same way `salesLastContactByEmail` is resolved (via the email map lookup).

**Also update `getSalesMetrics()`:** The `todaysFollowups` query must add `.eq('assigned_to', userId)` to only show followups for leads the user owns. This changes the existing behavior (currently shows all team followups) to match the spec intent.

### 4. Leads Page Redesign

**File: `app/(sales)/sales/leads/page.tsx`**

Replace the current single-list page with a tabbed layout:

- Two tabs: **"Available"** and **"My Leads"**
- Tab state driven by `?tab=available|mine` URL parameter (default: `available`)
- **Available badge:** shows count of UNASSIGNED leads only (not total rows in tab). This tells the salesperson "how many leads can I grab right now?"
- **My Leads badge:** shows count of leads assigned to the current user

**Available tab:**
- Shows all review/approved projects (both unassigned AND assigned-by-others)
- Unassigned leads: green "Assign to me" button in the last column
- Assigned-by-others: row at 45% opacity, assignee's name/email in the last column instead of a button
- Sorted by `created_at DESC` (newest first)

**My Leads tab:**
- Shows all leads where `assigned_to = currentUser.id` (any status — not filtered by review/approved)
- Each row has an "Open" button linking to `/sales/leads/[id]`
- Sorted by `sales_next_followup_at ASC NULLS LAST, sales_last_contact_at ASC NULLS LAST`

**Assign interaction:**
- "Assign to me" button calls `assignLead(projectId)` server action
- On success: page revalidates, lead moves from Available (unassigned) to My Leads
- On error (already assigned): toast "Lead already assigned to another salesperson", page revalidates to show updated state

**File: `app/(sales)/sales/leads/leads-filter-bar.tsx`**

Add tab switching as a new component or extend the existing filter bar with tab buttons above the filters.

### 5. Lead Detail Page Changes

**File: `app/(sales)/sales/leads/[id]/page.tsx`**

Changes:
- Add a badge showing assignment status:
  - Assigned to current user: "Assigned to: You" (green badge)
  - Assigned to someone else: "Assigned to: Ravi K." (gray badge)
  - Unassigned: "Unassigned" (neutral badge) + "Assign to me" CTA button
- If the lead is unassigned (no `assigned_to`), show an "Assign to me" CTA at the top of the right column, above the call logging form
- If the lead is assigned to someone else, show the badge but no assign button
- Call logging should still work regardless of assignment status (in case admin needs to log a call on someone else's lead)

### 6. Followups Page Update

**File: `app/(sales)/sales/followups/page.tsx`**

Update the query to only show followups for leads assigned to the current user:
```sql
WHERE assigned_to = :userId
  AND sales_next_followup_at IS NOT NULL
```

**Behavioral note:** This changes from the current filter (`sales_last_contact_by = userId`) to `assigned_to = userId`. This means if a salesperson logs a call on an unassigned lead, they will NOT see the follow-up in their Followups page — they need to assign the lead first. This is intentional: the Followups page is for "my pipeline," not "calls I happened to make."

### 7. Dashboard Overview Update

**File: `app/(sales)/sales/page.tsx`**
**File: `lib/sales/get-leads.ts` (`getSalesMetrics` function)**

Update "Today's follow-ups" section to only show followups for the current user's assigned leads. This requires modifying `getSalesMetrics()` to accept `userId` for the followups query and add `.eq('assigned_to', userId)` to the followups subquery.

"My calls today/week" and "My conversions" already filter by `salesperson_id` in call_logs, so those remain accurate.

### 8. What Stays The Same

- `/sales-login` — no changes
- Sales sidebar navigation — no changes (Overview, Leads, Followups, Team)
- Team page — no changes
- Call logging form and `logCall` action — no changes
- `sync_project_sales_state` trigger — no changes
- Admin dashboard — completely unaffected
- Proxy route protection — no changes

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260414000001_add_lead_assignment.sql` | NEW — `assigned_to`, `assigned_at` columns + index |
| `types/database.ts` | Add `assigned_to`, `assigned_at` + fix missing `sales_*` columns on projects type |
| `app/(sales)/sales/actions.ts` | Add `assignLead()`, `unassignLead()` actions |
| `lib/sales/get-leads.ts` | Add `tab`/`userId` filter, `assignedTo` fields, `getAvailableCount()`, `getMyLeadCount()`, update `getLeadDetail()` select, update `getSalesMetrics()` followups filter |
| `app/(sales)/sales/leads/page.tsx` | Tabbed layout (Available / My Leads) with assign buttons |
| `app/(sales)/sales/leads/leads-filter-bar.tsx` | Add tab switching UI |
| `app/(sales)/sales/leads/[id]/page.tsx` | Assignment status badge, "Assign to me" CTA for unassigned |
| `app/(sales)/sales/followups/page.tsx` | Filter by `assigned_to = userId` |
| `app/(sales)/sales/page.tsx` | Filter today's followups by assigned leads |

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bulk assignment | One-at-a-time is sufficient for current team size |
| Assignment expiry / auto-release | Can add later if leads go stale |
| Assignment transfer between salespeople | Admin can unassign + other person assigns |
| Notification on assignment | Sonner toast is sufficient, no push notifications |
| Lead scoring / priority sorting | Future enhancement, not part of assignment |

## Success Criteria

1. Salesperson can see unassigned leads in the Available tab and assign one to themselves with a single click
2. After assigning, the lead appears in "My Leads" tab and shows as locked (grayed, with assignee name) to others in Available
3. Two salespeople clicking "Assign to me" on the same lead simultaneously — only one succeeds, the other gets an error toast
4. Followups page only shows followups for the salesperson's own assigned leads
5. Admin can unassign any lead to release it back to the pool
6. Lead detail page shows assignment status badge and "Assign to me" CTA when unassigned
