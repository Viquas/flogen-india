# Phase 1 — Hybrid Routing + Claude Worker (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Make the app "worker-ready": a heartbeat/claim protocol so a local Claude Code worker can pull the top-10 high-value leads and generate them agentically, while the Vercel cron safely handles everything else (template → Gemini floor) and never double-generates or freezes.

**Architecture:** Claude Code *pulls* jobs (the Vercel app cannot call out to it). A `generation_workers` heartbeat row signals liveness; `queue_jobs.claimed_by` prevents races. The queue processor skips jobs that a live Claude worker owns (top-10 high-value), with a safety valve so a dead worker never blocks the queue. The local worker script is built but RUN BY THE USER (needs their Claude auth) — that's the phase boundary.

**Tech Stack:** Next.js/TS, Supabase, vitest. Migrations = SQL files applied via SQL Editor (project convention).

## Global Constraints
- "Claude live" ⇔ `generation_workers.last_heartbeat_at` < 90s old.
- Claude scope = top-10 high-value leads per the ranking in Task 3; everything else is cron's.
- Safety valve: cron may take a job whose `created_at` > 10 min old and `claimed_by IS NULL` even if Claude is live; and may reclaim a job `claimed_at` > 15 min ago that never completed.
- App code MUST NOT double-generate: a job claimed by Claude is never picked by the cron unless reclaimed by the safety valve.
- Sales `projects.sales_*` columns stay trigger-owned — do not write them here.

---

### Task 1: Migration — worker heartbeat + claim + high-value flag
**Files:** Create `supabase/migrations/20260707000001_phase1_worker_claim.sql`

**Produces:** `generation_workers(id, worker_name unique, last_heartbeat_at, status, updated_at)`; `queue_jobs.claimed_by text` (`'claude'|'cron'`), `queue_jobs.claimed_at timestamptz`; `projects.is_high_value boolean default false`.

- [ ] Write the SQL:
```sql
create table if not exists generation_workers (
  id uuid default uuid_generate_v4() primary key,
  worker_name text not null unique,
  last_heartbeat_at timestamptz not null default now(),
  status text not null default 'idle',
  updated_at timestamptz not null default now()
);
alter table queue_jobs add column if not exists claimed_by text check (claimed_by in ('claude','cron'));
alter table queue_jobs add column if not exists claimed_at timestamptz;
alter table projects add column if not exists is_high_value boolean not null default false;
create index if not exists idx_queue_jobs_claim on queue_jobs (status, claimed_by, created_at);
```
- [ ] Apply via Supabase SQL Editor; verify the 3 columns + table exist.
- [ ] Commit `feat: phase1 worker heartbeat + claim + high-value migration`.

---

### Task 2: Liveness + claim library
**Files:** Create `lib/generation/worker-liveness.ts`; Test `__tests__/lib/generation/worker-liveness.test.ts`

**Produces:**
- `HEARTBEAT_TTL_MS = 90_000`
- `writeHeartbeat(supabase, workerName='claude-local', status?)` — upsert row, set `last_heartbeat_at=now()`.
- `isClaudeLive(supabase, nowMs): Promise<boolean>` — true iff a worker row's `last_heartbeat_at` within TTL.
- `claimJobForClaude(supabase, jobId): Promise<boolean>` — atomic `update ... set claimed_by='claude', claimed_at=now(), status='processing' where id=? and claimed_by is null and status='pending'`; returns whether it claimed (rowcount 1).

- [ ] Write failing tests (mock supabase chains): live/stale/no-row for `isClaudeLive`; claim success (row returned) vs already-claimed (empty) for `claimJobForClaude`; `writeHeartbeat` upserts on `worker_name`.
- [ ] Implement; tests pass; `tsc` clean.
- [ ] Commit `feat: worker liveness + atomic claim helpers`.

---

### Task 3: High-value lead selection
**Files:** Create `lib/generation/high-value.ts`; Test `__tests__/lib/generation/high-value.test.ts`

