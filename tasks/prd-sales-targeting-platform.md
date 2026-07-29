# PRD — Flogen Sales Targeting Platform (Australia)

**Status:** Draft v1 · July 2026
**Branch context:** extends `feat/sales-crm`
**Owner:** Vicky / Esso Digital

---

## 1. Problem Statement

Today, lead discovery lives in the **admin** dashboard and sales reps work a pre-loaded shared pool. Reps cannot pick their own territory, cannot see leads geographically, have no owner/manager names for personalisation, and get no signal when a prospect opens a demo site or claims it. The automation pool (leads scored for AI-automation fit) has **no deliverable at all** — there is nothing to send them the way website leads get a generated demo site.

The cost of not solving this: reps burn time on stale, unlocalised lists; the automation pool (already scored and stored in `lead_lists`) generates zero revenue; and outreach is untracked, so nobody knows which touches convert.

## 2. Goals

1. **Self-serve territory prospecting** — a rep can log in, select an area on a map of Australia, pick a business genre, and have qualified leads in their workspace in under 5 minutes.
2. **Two complete sell motions** — website leads get a generated demo site + `/claim/[slug]` (exists); automation leads get a generated pitch page + "Let's do it" CTA (new). Both capture email + phone and write back to the CRM.
3. **Closed feedback loop** — every prospect action (preview view, CTA click, claim, interest form, reply, STOP) updates the lead and notifies the responsible rep within 1 minute.
4. **Compliant by construction** — every stored contact has consent provenance; every email has sender ID + unsubscribe; WhatsApp is click-to-chat only with in-product volume guardrails. (Spam Act 2003 penalties are running $1M–$7.5M per ACMA action; this is structural, not optional.)
5. **Data cost under control** — target < US$100/month in data costs at 1,000 new leads/month (Places API + verification; $0 for map tiles and WhatsApp).

## 3. Non-Goals (v1)

- **WhatsApp Cloud API / automated WhatsApp sending** — cold messaging via the API violates Meta policy and burns the number. Click-to-chat deep links only. Revisit post-consent (booked demos) later.
- **Paid contact-enrichment pipelines (Apollo/Clay-style waterfalls)** — coverage of AU micro-businesses is poor; the Maps phone number *is* usually the owner's mobile. An optional per-lead "find email" button is P1, a waterfall is P2+.
- **Automated email sequences / drip campaigns** — v1 is rep-initiated sends with tracking. Sequencing is P2; it multiplies deliverability and compliance risk before the core loop is proven.
- **Bulk email harvesting/crawling feature** — the Spam Act prohibits address-harvesting software output. Addresses are collected per-lead with provenance, never as a bulk crawl.
- **Payments on the automation flow** — "Let's do it" captures intent (email + phone), it does not take money. Automation engagements are scoped on a call; pricing them in-product is premature.
- **Lead marketplace / multi-tenant** — this stays an internal Esso Digital tool.

## 4. Personas

- **Sales rep (`role='sales'`)** — works leads daily; phone-first; needs speed, a queue, and signals. Not technical.
- **Sales admin (`role='admin'`)** — assigns territories, watches team metrics and conversion (ground truth = `claims.paid_at`), manages compliance settings.
- **Prospect (business owner/manager)** — a tradie, salon owner, café operator. Reads email on phone; replies on WhatsApp; decides in one sitting if the demo impresses.

## 5. User Stories (priority order)

**Discovery**
- As a sales rep, I want to select suburbs/postcodes (or drop a radius pin) on a map of Australia and pick a business genre, so that I get leads in the territory I'm actually going to work.
- As a sales rep, I want to choose the lead type — "needs a website" or "automation fit" — so the leads match the pitch I'm running.
- As a sales rep, I want discovery to run as a background job and land results directly in my lead table (no CSV), so I can start working immediately.
- As a sales admin, I want to see which territories are claimed by which rep, so reps don't double-work the same suburb.

