# Award Template Library + Hybrid Generation Routing — Design Spec

**Date:** 2026-07-06
**Status:** Approved for planning
**Depends on:** award-generation design-knowledge library (2026-07-05, shipped), templates table + content-swap generation mode (existing), sales lead engine (shipped)

## Problem

Generation quality and cost pull against each other. Gemini single-shot output is generic-to-good, the modular path is slow and was timing out, and every site is generated from scratch (~₹1+ each, quality variance). Meanwhile the `templates` table and the content-swap generation mode exist but sit unused — nothing populates them and nothing routes to them.

The user also wants their own Claude Code (subscription, already paid) doing agentic award-grade generation for the leads that matter, without the deployed app depending on it being online.

## Solution overview — three phases

**Phase 0 — Award Template Library (the big win, ships first).**
Fable 5 authors one award-winning design PRD (`.md`) per industry for 10 industries; Sonnet builds each PRD into a real single-page React template; each is rendered and verified; all 10 are seeded into the `templates` table as approved. From then on most new leads are a cheap content-swap off an award-grade base.

**Phase 1 — Hybrid generation routing + Claude Code worker.**
A heartbeat/claim protocol lets the user's local Claude Code pull up to 10 high-value jobs per list and generate them agentically (Sonnet). Everything else routes: approved template for the niche → content-swap; no template → trimmed single-call Gemini floor.

**Phase 2 — Living templates (section-aware reuse).**
Content-swap becomes section-aware: sections with real Maps data get regenerated to match the template's style (and the improvement is written back to the stored template); sections without data get generic-but-relevant content, never fabricated specifics.

## Quality bar (applies to every path)

Single-page, state-of-the-art, Australian-market websites:
- Craft-core rules binding (oversized type, asymmetry, committed palette, banned genericisms).
- Contrast guarantee: no invisible text; text color chosen against nearest background.
- AU voice: Australian English spelling, local idiom, suburb/city references from Maps data.
- Real business photos (Google Places) preferred over stock everywhere they exist.
- Mobile-correct at 375px; loads as a static single page.
- No placeholder content: missing data → section omitted or generic-relevant copy, never fake specifics.

---

## Phase 0 — Award Template Library

### The 10 industries (build order = priority order)

Ranked by AU cold-outreach economics: job value × Maps volume × how bad the category's existing sites are.

| # | Industry | Niche family | Design direction anchor |
|---|----------|-------------|------------------------|
| 1 | Builder / Renovations | trades | Portfolio-led, oversized type, before/after proof |
| 2 | Plumber | trades | Urgency + click-to-call, bold utility aesthetic |
| 3 | Electrician | trades | Same family as plumber, distinct palette/type |
| 4 | Dental / Health clinic | health | Calm premium, booking-CTA-centric |
| 5 | Restaurant / Bistro | hospitality | Warm editorial, menu + reservation |
| 6 | Café / Brunch | hospitality | Light, photo-forward, casual premium |
| 7 | Hair & Beauty salon | beauty | Gallery-led, fashion-editorial |
| 8 | Automotive — Mechanic / Detailing | automotive | Dark industrial, biggest before/after shock |
| 9 | Gym / PT studio | fitness | Bold type, transformation proof, trial CTA |
| 10 | Real estate agency | professional | Premium editorial, listing-quality imagery |

Bench (not built now): landscaping, cleaning, physio/chiro, barber.

### Design PRDs (Fable-authored)

One file per industry: `design-knowledge/templates/<nn>-<industry>.md`. Each PRD is a complete, buildable art direction:

- **Concept** — the one bold idea that makes it award-grade (one paragraph).
- **Palette** — exact hex values, surface/text pairs (contrast-guarantee compliant).
- **Typography** — display + text pairing from the existing font variables; exact clamp sizes.
- **Section order** — the single page's exact sections, each with: purpose, layout archetype (from existing archetype library), and its **content slots** mapped to Maps/enrichment fields (name, phone, address, rating, reviews, photos, category).
- **Slot fallbacks** — for each slot: what renders when the data is missing (omit / generic-relevant copy).
- **AU voice notes** — tone, spelling, example headline in-voice.
- **The award move** — one specific signature detail (e.g. marquee of review pull-quotes, oversized price type, full-bleed photo interruption).

PRDs live in the repo (versioned, editable) and are referenced by the seeder, not injected into runtime generation prompts.

### Template builds (Sonnet, one-time)

A seeding script (`scripts/seed-award-templates.ts`, run locally, not deployed) that for each PRD:
1. Builds a generation prompt = PRD (verbatim) + craft-core + code-generator architecture rules + a fictional-but-realistic AU sample business for that industry (so slots render with plausible content).
2. Calls Sonnet (Anthropic API via AI SDK; model `claude-sonnet-5`) once per template — a one-time cost (~10 calls total), not a runtime dependency.
3. Validates the output with the existing code validators (`validateGeneratedCode` + autofix loop).
4. Writes the code to `templates` with: `industry`, `source: 'award-seed'`, `prd_path`, `status: 'approved'`, `is_active: true`.

Manual verification gate: before marking approved, each template is rendered via the existing `/preview` route and eyeballed (contrast, 375px, photo slots). The script seeds as `pending`; a `--approve` pass (or dashboard toggle) flips to approved after visual check.

### Schema changes (Phase 0)