**Produces:**
- `leadScore(project): number` — `niche_score` when present, else `rating * Math.log1p(reviewCount)` read from `business_data` (rating, userRatingCount); 0 if no signal.
- `isWorkable(project): boolean` — has a phone (`business_data.contactInfo.phone` or `internationalPhoneNumber`).
- `selectHighValue(projects, cap=10): Project[]` — filter workable; `is_high_value===true` always included first; then top by `leadScore`; total ≤ cap.

- [ ] Write failing tests: manual flag overrides ranking; phone-less excluded; niche_score beats computed; cap respected; ties stable.
- [ ] Implement; tests pass.
- [ ] Commit `feat: high-value lead selection`.

---

### Task 4: Router — Claude-scope skip + safety valve (queue processor)
**Files:** Modify `lib/queue.ts` (the pending-job claim loop ~L255-310) and/or `app/api/queue/process/route.ts` stuck-reset (~L44-60). Test `__tests__/lib/generation/router-scope.test.ts` for the pure predicate.

**Produces:** `shouldCronSkip(job, project, {claudeLive, isInClaudeScope, nowMs}): boolean` — cron skips iff `claudeLive && isInClaudeScope && jobAgeMs < 10min && claimedBy !== 'cron'`. Safety valve: reclaim `processing` jobs whose `claimed_at`/`started_at` > 15 min ago (extend the existing >2min stuck-reset to respect `claimed_by='claude'` with the 15-min window).

- [ ] Write failing tests for `shouldCronSkip` truth table (live+in-scope+young → skip; live+in-scope+old → take; offline → take; out-of-scope → take).
- [ ] Implement the predicate + wire into the claim loop: before the cron claims a pending job, compute claudeLive once per run (`isClaudeLive`), and for high-value in-scope young jobs, skip. Mark cron-claimed jobs `claimed_by='cron'`.
- [ ] Extend stuck-reset: `processing` + `claimed_by='claude'` + older than 15 min → reset to pending, clear claim.
- [ ] Full suite + `tsc` green.
- [ ] Commit `feat: cron respects live Claude worker scope + 15-min safety valve`.

---

### Task 5: Gemini floor confirm (trimmed single-call)
**Files:** Verify `lib/ai/generator.ts` DLS-mode single-call path is what runs when no template + no Claude. Modify only if it still hits the modular per-section path.

- [ ] Confirm routing: no template_id + industry has no approved template → single-call DLS generation (not modular). If the modular path can still trigger, gate it off. Add/confirm a test or a log assertion.
- [ ] Commit if changed `fix: ensure Gemini floor uses single-call path`.

---

### Task 6: Local Claude worker script (BUILD; USER RUNS)
**Files:** Create `scripts/claude-worker.ts`; `scripts/claude-worker.README.md`

**Behavior:** long-running loop — `writeHeartbeat` every 30s; each tick fetch pending unclaimed high-value jobs (`selectHighValue`), `claimJobForClaude`, then generate the project (reuse the app's generation but agentic: the script shells to the local generator OR, for v1, calls `generateAndSaveWebsite` in-process via tsx) and on success set the project a **template candidate** flag for approval. `--dry-run` claims + logs without generating. `--once` runs a single tick.

- [ ] Implement with `--dry-run`/`--once`; `tsc` clean; `--dry-run --once` executes against live DB claiming nothing destructive (dry-run must NOT claim).
- [ ] Write the README: how to run, auth expectation (Agent SDK via local Claude Code login; fallback `ANTHROPIC_API_KEY`), and the heartbeat behaviour.
- [ ] Commit `feat: local claude-worker script (dry-run + once)`.
- [ ] **HANDOFF:** the user runs `npx tsx scripts/claude-worker.ts` on their Mac — verifying real agentic generation + subscription auth is theirs to confirm. STOP the autonomous loop here.

## Self-Review
Covers spec Phase 1: heartbeat/liveness (T2), claim/races (T2), high-value top-10 + manual override (T3), safety valve (T4), Gemini floor (T5), worker (T6). Schema (T1) uses existing `niche_score`/adds `is_high_value`. Worker run is the human gate — correctly a handoff, not autonomous.
