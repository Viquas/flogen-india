# claude-worker.ts — local Claude worker (Phase 1, v1)

## What it does

A long-running script you run on your own Mac. Each tick it:

1. Writes a heartbeat row (`generation_workers`, `worker_name='claude-local'`). While this
   heartbeat is fresh (< 90s old), the Vercel cron's queue processor backs off the top-10
   high-value pending jobs and leaves them for you instead of generating them itself.
2. Fetches up to 40 pending, unclaimed `queue_jobs`, joins their projects, and runs them
   through `selectHighValue()` — the same high-value ranking used everywhere else
   (`is_high_value` flag first, then `niche_score` / rating-derived score, capped at 10 by
   default).
3. For each chosen lead: atomically claims the job (`claimJobForClaude`), marks the project
   `generating`, and runs it through the existing generation pipeline
   (`generateAndSaveWebsite`). On success the pipeline itself sets the project to `review`;
   on failure it sets `error`. The worker marks the `queue_jobs` row `completed` or `failed`
   accordingly.
4. Logs a tick summary (heartbeat status, candidate count, chosen count, per-job outcome).

If you stop the worker (Ctrl+C), it writes one final `idle` heartbeat before exiting. Once
your heartbeat goes stale (>90s), the cron's safety valve takes those jobs back over so
nothing gets stuck.

## How to run

```bash
# 1. Dry run first — verifies wiring against the live DB, makes zero claims/generations.
npx tsx scripts/claude-worker.ts --dry-run --once

# 2. A single real tick (claims + generates up to --cap leads, default 10).
npx tsx scripts/claude-worker.ts --once

# 3. Run forever (heartbeat every 30s, a tick every ~60s). Ctrl+C to stop cleanly.
npx tsx scripts/claude-worker.ts
```

Flags:
- `--once` — run a single tick then exit (no forever-loop).
- `--dry-run` — claim nothing, generate nothing. Still writes the heartbeat (harmless and
  useful — it exercises the same backoff signal the cron reads). Logs what it *would* claim.
- `--cap N` — max leads per tick, default 10.

## Requirements

- `.env.local` in the repo root with the same Supabase + generation env vars the app uses
  locally (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, plus whatever
  Gemini/OpenRouter keys `lib/ai/generator.ts` needs). The script loads `.env.local` the same
  way `scripts/seed-award-templates.ts` does, before creating the Supabase client.
- Run it from the repo root (`npx tsx scripts/claude-worker.ts ...`).

## Safety valve

The cron only backs off a high-value job while your heartbeat is fresh, and only for jobs
younger than 10 minutes. If your Mac goes to sleep, loses network, or the script crashes, the
heartbeat goes stale and the cron resumes taking those jobs itself — nothing is permanently
stuck waiting on you. Jobs claimed by Claude that sit in `processing` for more than 15 minutes
(e.g. the worker died mid-generation) are reclaimed by the same safety valve.

---

## v2 upgrade — agentic Claude generation (not built here)

**v1** (this script) runs the existing `generateAndSaveWebsite` pipeline in-process — the same
Gemini/OpenRouter generation the Vercel cron uses. It does not use Claude to generate the
site; "Claude worker" currently just means "runs on your Mac and claims the high-value queue."

The intended **v2** swaps that generate step for actual agentic generation via the **Claude
Agent SDK**, running as Claude Sonnet under either:
- your local Claude Code login (subscription auth, no extra API cost), or
- an `ANTHROPIC_API_KEY` fallback for unattended/CI-style runs.

This is the documented next step, not implemented in Phase 1 Task 6. When it's built, the
claim/heartbeat/job-status plumbing in this file should stay the same — only the generation
call (`generateAndSaveWebsite(...)`) gets replaced with an agentic Claude call.