`templates` table gains (migration, applied via SQL Editor per project convention):
- `industry text` (indexed) — routing key.
- `source text` (`'award-seed' | 'promoted'`) — provenance.
- `prd_path text null` — repo path of the PRD that produced it.
- `status text default 'pending'` (`pending | approved | rejected`) — approval gate.
- Existing `is_active` continues to mean "usable by routing"; only `approved AND is_active` templates route.

### Phase 0 acceptance

- 10 PRD files committed.
- 10 templates seeded, rendered, visually verified, approved.
- A test lead in each industry generates via content-swap off its template in one AI call, passing validation.

---

## Phase 1 — Hybrid generation routing + Claude Code worker

### Liveness & claim protocol

New table `generation_workers`:
- `id`, `worker_name text unique` (`'claude-local'`), `last_heartbeat_at timestamptz`, `status text`.

`queue_jobs` gains `claimed_by text null` (`'claude' | 'cron'`), `claimed_at timestamptz null`.

Rules:
- **Claude live** ⇔ `last_heartbeat_at` < 90s old. Worker upserts heartbeat every ~30s.
- Claude claims atomically: `UPDATE queue_jobs SET claimed_by='claude', claimed_at=now(), status='processing' WHERE id=? AND claimed_by IS NULL AND status='pending'`.
- **Safety valve:** the cron may take any job whose `created_at` is >10 min old and `claimed_by IS NULL`, even if Claude is live — a hung worker never freezes the queue. It may also reclaim jobs claimed >15 min ago without completion.

### High-value definition

A lead is high-value iff it has a phone number, ranked by `niche_score` (when present) else `rating × ln(1 + review_count)`. Claude takes the top 10 per batch. A manual `is_high_value boolean` flag on `projects` (dashboard star) overrides ranking — flagged leads always go to Claude when live.

### The router (in the existing `/api/queue/process` cron)

Per pending job, in order:
1. Claude live AND job in Claude scope (high-value, within its 10-cap for the batch) AND job younger than the 10-min safety valve → **skip** (leave for Claude).
2. Approved+active template exists for the project's industry → **content-swap** (existing template mode, one call).
3. Otherwise → **Gemini single-call trimmed**: the DLS-mode monolithic path (never the modular per-section path), with the knowledge ceiling reduced so total prompt cost stays ~₹1/site.

The modular per-section path is removed from routing (dead code path retired or gated off).

### The Claude worker (local, pull-based)

`scripts/claude-worker/` — a long-running local process:
- Heartbeats `generation_workers` every 30s.
- Polls for claimable high-value jobs (top-10 rule), claims atomically.
- For each job, runs an agentic loop with Sonnet (`claude-sonnet-5`): enrich (reuse stored enrichment if present) → generate against the niche PRD + craft-core → render check → critique against the award rubric → fix → write `generated_code` + status back to Supabase.
- On success, marks the project as a **template candidate** (visible in dashboard for approval; approving inserts/replaces the niche's `promoted` template).
- Auth: Claude Agent SDK using the local Claude Code login (subscription) — **verify this works as the first Phase 1 task**; if the SDK requires an API key in this setup, fall back to `ANTHROPIC_API_KEY` and surface the cost implication before proceeding.

### Phase 1 acceptance

- With the worker running: a new list's top-10 high-value leads are generated by Claude (Sonnet), the rest via template/Gemini; no double generation.
- With the worker stopped: everything routes template-first, Gemini floor second; nothing waits on Claude.
- Kill the worker mid-job: the job is reclaimed by the cron within 15 min.

---

## Phase 2 — Living templates (section-aware reuse)

Content-swap upgrades from whole-page rework to per-section decisions:

- Parse the template into sections (by `<section>` boundaries — templates are seeded with clean section structure per PRD).
- For each section, compare its content slots against the new business's data:
  - **Data present** → regenerate that section's content to match the template's style, with the real data. If the generation produces a better-structured section (validator + quality score), **write the improvement back to the stored template** (versioned: keep prior code in a `template_versions` history table).
  - **Data absent** → fill slots with generic-but-relevant copy for that business type; if the section is meaningless without data (e.g. gallery with zero photos), omit it.
- Template updates require the same approval status; auto-updates only apply to `promoted` templates, never overwrite `award-seed` originals without approval.

Phase 2 is specced here for continuity but gets its own detailed plan after Phase 1 ships.

---

## Cost model

| Path | Calls | Cost/site |
|------|-------|-----------|
| Content-swap off template | 1 small | ~₹0.2 |
| Gemini single-call floor | 1 | ~₹1 |
| Claude worker (subscription) | agentic loop | ₹0 marginal |
| Sonnet seeding (one-time) | ~10 | one-time, not runtime |

Expected steady state: most leads at ₹0.2, unknown niches at ₹1, top-10 leads at ₹0 marginal via subscription.

## Non-goals

- No 24/7 unattended agentic worker on rented compute (Option B from discussion) — revisit only if volume demands it.
- No multi-page sites.
- No change to outreach/email pipeline.

## Risks

- **Agent SDK auth via subscription** may not be supported in this environment → verified first; API-key fallback with explicit cost sign-off.
- **Template staleness** across very different businesses in one industry → mitigated by Phase 2 living templates; until then content-swap already restyles text content per business.
- **Places photo slots** in templates must use the `/api/photos` proxy URLs (never keyed URLs) — inherit from the shipped photo work.
