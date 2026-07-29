# PRD — Lead Lists: Month / Week / Day Views

**Status:** Approved (implementing)
**Date:** 2026-07-10
**Page:** `/dashboard/leads` (admin dashboard)

## Problem

The Lead Lists page only shows one day of discovery batches at a time. To see what
was pulled this week or this month, you have to click through the date picker one
day at a time. There is no way to spot volume trends, find which days have
un-worked leads, or jump to a busy day.

## Goal

Add a **Day / Week / Month** view selector with a proper view for each timeframe,
plus fast range navigation (prev / next / today), so the page works as both a
daily worklist and a discovery-volume overview.

## Non-Goals

- No changes to lead discovery, generation, or outreach flows.
- No changes to the sales CRM leads page (`/sales/leads`) — this is admin-only.
- No new DB tables or migrations — read-only aggregation over `lead_lists`.
- No per-lead pagination inside a batch (batches are already bounded).

## URL Contract

```
/dashboard/leads?view=day|week|month&date=YYYY-MM-DD&pool=website|automation
```

- `view` — defaults to `day` (preserves existing behavior and old links).
- `date` — anchor date, defaults to today. Week = ISO week (Mon–Sun) containing
  the anchor; Month = calendar month containing the anchor.
- `pool` — unchanged (`website` default, `automation`).
- All state lives in the URL: shareable links, working back button.

## Views

### Day (default, existing behavior)
- Batch cards with full lead tables, exactly as today.
- Website filter (All / With / Without website) applies.

### Week
- Range label: e.g. `6 – 12 Jul 2026`.
- **Week strip**: 7 mini day-cards (Mon–Sun) showing weekday, date, and lead
  count. Clicking a day jumps to Day view for that date. Today is highlighted;
  the empty days are dimmed.
- Below the strip: the same batch cards as Day view, **grouped under day
  headings** (e.g. `Tuesday, 8 Jul — 3 batches · 74 leads`), newest day first.
- Website filter applies (counts in the strip reflect the unfiltered totals).

### Month
- Range label: e.g. `July 2026`.
- **Calendar grid** (Mon-start, 7 columns) — each day cell shows the day number
  and, when the day has data, lead count + batch count badges. Days outside the
  month are dimmed; today is outlined.
- Clicking any day navigates to Day view for that date.
- **Totals bar** above the grid: total leads, total batches, active days,
  busiest day for the month.
- The month query selects only light columns (`id, batch_id, created_at`) —
  no `raw_data` JSON — so a full month stays cheap.
- Website filter is hidden in Month view (no per-lead rows are loaded).

## Header Controls (all views)

- Segmented **Day | Week | Month** switcher.
- **‹ / › range navigation** stepping by 1 day / 1 week / 1 month, a **Today**
  button (hidden when already on the current period), and the existing date
  picker to jump to an arbitrary anchor date.
- Existing pool toggle unchanged; switching view/range/pool preserves the other
  params.

## Data & Performance

- Day/week: existing `select('*')` bounded to the range (7 days max) —
  acceptable at current volumes.
- Month: light-column select + server-side per-day aggregation; payload to the
  client is ~31 small objects regardless of lead volume.
- Range boundaries computed with `date-fns` (`startOfWeek {weekStartsOn: 1}`,
  `startOfMonth`, etc.).

## Known Limitations

- Day boundaries use the server timezone (UTC on Vercel), same as the current
  page — a lead scraped at 11:50 PM IST lands on the "next" UTC day. Accepted;
  fixing this is a separate task (would need a per-user TZ setting).

## Acceptance Criteria

1. `/dashboard/leads` with no params renders today's Day view identically to before.
2. Switcher toggles views; URL updates; back button restores the previous view.
3. Week view shows the 7-day strip with correct counts and day-grouped batches.
4. Month view shows a correct calendar (first day in the right weekday column),
   per-day counts, and totals; clicking a day opens that day in Day view.
5. Prev/next/Today navigate correctly in every view, preserving `pool`.
6. Website filter works in Day and Week views and is hidden in Month view.
7. Empty states: each view has a sensible "no leads in this <period>" message.
8. `npm run build` passes; no new lint errors.
