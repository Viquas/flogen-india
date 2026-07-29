# PRD — Flogen Connected Pipeline: Build → Sales → Conversion

**Status:** v1 · 11 July 2026
**Supersedes nothing — extends** `prd-sales-targeting-platform.md` (Phases 1–4 largely built on `feat/sales-crm`)
**Inputs:** full codebase audit (pipeline connectivity, generation system, security) run 11 Jul 2026

---

## 1. Executive Summary

The audit found a pipeline whose two halves exist in opposite pools:

- **Website stream** has a working *bottom* of funnel (`/claim/[slug]` → Razorpay →
  `claims.paid_at` → rep notification → honest conversion metrics) but a **broken
  middle**: sales-discovered leads are promoted to `projects` with `status='lead'`
  and no `generated_code`, yet the outreach composer and deliverable card hand out
  `/claim/{slug}` links — a prospect clicking the emailed CTA sees "Your Website is
  Ready" over an empty iframe. There is **no path from a sales lead to generation**.
- **Automation stream** has a working *top* (`/pitch/[slug]` template page, view/CTA
  tracking, "Let's do it" interest capture, rep notifications) but **no deliverable
  and no bottom**: pitch content is a static 15-niche template library
  ([lib/pitch-content.ts](../lib/pitch-content.ts)), there is no custom plan, no
  presentation artifact, no payment path, and automation closes are structurally
  invisible in metrics (ground truth is `claims.paid_at`, which automation never touches).

This PRD connects the two streams end to end, adds the missing deliverables
(**custom automation plan + PDF presentation per business**, and a **website-stream
presentation**), closes the missing feedback loops, and remediates the security
findings.

## 2. Current-State Map (audit result)

```
Discovery (rep)  →  lead_lists  →  projects(status='lead')  →  /sales/leads workspace
   /sales/discover     dedup place_id    pool, niche_score,        intent-ranked via
   Google Places                          pitch_angle, assigned_to  interests/outreach/pitch_events

Outreach  →  outreach_messages  →  open/click tracking  →  notifications (Realtime bell)
   Gmail SMTP     suppression gate      /api/track/*             notifyProjectRep

WEBSITE POOL:    /claim/[slug] → Razorpay webhook → claims.paid_at → metrics   ✅ bottom
                 …but no generation step for status='lead' projects            ❌ middle

AUTOMATION POOL: /pitch/[slug] (static template) → interests → notification    ✅ top
                 …then dead-ends: no plan, no presentation, no close path      ❌ bottom
```

### Confirmed gaps (with file refs)

