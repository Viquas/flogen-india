# Australia Pivot — Lead Engine, Generation Quality, AU Landing Page, Stripe Payments

**Date:** 2026-07-03
**Status:** Approved
**Author:** Claude + Vicky

## Problem

Flogen currently targets the Indian market end-to-end: Razorpay-only payments, INR/local pricing assumptions, an India-focused sales CRM, and a generation engine whose design/copy/image quality has known weak spots (template sameness, generic copy, weak images). We want to open a second market — Sydney, Australia — with two sellable offers instead of one:

1. **Websites** for businesses that don't have one (existing flow, new geography)
2. **AI automation** (missed-call text-back, AI booking, FAQ/quote bots) for businesses that *do* have a website but show signs of manual, leaky operations

Outreach will be multi-channel: cold email with a demo link, phone calls, and WhatsApp — worked by one person (the user's sister, based in Sydney) using the existing sales CRM (`call_logs`, `sales_status` on `projects`).

This is a pivot, not a replacement — the India pipeline, Razorpay flow, and existing `(admin)`/`(client)`/`(portal)`/`(marketing)`/`(sales)` route groups must keep working unchanged.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Lead engine | Extend `lead_lists`, don't fork | One discovery pipeline, two pools — avoids duplicated scraping/dedup logic |
| Two lead pools | `pool = 'website' \| 'automation'` on `lead_lists` | Website leads need "no site" filter; automation leads need a fit score instead |
| Automation lead scoring | Niche fit + audit signals + busy-ness, weighted score 0–100 | Turns a raw business list into a ranked, pitchable queue instead of a cold list |
| Website audit depth | Lightweight HTML fetch + signature scan (no headless browser) | Fast enough at bulk-scoring volume; no audit module existed before this |
| Starting geography | Sydney suburbs (CBD, Parramatta, Bondi, Chatswood, Newtown), expandable list | Sister is local — trust signal, and a bounded start set keeps discovery cost sane |
| Payment provider | New Stripe AU integration alongside existing Razorpay (not replacing it) | Razorpay checkout shows INR/foreign-gateway friction for AU cards; Stripe AU is the trusted local option |
| Payment merchant | Sister's ABN (sole trader) + Stripe Australia account | Local entity = local trust, no GST registration needed under $75k AUD turnover |
| Interim payment bridge | Stripe Payment Links live first, full claim-flow Stripe Checkout integration follows | Sales can start closing before the full checkout integration ships |
| Marketing page | New AU-targeted landing page (own route), not a copy-paste of the India/agency page | Different pricing currency, different positioning (Sydney-based, two offer lines), different trust elements |
| Generation quality fixes | Scoped to design variation, copy voice, and image selection — not a generator rewrite | These are the three problems named; a full rewrite risks breaking the working India pipeline |
| Sales playbook | Written as a companion doc for the sister, not app code | It's operating guidance, not a feature to build |

## Design

### 1. Aussie Lead Engine

**Schema — extend `lead_lists` (migration `20260703000001_add_lead_pools.sql`):**

```sql
ALTER TABLE lead_lists
  ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'website'
    CHECK (pool IN ('website', 'automation')),
  ADD COLUMN IF NOT EXISTS niche_score INT,
  ADD COLUMN IF NOT EXISTS pitch_angle TEXT,
  ADD COLUMN IF NOT EXISTS audit_signals JSONB;

CREATE INDEX IF NOT EXISTS idx_lead_lists_pool_score
  ON lead_lists(pool, niche_score DESC NULLS LAST);
```

- `pool = 'website'`: existing behavior — businesses with no `websiteUri` from Google Places.
- `pool = 'automation'`: businesses **with** a website that score well on the niche/audit scorer below.
- `audit_signals` shape: `{ has_booking: bool, has_chat: bool, mobile_friendly: bool, has_ssl: bool, page_load_ms: number | null, review_count: number, review_velocity_30d: number }`
- `pitch_angle`: a single generated sentence, e.g. *"34 reviews in the last 30 days, no online booking — after-hours enquiries are going nowhere."* Built by picking the highest-weighted fired signal(s) and filling a per-signal template.

**Niche fit lookup (`lib/lead-scoring.ts`, new):**

A static table mapping Google Places `category` → automation fit weight + pitch template:

| Category examples | Fit weight | Primary automation pitch |
|---|---|---|
| Plumber, electrician, locksmith (trades) | High | Missed-call text-back |
| Dental, physio, chiro (clinics) | High | AI booking / appointment reminders |
| Hair salon, barber | Medium-High | AI booking |
| Restaurant, cafe | Medium | FAQ/quote bot, table booking |
| Real estate agent | Medium | Lead-capture chatbot |
| Vet | Medium-High | AI booking |
| Gym / fitness studio | Medium | Class booking bot |

Not in the table → excluded from Pool B entirely (no automation pitch, don't waste a scan on it).

**Website audit (`lib/lead-audit.ts`, new):**

- `fetch()` the business's website HTML (timeout ~5s, follow one redirect)
- Signature checks via string/regex match on the HTML: booking widgets (Calendly, Cal.com, Fresha, Square Appointments, Vagaro), chat widgets (Intercom, Tawk.to, Crisp, Drift, Tidio), `<meta name="viewport">` presence, HTTPS scheme
- Page load: measure fetch wall-clock time as a rough proxy (not a full performance audit)
- On fetch failure (site down/broken) → treat as a strong automation signal itself (`has_booking: false, has_chat: false`, note "site broken" in signals) rather than excluding the lead
- No browser rendering — this is a text/HTML scan only, per the lightweight-audit decision

**Scoring (`lib/lead-scoring.ts`):**

```
niche_score = clamp(
  niche_fit_weight (0-40)
  + audit_gap_points (0-40: +10 each for missing booking/chat/mobile/ssl)
  + busy_signal_points (0-20: scaled from review_count + review_velocity_30d)
, 0, 100)
```

`pitch_angle` is generated from whichever category (niche template, audit gap, or busy signal) contributed the most points.

**Discovery flow changes (`lib/lead-discovery.ts`):**

1. Google Places Text Search across the Sydney suburb list (config array, easy to extend later — not hardcoded inline)
2. Split results: no `websiteUri` → Pool A (`pool='website'`), has `websiteUri` and category is in the niche table → run through audit + scoring → Pool B (`pool='automation'`) if `niche_score` clears a minimum threshold (default 40, configurable)
3. Below-threshold Pool B candidates and out-of-table categories are discarded, not stored (avoid junk rows)
4. Same dedup-by-name+address as today, applied per pool

**Dashboard (`/dashboard/leads`, existing page extended):**

- Pool toggle (Website / Automation) above the existing batch/date view
- Automation pool table adds columns: Score, Pitch Angle, Audit flags (icon row)
- Per-lead row action bar: Call (opens the existing sales call-log modal, writes to `call_logs`), Email (mailto with pre-filled subject referencing the pitch angle), WhatsApp (`wa.me` link with pre-filled message using the pitch angle)
- These channel actions are lightweight (no new tracking table) — they open the native client; call logging continues to be the only outcome persisted, same as today

### 2. Generation Engine Quality

Scoped to `lib/ai/generator.ts` and its prompt construction, three targeted fixes:

**a) Design variation.** Add a niche-to-design-axis table (layout archetype, type pairing, palette derivation source) alongside the existing niche category data. When generating, pick a variation seed derived from the business ID so repeat categories (e.g. two plumbers same week) land on different archetypes instead of visually identical output. This is a prompt-construction change — no new AI call.

**b) Copy quality.** Split copy generation into its own explicit prompt stage (still within the existing generation call, not a separate round-trip unless testing shows quality needs it) with: en-AU spelling and idiom rules, suburb-name injection where relevant, and a "problem-led headline" pattern instead of generic "Welcome to X" openers.