**Enrichment & contact**
- As a sales rep, I want each lead to show the best-known contact (phone from Maps, email with its source, owner name from ABN lookup when it's a sole trader), so my first message uses their real name.
- As a sales rep, I want an optional "find a better email" action on leads that have a website, so I can reach a decision-maker inbox when one exists.

**Outreach**
- As a sales rep, I want to generate the demo website (or automation pitch page) for a lead in one click and get a share link, so proof-of-work is ready before I reach out.
- As a sales rep, I want a pre-drafted, personalised email I can review and send from the platform (with tracking), so I know if it landed and was opened.
- As a sales rep, I want a WhatsApp button that opens my WhatsApp with a pre-filled personalised message, and logs the touch when I click it, so WhatsApp outreach appears in the lead history.
- As a sales rep, I want the product to warn me when I'm past ~30 new WhatsApp contacts today, so my number doesn't get banned.

**Response loop**
- As a sales rep, I want to be notified when my prospect views the demo, clicks the CTA, submits the claim/interest form, or replies, so I follow up while they're warm.
- As a prospect, I want the claim page to ask only for my email and phone before anything else, so expressing interest takes 20 seconds.
- As a prospect, I want a working unsubscribe/STOP that actually stops contact, so I'm not chased after opting out.
- As a sales admin, I want conversion metrics grounded in `claims.paid_at` (not rep-reported outcomes), so numbers stay honest.

**Edge cases**
- As a sales rep, when discovery returns zero qualifying leads for an area+genre, I want to see why (out of niche / below threshold / all duplicates) so I adjust instead of re-running blindly.
- As a sales rep, when a lead is already in another rep's territory or already contacted, I want it flagged, not duplicated.

## 6. UX / UI Specification

Design principle from the research: **one lead entity, three synchronized views** (map, table, pipeline) — view toggles over the same data, never separate modules. Kill the "CSV chasm": discovery writes straight into the workspace.

### 6.1 `/sales/discover` — map-first discovery (new)

Layout (desktop, 1280px+):
- **Left 70%: MapLibre GL map** of Australia (OpenFreeMap/MapTiler vector basemap, $0). ABS **SAL** (suburbs) and **POA** (postcodes) boundaries served as a **PMTiles** archive from Supabase Storage (tippecanoe-simplified; no tile server).
- **Right 30%: filter rail** (sticky):
  1. **Area** — three selection modes, tabbed: *Suburbs* (click polygons to toggle, chips list below), *Radius* (drop pin + drag radius, max 50 km — maps 1:1 to Places Nearby Search), *Postcode* (type-ahead that highlights the polygon).
  2. **Genre** — searchable select seeded from the existing `NICHE_FIT_TABLE` industries, grouped "Automation-ready niches" vs "All categories".
  3. **Lead type** — segmented control: `Needs a website` / `Automation fit` (maps to existing `pool`).
  4. **Volume** — 20 / 50 / 100 with a live **cost estimate** (e.g. "≈ $3.50 in API spend").
  5. **CTA**: "Find leads" → creates a `discovery_job`, shows progress inline (found → audited → qualified → saved), results drop pins on the map coloured grey (new).
- Selected area can be **saved as a territory** (name + rep). Territory polygons render on the map for the whole team with owner labels.

Mobile (375px): map full-screen, filter rail becomes a bottom sheet. Reps are desktop-first; mobile is view-only for map, full for table/queue.

### 6.2 `/sales/leads` — upgraded workspace

- **View toggle** (top right): `Table` (default) / `Map` / `Pipeline`.
- **Table**: existing columns + owner name, territory, pool, score, last touch channel, and an **intent column** (👁 n views, last viewed 2h ago). Filter rail: status, genre, territory, pool, has-email, intent (viewed demo / clicked CTA). Apollo-style multi-select → one hero bulk action: **"Generate demo"** (queues generation for selected leads).
- **Map view**: same leads as pins **coloured by status** (grey new → blue contacted → amber engaged/viewed → green interested/claimed → red do-not-contact). Lasso select (P1) → bulk action.
- **Pipeline view**: kanban by `sales_status` (existing statuses), drag disabled — status changes only via logged touches/outcomes, preserving the `call_logs` append-only invariant.

### 6.3 Lead detail — drawer, not page

Slide-over drawer from any view (keeps context):
- **Header**: business name, genre chip, score, territory, status chip.
- **Contact card**: phone (tap-to-call), email **with provenance tooltip** ("found on their website footer, 12 Jun 2026"), owner name + ABN entity type when matched.
- **Deliverable card**: demo site / pitch page — thumbnail, "Generate" or "Open + Copy link", view counter with timestamps (intent signal).
- **Compose card**: tabs `Email` / `WhatsApp`. Email: editable AI-drafted message referencing the audit finding + demo link, compliance footer locked (sender ID, ABN, unsubscribe). WhatsApp: editable draft + "Open in WhatsApp" (wa.me deep link, logs touch on click, shows today's new-contact counter `17/30`).
- **Timeline**: unified — calls (`call_logs`), messages, prospect events (viewed, clicked, submitted), system events. Newest first.
- **Log call** panel: existing outcomes/notes/follow-up form, unchanged.

### 6.4 Prospect-facing pages

- **Website flow (exists)**: `/claim/[slug]`. Change: move email+phone capture **before** payment — a lightweight "Claim this website" step 1 form (name, email, mobile) that creates the claim record and fires a rep notification; payment remains step 2.
- **Automation flow (new)**: `/pitch/[slug]` — a template-based, personalised pitch page (not a generated React site): business name + logo/photos from Maps, "what we noticed" (from `audit_signals` + `pitch_angle`), 3 concrete automation outcomes for their niche (from `NICHE_FIT_TABLE` templates), social proof, and a single CTA **"Let's do it"** → form (name, email, mobile, preferred time) → thank-you + rep notified. Same `claim_events`-style tracking (page view, CTA click, submit). Built from 3–4 hand-designed templates by niche family (trades / beauty / hospitality / health), rendered server-side — fast, consistent, no AI-generation cost per lead.

### 6.5 Notifications

- **In-app**: bell + unread badge in the sales sidebar; Supabase Realtime on a `notifications` table.
- **Email to rep** (P0, simplest reliable channel): demo viewed (first view only), CTA clicked, form submitted, claim paid. Digest logic: max 1 email per lead per hour.

## 7. Requirements

### P0 — Must-have

| # | Requirement | Acceptance criteria (abridged) |
|---|---|---|
| P0.1 | Rep-initiated discovery from `/sales/discover` with area (suburb/postcode/radius) + genre + pool + volume | Given a rep selects 3 suburbs + "plumber" + automation pool, when they run discovery, then a `discovery_job` row is created, Places queries are decomposed into ≤50 km circles + point-in-polygon filter, results are deduped by `place_id` against all existing `lead_lists`, and qualifying leads appear in their table without reload. Zero-result runs show the reason (`out_of_niche` / `below_threshold` / `all_duplicates`). |
| P0.2 | Interactive Australia map: MapLibre + PMTiles boundaries (SAL + POA), suburb click-select, radius pin, postcode search | Boundary archive ≤ 15 MB total, first map paint < 2 s on broadband, polygon toggle renders selection state, selection persists across mode switches. |
| P0.3 | Territories: save named area per rep, visible to team | Overlapping discovery into another rep's territory shows a warning; admin can reassign; leads carry `territory_id`. |
| P0.4 | Contact enrichment (free tier): ABR match by name+state+postcode → legal name, entity type, ABN, sole-trader owner name; email harvested only from the lead's own site/GBP with `source_url` + `captured_at` stored | Every stored email has `consent_basis='conspicuous_publication'`, `source_url`, `captured_at`. Leads without a published email simply have none — no guessing. |
| P0.5 | One-click deliverable per pool: website demo (existing generator) or pitch page (new template renderer) with unique slug | Given an automation lead, when the rep clicks Generate, then `/pitch/[slug]` renders their personalised page in < 30 s and the share link is copyable. |
| P0.6 | Pitch page "Let's do it" flow: view/CTA/submit tracking + interest form (email, phone) | Submission writes an `interest` record, updates lead status to `interested`-equivalent via the touch pathway, and notifies the rep within 60 s. Duplicate submissions are idempotent. |
| P0.7 | Claim page pre-payment contact capture + rep notification on claim events | Email+phone captured before Razorpay step; `claim_events` (view, cta_click, payment) trigger rep notifications; conversion attribution unchanged (`claims.paid_at`). |
| P0.8 | Tracked email send from the platform (single sends): provider-backed (Resend or SMTP/Nodemailer), open-pixel + click-tracked link, locked compliance footer (business name, ABN, address, unsubscribe) | Sends blocked unless: recipient not in suppression table, email verified (< 3% projected bounce), lead genre matches template relevance. Unsubscribe link works logged-out, writes to global `suppression` table instantly. |
| P0.9 | WhatsApp click-to-chat composer: wa.me deep link with E.164 number + AI-drafted text, touch logged on click, per-rep daily new-contact counter with soft cap 30 | STOP replies (rep marks manually in v1) write the number to suppression; composer refuses suppressed numbers. |
| P0.10 | Unified lead timeline + in-app/email notifications | Calls, sends, wa clicks, prospect events in one ordered timeline; notification fan-out ≤ 60 s; ≤ 1 email/lead/hour. |
| P0.11 | Suppression table honoured everywhere (email, WhatsApp, calls list) | Suppressed contact renders a do-not-contact banner on the lead; all compose paths disabled. |

### P1 — Nice-to-have (fast follows)

- Lasso/freehand map selection; map pins bulk-select → bulk generate.
- "Find a better email" button: Anymail Finder (pay-per-verified) or Hunter Starter, only enabled when the lead has a domain; result stored with provenance `finder_api`.
- Reply capture "Unibox-lite": inbound via Resend inbound routing to a shared address; 5 fixed dispositions (Interested / Not interested / Later / OOO / STOP) writing back to lead status.
- Intent-ranked queue: demo views/CTA clicks bump the lead in the rep's follow-up queue.
- Admin territory heatmap: coverage + conversion by suburb.
- Pitch page A/B of CTA copy ("Let's do it" vs alternatives), measured by submit rate.

### P2 — Future considerations (design for, don't build)

- Email sequences (2 follow-ups, 3–5 day spacing) with per-domain warm-up budgets — schema should allow a `sequence_id` on sends.
- WhatsApp Cloud API for **post-consent** utility messages (< US$0.02/msg) once a prospect opts in.
- Outscraper bulk enrichment lane for high-volume months (~$9/1K with emails) — keep discovery provider-pluggable behind one interface.
- Payments on the automation flow once offers are productised.
- Route planning / door-knock mode on the map (Badger-style).

## 8. Data Model & Architecture

### 8.1 New/changed tables (Supabase migrations — remember: live DB drift, apply via SQL Editor per current process)

```
territories        id, name, rep_id (fk auth.users), geojson (jsonb), suburb_codes text[],
                   created_by, created_at
discovery_jobs     id, rep_id, territory_id?, params jsonb (genre, pool, volume, circles),
                   status (queued|running|done|failed), counts jsonb (found/audited/qualified/dup),
                   reason?, created_at, finished_at        -- checkpointed, resumable
lead_lists (alter) + lat, lng, territory_id?, assigned_to?, owner_name?, abn?, entity_type?,
                   email_source_url?, email_captured_at?, email_verified_at?,
                   consent_basis? ('conspicuous_publication'|'finder_api'|'inbound')
pitches            id, lead_id (fk lead_lists), slug unique, template_key, content jsonb,
                   status (draft|live), created_by, created_at
pitch_events       id, pitch_slug, event_type (view|cta_click|submitted), ip, user_agent,
                   metadata jsonb, created_at              -- mirror of claim_events
interests          id, pitch_id, name, email, phone, preferred_time?, created_at
outreach_messages  id, lead_id, rep_id, channel (email|whatsapp), direction (out|in),
                   subject?, body, provider_message_id?, opened_at?, clicked_at?,
                   disposition?, created_at                -- append-only, like call_logs
suppression        id, contact (email|e164 phone), channel, reason (unsubscribe|stop|complaint|manual),
                   source, created_at                      -- global, checked pre-send
notifications      id, user_id, lead_id?, type, payload jsonb, read_at?, created_at
```

Invariants preserved: `call_logs` stays append-only and remains the **only** writer of `projects.sales_*` via the existing trigger. `outreach_messages` gets a sibling trigger (or extends the existing one) so email/WhatsApp touches also refresh `sales_last_contact_at` — never written directly by app code. Conversion ground truth stays `claims.paid_at`.

### 8.2 Key decisions (from research)

| Decision | Choice | Why |
|---|---|---|
| Map library | **MapLibre GL + react-map-gl** | WebGL handles 15K suburb polygons; free; PMTiles native |
| Boundaries | **ABS SAL + POA**, tippecanoe → PMTiles on Supabase Storage | Free CC-BY, no tile server, single-digit MB after simplification |
| Basemap tiles | OpenFreeMap (fallback MapTiler free tier) | $0 vs Google Dynamic Maps $7/1K loads |
| Discovery source | **Official Places API (New)**, Enterprise field mask | `websiteUri`/phone/rating are Enterprise fields; $32–35/1K searches; legally clean foundation for a compliance-sensitive product (scraping stays a pluggable P2 lane) |
| AU enrichment | **ABR API (free)** + own-site email harvest with provenance | Owner names for sole traders; paid enrichers are weak on AU micro-business |
| Email infra | Resend (or existing Nodemailer + tracking) on a **separate sending domain** | Protect main domain reputation; verification gate keeps bounces < 3% |
| WhatsApp | **wa.me click-to-chat only**, guardrails in-product | Cloud API cold outreach = policy violation + ban risk; $0 cost |
| Compliance | Consent provenance in schema + locked footers + suppression | ACMA penalties $1M–7.5M; inferred consent via conspicuous publication requires relevance + records |

### 8.3 Discovery pipeline (server)

`discovery_job` → decompose area into ≤50 km circles → Places Text/Nearby Search (Enterprise mask) → point-in-polygon filter → dedupe (`place_id`) → pool routing: website pool = no `websiteUri`; automation pool = existing `lead-audit.ts` + `lead-scoring.ts` (≥40) → ABR match → insert `lead_lists` rows with `lat/lng`, `territory_id`, provenance → notify rep. Checkpoint after each circle (job resumable; consistent with existing checkpointing rules). Rate-limit Places calls; job queue not synchronous (per CLAUDE.md bulk-ops rule).

## 9. Build Plan (phases ≈ PR-sized milestones)

**Phase 1 — Schema + rep-side discovery (no map yet)** · ~1 week
Migrations above; `/sales/discover` with location autocomplete (existing `au-suburbs.ts`) + radius + genre + pool; discovery job runner refactored out of admin API into shared `lib/discovery/`; results land in rep table with `assigned_to`. *Exit test: rep discovers 20 plumber leads in Parramatta and sees them in their table.*

**Phase 2 — Map** · ~1 week
One-off boundary pipeline script (ABS → tippecanoe → PMTiles → Supabase Storage); MapLibre map with suburb/postcode/radius selection; territories save/display; lead pins by status; map view toggle on `/sales/leads`. *Exit: suburb multi-select drives the same discovery as Phase 1; pins recolour as statuses change.*

**Phase 3 — Deliverables + response loop** · ~1.5 weeks
Pitch template renderer + `/pitch/[slug]` + "Let's do it" form + `pitch_events`; claim page pre-payment contact capture; `notifications` + Supabase Realtime bell + rep emails; unified timeline in lead drawer. *Exit: submitting "Let's do it" pings the rep in < 60 s and shows in the timeline.*

**Phase 4 — Tracked outreach + compliance rails** · ~1.5 weeks
Email send path (provider, open/click tracking, locked footer, verification gate); suppression table + unsubscribe endpoint + STOP handling; WhatsApp composer with wa.me logging + daily counter; `outreach_messages` + trigger. *Exit: a send to a suppressed address is impossible; an opened email shows `opened_at` on the timeline.*

**Phase 5 — Polish + P1s** · ongoing
Intent-ranked queue, Unibox-lite replies, "find a better email", lasso select, admin heatmap.

Total P0 estimate: **~5 weeks** solo pace.

## 10. Success Metrics

**Leading (2–4 weeks post-launch):** ≥ 80% of new leads created via rep self-serve discovery (vs admin); median map-to-leads time < 5 min; ≥ 60% of contacted leads have a deliverable link sent; demo/pitch view rate ≥ 25% of sends; email bounce < 3%, open ≥ 40% (benchmark: audit-style cold email replies run 4–6% vs 3.4% baseline).
**Lagging (quarter):** claim submissions (website) + interest submissions (automation) per rep per week — target 3+/rep/week combined; paid conversions (`claims.paid_at`) per 100 discovered leads; zero ACMA complaints; zero WhatsApp number bans.
**Measurement:** all from `claim_events`/`pitch_events`/`outreach_messages`/`discovery_jobs` — no external analytics needed.

## 11. Costs (1,000 new leads/month)

Places Enterprise search ~$35 + Place Details top-ups ~$20 + email verification ~$5 + optional Anymail/Hunter ~$34 + map tiles $0 + WhatsApp $0 ≈ **< US$100/month**. Pitch pages are template-rendered (no per-lead AI cost); website demos keep existing generation cost profile.

## 12. Compliance Summary (Spam Act 2003, AU)

- **Consent basis**: inferred consent via *conspicuous publication* — allowed for B2B when the message is directly relevant to the recipient's business. Enforced structurally: sends allowed only when lead genre ↔ template relevance matches, and only to addresses with stored provenance.
- **Every email**: sender business name, ABN, physical address, functional one-click unsubscribe (live ≥ 30 days, honoured instantly — beats the 5-business-day requirement).
- **WhatsApp/SMS** are covered by the Act identically: ID + opt-out in-message; STOP → suppression.
- **No bulk address-harvesting feature ships.** Per-lead collection with `source_url` evidence only.
- **Action item**: 1-hour Australian counsel review of the harvesting/inferred-consent posture before GA.

## 13. Open Questions

1. **(Vicky/legal, blocking for GA not for build)** Confirm inferred-consent posture with AU counsel, esp. email collection from GBP listings.
2. **(Vicky)** Sending domain + identity: which domain sends rep email, and do reps send as themselves or a shared identity? Affects Phase 4 setup and warm-up.
3. **(Vicky)** Territory exclusivity: hard lock (leads in my territory are only mine) or soft warning? PRD assumes soft warning + `assigned_to`.
4. **(Vicky)** Automation pitch pricing display: show indicative pricing on `/pitch/[slug]` or keep it price-free until the call? PRD assumes price-free.
5. **(Engineering)** Razorpay vs Stripe for AU claims — claims table is Razorpay-shaped; AUD support and AU buyer trust may warrant Stripe for this market. Non-blocking for Phases 1–3.
6. **(Vicky)** Dedicated WhatsApp Business numbers per rep (recommended: one each, personal-ish identity) — procurement needed before Phase 4 guardrails matter.

## 14. Appendix — Research Sources

Map/boundaries: ABS ASGS Ed.3 digital boundary files; MapLibre vs Leaflet benchmarks (MDPI 2025); Google Maps March-2025 pricing. Places API: SKU pricing + Enterprise field tiers (Google docs). ABR: JSON web services + bulk extract (data.gov.au). Enrichment: Hunter/Apollo/Snov/Anymail pricing pages; Clay/Apollo accuracy comparisons. WhatsApp: Meta per-message pricing (Jul 2025), opt-in policy, messaging-tier docs. Compliance: ACMA "avoid sending spam"; CBA $7.5M and Latitude $3.96M penalties (2025). UX: Apollo sequences/deals docs; Instantly Unibox reviews; Badger Maps lasso/radius; Woodpecker/Snov cold-email stats.