| # | Gap | Where |
|---|-----|-------|
| G1 | No lead→generation path; claim links go out for ungenerated sites | `deliverable-card.tsx:18`, `claim/[slug]/page.tsx:105` |
| G2 | Admin generate route **forks a duplicate project** (loses `lead_list_id`, `pool`, `assigned_to`; fabricates placeholder content) | `app/api/leads/[id]/generate/route.ts:29` |
| G3 | No automation deliverable: pitch = static copy, 15 hardcoded niches, zero AI | `lib/pitch-content.ts`, `lib/lead-scoring.ts` |
| G4 | No PDF/presentation capability anywhere (puppeteer exists for screenshots only) | `lib/screenshot.ts` |
| G5 | `audit_signals` never copied `lead_lists` → `projects`; plan generator would lose its evidence | `lib/lead-discovery.ts:118-152` |
| G6 | `interests` contact details (email/phone/preferred time) never shown on lead detail | `app/(sales)/sales/leads/[id]/page.tsx` |
| G7 | `territories` + `discovery_jobs` are dead schema (zero app references) | migration `20260706000001:19-47` |
| G8 | Admin discovery never promotes; `promoteOrphanedLeads` has no caller | `lib/lead-discovery.ts:160` |
| G9 | Leads have no email (Places doesn't return one) and no enrichment step | `lib/lead-discovery.ts:97` |

### Loop inventory

**Working loops:** email open → notif; CTA click → notif; pitch first-view → notif;
interest submit → notif; claim paid → notif + metrics.

**Missing loops (this PRD closes L1–L5):**

| # | Missing loop | Close it with |
|---|--------------|---------------|
| L1 | Site/plan generated → rep never notified | `deliverable_ready` notification on generation success |
| L2 | Engagement (open/click/view) → no follow-up scheduled | auto-set `sales_next_followup_at` via touch pathway when intent events land |
| L3 | Interest submitted → lead status unchanged, contact details buried | write an `interest` touch through `call_logs` pathway + show interests on lead detail (G6) |
| L4 | `claim_started` notification fires on **every** page render (spam) | first-view dedup, same pattern as pitch view |
| L5 | `payment.failed` → claim cancelled silently | `claim_failed` notification (abandoned-checkout signal) |
| L6 | No inbound reply capture (`direction='in'` never written) | P2 — Unibox-lite (unchanged from earlier PRD) |

## 3. Security Findings & Remediation (audit result)

**High:**
- **H1 — Unauthenticated cost-generating APIs** (`/api/leads/[id]/generate`, `/api/custom-build/from-url|from-data`, `/api/bulk-upload/generate-all`, `/api/generate/stream|process`, `/api/chat/refine`, `/api/leads/discover`): all use the service-role client with no auth → anyone can drain AI/Places spend and pollute the DB. **Fix: `requireAdmin()` guard on every one.**
- **H2 — Stored XSS on claim page**: `hero-section.tsx:55` renders AI/scraped `generated_code` with `sandbox="allow-scripts allow-same-origin"` (= no sandbox). **Fix: drop `allow-same-origin`** (preview page already does this correctly).
- **H3 — IDOR project export**: `/api/export/[projectId]` returns any project's source unauthenticated. **Fix: `requireAdmin()`.**
- **H4 — `supabase/.temp/` not gitignored** (contains pooler URL + project ref). **Fix: gitignore.**

**Medium:**
- **M1 — RLS `USING(true)` on `territories` + `discovery_jobs`** → anon key can read/write/delete. **Fix: migration to `USING(false)`** (all access is service-role behind `requireSales()`).
- **M2 — Notification/DB-write spam**: pitch actions accept raw `projectId` unauthenticated, unthrottled. **Fix (P1): per-IP rate limit + slug-scoped writes.**
- **M3 — Unauthenticated uploads** to arbitrary `claimId`. **Fix (P1): claim-session check.**
- **M4 — Cron guard fails open** when `CRON_SECRET` unset. **Fix: fail closed.**

**Verified OK:** Razorpay webhook (HMAC + timingSafeEqual + idempotency), proxy/middleware auth, all `(sales)` server actions gated by `requireSales()` + Zod, no leaked secrets.

## 4. Target Design — Two Complete Streams

### 4.1 Stream A: Website ("we already built it")

```
discover → promote(status='lead') → [SALES: Generate demo] → queue(job on SAME project)
        → generated_code + screenshot → deliverable_ready notif → outreach w/ tracked /claim link
        → claim view (deduped notif) → pre-payment contact capture → Razorpay → paid_at ✅
```

Changes: a sales-side **Generate** action that enqueues generation **on the promoted
project itself** (fixes G1/G2 — no fork; keeps `pool`, `assigned_to`, `lead_list_id`);
deliverable card shows generation state (none → queued → generating → ready + thumbnail)
and blocks sending claim links until ready.

### 4.2 Stream B: Automation ("we studied your business — here's your plan")

```
discover(+audit_signals) → promote(copies audit_signals) → [SALES: Generate plan]
        → AI plan job → projects.automation_plan (JSON) → presentation rendered from
          stream template → PDF export → deliverable_ready notif
        → outreach w/ tracked /pitch link (pitch page now renders the CUSTOM plan)
        → interest submit → L3 touch + status → call → close
```

**The automation plan** is the "flow we study" made concrete. Generated per business from:
`business_data` (name, category, rating, reviews, hours, photos), `audit_signals`
(booking/chat widgets, mobile, https, load time — G5 fixed so it reaches `projects`),
niche fit table, and `pitch_angle`.

**Plan JSON schema** (stored `projects.automation_plan`):

```jsonc
{
  "version": 1,
  "business_snapshot": { "summary": "...", "observed_flow": ["customer calls", "..."] },
  "bottlenecks": [ { "title": "...", "evidence": "...", "cost_estimate": "..." } ],
  "automations": [ {
      "name": "Missed-call text-back",
      "what_it_does": "...", "how_it_works": ["step", "..."],
      "tools": ["Twilio", "..."], "impact": "...", "effort_weeks": 1
  } ],
  "rollout": [ { "phase": 1, "weeks": "1-2", "items": ["..."] } ],
  "investment": { "setup_range": "...", "monthly_range": "...", "roi_narrative": "..." }
}
```

Generation: `job_type='automation_plan'` on the existing `queue_jobs` infra
(priority column pattern unchanged); executes `generatePlanViaAI()` using
`trackedGenerateText` (Gemini primary — retries/circuit-breaker/cost-tracking free)
with the Claude CLI worker able to claim high-value plan jobs exactly like site jobs.
Strict JSON output validated by Zod; invalid → retry (existing backoff).

### 4.3 Presentation system ("award-winning", per stream)

**Principle:** presentations are **server-rendered HTML decks** from hand-designed
templates (deterministic quality, zero AI cost at render) filled with per-lead data
(plan JSON / audit / screenshots). PDF export reuses the existing puppeteer +
`@sparticuz/chromium-min` path (`lib/screenshot.ts`) with `page.pdf()` — zero new deps —
uploaded to Supabase Storage next to screenshots.

- Route: `/pitch/[slug]/presentation` (automation) and `/claim/[slug]/presentation`
  (website) — 16:9 print-CSS pages (`@page { size: 297mm 167mm }`), also viewable
  in-browser as a scroll deck. Public but slug-gated (same exposure as pitch/claim).
- API: `POST /api/presentations/[projectId]` (admin/sales-gated) renders route →
  PDF → storage → `projects.presentation_url`.
- **Template registry** `lib/presentations/registry.ts`: template = deck definition
  keyed `(stream, niche_family)` with `generic` fallback. Niche families: trades /
  beauty / hospitality / health / generic (accent palette, imagery mood, tone per family).

**Automation deck (10 slides):** Cover (business name, their Places photo, "Automation
Growth Plan — prepared for X") → We studied your business (snapshot + observed flow
diagram) → What it's costing you (bottlenecks w/ evidence) → The plan (1 slide per
automation, max 3: what/how/tools/impact) → Rollout timeline → Investment & ROI →
Why us / proof → Next step (CTA + rep contact + QR to pitch page).