**c) Image selection.** Rank incoming Google Places photos by resolution/aspect ratio before hero selection (current code takes them in API order). When photos are absent or below a quality floor, fall back to a small curated category-matched image set (not generic stock-photo-site look) rather than a placeholder or the worst available photo.

No changes to the model fallback chain (Gemini → OpenRouter → OpenAI), queue system, or revision/auto-fix logic — this is prompt/selection logic only.

### 3. AU Marketing Landing Page

New route: `(marketing)/au` (or a distinct `(marketing-au)` group if font/DLS diverges enough — decided during planning once the design direction is picked). Content differences from the existing agency page:

- Sydney-based positioning, ABN + "Sydney, NSW" in footer trust block
- Two offer cards instead of one: **Websites** and **AI Automation**, each with its own CTA copy
- AUD pricing display (specific tiers TBD — pricing numbers are a business decision, not part of this spec; placeholder tiers used until finalized)
- Same "never say AI" landing-page rule from the existing brand-perception constraint carries over for the *website* offer messaging; the *automation* offer is explicitly allowed/expected to name AI since that's the product being sold
- CTA buttons scroll to contact/lead form (same pattern as existing agency page — payment happens downstream, not on the landing page)

A companion **Aussie sales playbook** doc (calling windows respecting AU business hours, SMS-first follow-up culture, tone/phrasing norms, do-not-call awareness) will be written as a separate reference doc for the sister, not shipped as app code.

### 4. Stripe AU Payments

**Schema — extend `claims` (migration `20260703000002_add_claims_payment_provider.sql`):**

```sql
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'razorpay'
    CHECK (payment_provider IN ('razorpay', 'stripe'));
```

Existing rows default to `'razorpay'` — no backfill needed, no behavior change for India claims.

**New module `lib/stripe.ts`**, mirroring `lib/razorpay.ts`'s shape (order/session creation, signature verification helper).

**New webhook `app/api/webhooks/stripe/route.ts`**, mirroring the existing Razorpay webhook's idempotent-processing pattern — verifies Stripe's signature header, updates the matching `claims` row, does not touch Razorpay's webhook route or logic.

**Pricing:** AUD tier(s), no GST line item (business operates under the $75k AUD registration threshold — revisit if/when volume crosses it).

**Rollout sequencing:**
1. **Bridge phase**: Stripe Payment Links (created manually or via a simple admin action) — no code changes to the claim flow required, unblocks sales immediately once the sister's Stripe AU account is live
2. **Integration phase**: full Stripe Checkout wired into the existing `/claim/[slug]` flow, provider selected by claim's market/currency, same confirmation/portal flow downstream regardless of provider

## Constraints Carried Over (unchanged)

- Single operator model for admin; sales CRM already supports multiple `sales` role users, no changes needed there
- India Razorpay flow must not regress
- Existing Supabase schema is extended, not modified/dropped
- `call_logs` remains append-only; sales status changes still flow only through the existing trigger
- Client pages remain mobile-first; new AU marketing page follows the same discipline

## Open Items for Planning Phase

- Final AUD pricing tiers (business decision, not architectural)
- Exact Sydney suburb seed list size (start small, expand based on discovery yield)
- Whether AU marketing page needs its own route group or fits within `(marketing)` with a locale sub-path
- Minimum `niche_score` threshold tuning (default 40, adjust after first batch review)
