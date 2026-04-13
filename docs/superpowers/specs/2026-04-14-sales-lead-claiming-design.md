# Sales Lead Claiming & Portal Refinement

**Date:** 2026-04-14
**Status:** Approved
**Author:** Claude + Vicky

## Problem

The Sales CRM currently shows all leads to all salespeople in a shared pool with no ownership. When one salesperson starts working a lead, others don't know and may duplicate effort. We need a claiming mechanism so salespeople can take ownership of leads, and others can see which leads are taken.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Domain separation | Separate path (`/sales`) | Already wired, simplest option, no infra changes |
| Claiming mechanism | Click-to-claim with atomic UPDATE | Race-safe, no new tables, fits existing `projects` pattern |
| Post-claim visibility | Visible but locked | Full transparency — everyone sees who claimed what, grayed out |
| Lead source | All review/approved projects | Every generated project enters the sales pool automatically |
| Leads page layout | Tabbed pool (Available / My Leads) | Clean mental model, user-selected from mockup |

## Design

### 1. Database Changes

**Migration: `20260414000001_add_lead_claiming.sql`**

Add two columns to the `projects` table:

```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_claimed_by
  ON projects(claimed_by) WHERE claimed_by IS NOT NULL;
```

- `claimed_by IS NULL` means the lead is unclaimed and available
- The atomic claim query prevents race conditions:
  ```sql
  UPDATE projects SET claimed_by = :userId, claimed_at = now()
  WHERE id = :projectId AND claimed_by IS NULL
  ```
  If another salesperson claimed it between page load and click, the UPDATE affects 0 rows and we return an error.

**TypeScript types:** Add `claimed_by: string | null` and `claimed_at: string | null` to the projects type in `types/database.ts`.

### 2. Server Actions

**File: `app/(sales)/sales/actions.ts`**

Add two new actions:

#### `claimLead(projectId: string)`
- Calls `requireSales()` to get `userId`
- Runs atomic UPDATE: `SET claimed_by = userId, claimed_at = now() WHERE id = projectId AND claimed_by IS NULL`
- If 0 rows affected: return `{ error: "Lead already claimed by another salesperson" }`
- If success: `revalidatePath('/sales/leads')`, return `{ success: true }`

#### `unclaimLead(projectId: string)`
- Calls `requireSales()` to get `{ userId, isAdmin }`
- If admin: can unclaim any lead (releases it back to pool)
- If salesperson: can only unclaim their own leads (`WHERE claimed_by = userId`)
- Sets `claimed_by = NULL, claimed_at = NULL`
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
- **`available` (default):** `status IN ('review', 'approved')` — returns ALL leads (unclaimed + claimed-by-others). Unclaimed leads have `claimed_by IS NULL`. Claimed leads show the claimer's info.
- **`mine`:** `status IN ('review', 'approved') AND claimed_by = userId` — only leads claimed by the current user.

Add to the return type:
```typescript
interface SalesLeadRow {
  // ... existing fields ...
  claimedBy: string | null       // NEW — user ID of claimer
  claimedByEmail: string | null  // NEW — resolved email for display
  claimedAt: string | null       // NEW
}
```

Add count queries for tab badges:
```typescript
export const getLeadCounts = cache(async (userId: string) => {
  // available = unclaimed leads (status in review/approved AND claimed_by IS NULL)
  // mine = claimed by this user
  return { available: number, mine: number }
})
```

### 4. Leads Page Redesign

**File: `app/(sales)/sales/leads/page.tsx`**

Replace the current single-list page with a tabbed layout:

- Two tabs: **"Available"** and **"My Leads"**
- Tab state driven by `?tab=available|mine` URL parameter (default: `available`)
- Each tab shows its count as a badge

**Available tab:**
- Shows all review/approved projects
- Unclaimed leads: green "Claim" button in the last column
- Claimed-by-others: row at 45% opacity, claimer's name/email in the last column instead of a button
- Sorted by `created_at DESC` (newest first)

**My Leads tab:**
- Shows only leads where `claimed_by = currentUser.id`
- Each row has an "Open" button linking to `/sales/leads/[id]`
- Sorted by `sales_next_followup_at ASC NULLS LAST, sales_last_contact_at ASC NULLS LAST`

**Claim interaction:**
- "Claim" button calls `claimLead(projectId)` server action
- On success: page revalidates, lead moves from Available (unclaimed) to My Leads
- On error (already claimed): toast "Lead already claimed by another salesperson", page revalidates to show updated state

**File: `app/(sales)/sales/leads/leads-filter-bar.tsx`**

Add tab switching as a new component or extend the existing filter bar with tab buttons above the filters.

### 5. Lead Detail Page Changes

**File: `app/(sales)/sales/leads/[id]/page.tsx`**

Minimal changes:
- Add a badge showing claim status: "Claimed by: You" (green) or "Claimed by: Ravi K." (gray)
- If the lead is unclaimed and the user navigates here directly (deep link), show a "Claim this lead" CTA at the top of the right column, above the call logging form
- Call logging should still work regardless of claim status (in case admin needs to log a call on someone else's lead)

### 6. Followups Page Update

**File: `app/(sales)/sales/followups/page.tsx`**

Update the query to only show followups for leads claimed by the current user:
```sql
WHERE claimed_by = :userId
  AND sales_next_followup_at IS NOT NULL
```

This prevents salespeople from seeing followup reminders for leads they don't own.

### 7. Dashboard Overview Update

**File: `app/(sales)/sales/page.tsx`**

Update "Today's follow-ups" section to only show followups for the current user's claimed leads (same filter as followups page).

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
| `supabase/migrations/20260414000001_add_lead_claiming.sql` | NEW — `claimed_by`, `claimed_at` columns + index |
| `types/database.ts` | Add `claimed_by`, `claimed_at` to projects type |
| `app/(sales)/sales/actions.ts` | Add `claimLead()`, `unclaimLead()` actions |
| `lib/sales/get-leads.ts` | Add `tab`/`userId` filter, `claimedBy` fields, `getLeadCounts()` |
| `app/(sales)/sales/leads/page.tsx` | Tabbed layout (Available / My Leads) with claim buttons |
| `app/(sales)/sales/leads/leads-filter-bar.tsx` | Add tab switching UI |
| `app/(sales)/sales/leads/[id]/page.tsx` | Claim status badge, "Claim this lead" CTA for unclaimed |
| `app/(sales)/sales/followups/page.tsx` | Filter by `claimed_by = userId` |
| `app/(sales)/sales/page.tsx` | Filter today's followups by claimed leads |

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bulk claiming | One-at-a-time is sufficient for current team size |
| Claim expiry / auto-release | Can add later if leads go stale |
| Claim transfer between salespeople | Admin can unclaim + other person claims |
| Notification on claim | Sonner toast is sufficient, no push notifications |
| Lead scoring / priority sorting | Future enhancement, not part of claiming |

## Success Criteria

1. Salesperson can see unclaimed leads in the Available tab and claim one with a single click
2. After claiming, the lead appears in "My Leads" tab and shows as locked (grayed, with claimer name) to others in Available
3. Two salespeople clicking "Claim" on the same lead simultaneously — only one succeeds, the other gets an error toast
4. Followups page only shows followups for the salesperson's own claimed leads
5. Admin can unclaim any lead to release it back to the pool