**Website deck (8 slides):** Cover → What we found on your current presence (audit
signals, or "no website found") → The rebuild (full-bleed screenshot of the generated
site) → Mobile view → What's included → Before/after or competitor context → Pricing +
claim window → Claim CTA + QR.

Design bar ("award-winning"): editorial typography (large display serif/sans pairing),
business's real Places photos full-bleed, one accent color per niche family,
consistent grid, data made visual (flow diagram, ROI bar), no clip-art, no lorem —
sections with missing data are **omitted** (CLAUDE.md rule), never faked.

### 4.4 Close path for automation (metrics honesty preserved)

v1: interest → call → rep sends a **payment link** created from the lead (reuse
`claims` with `kind='automation'`, amount set by rep within admin-configured bounds)
→ same Razorpay webhook → `claims.paid_at` → automation conversions finally count in
the existing ground-truth metrics. (Keeps the "no self-reported closes" invariant.)

## 5. Data Model Changes (one migration)

```sql
-- 20260711000001_connected_pipeline.sql
ALTER TABLE queue_jobs ADD COLUMN job_type text NOT NULL DEFAULT 'website';
ALTER TABLE projects
  ADD COLUMN audit_signals jsonb,
  ADD COLUMN automation_plan jsonb,
  ADD COLUMN plan_status text,            -- null|queued|generating|ready|failed
  ADD COLUMN presentation_url text;
ALTER TABLE claims ADD COLUMN kind text NOT NULL DEFAULT 'website';  -- 'website'|'automation'
-- RLS fix (M1)
DROP POLICY territories_all ON territories;
CREATE POLICY territories_service ON territories FOR ALL USING (false) WITH CHECK (false);
DROP POLICY discovery_jobs_all ON discovery_jobs;
CREATE POLICY discovery_jobs_service ON discovery_jobs FOR ALL USING (false) WITH CHECK (false);
```

(Live DB has migration drift — apply via SQL Editor per current process, then commit the file.)

## 6. Build Plan

**Phase 0 — Security hardening (same day)** ✅ implemented with this PRD
H1 guards, H2 sandbox fix, H3 guard, H4 gitignore, M4 fail-closed, M1 migration file.

**Phase 1 — Automation plan + presentations (the new deliverables)** ← core of this PRD
Migration §5; `lib/automation-plan/` (schema + prompt + `generatePlanViaAI`);
queue `job_type` branch; presentation registry + automation & website deck templates;
`/pitch/[slug]/presentation` + `/claim/[slug]/presentation`; PDF export API;
deliverable card upgrade (state machine + Generate buttons + presentation/PDF links);
pitch page upgraded to render the custom plan when present (falls back to template copy).

**Phase 2 — Stream A middle + loops**
Sales-side site generation on the same project (G1/G2); `deliverable_ready` (L1);
claim-view dedup (L4); interests on lead detail (L3/G6); engagement → follow-up (L2);
`claim_failed` notif (L5); copy `audit_signals` on promote (G5).

**Phase 3 — Close path + hygiene**
Automation payment links (`claims.kind`); admin discovery auto-promote or delete dead
schema (G7/G8); M2/M3 rate-limits; email enrichment button (G9, from earlier PRD P1).

## 7. Success Metrics

- **Stream completeness:** 100% of outreach CTA links point at a *ready* deliverable (today: ~0% for fresh website leads).
- **Automation stream revenue visible:** automation `claims.paid_at` > 0 (today structurally impossible).
- **Deliverable latency:** plan ready < 2 min from click (Gemini path), presentation PDF < 30 s.
- **Loop closure:** every intent event either notifies or schedules a follow-up; zero notification spam from claim views.
- **Security:** 0 unauthenticated cost-generating endpoints (today: 8).
