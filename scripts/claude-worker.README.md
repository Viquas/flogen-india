# claude-worker.ts — local Claude worker (v2)

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
   `generating`, and generates the site. By default this is `generateSiteViaClaude` — one
   strong call to your locally logged-in `claude` CLI (see "v2 — Claude CLI generation"
   below). Pass `--gemini` to fall back to the old in-process `generateAndSaveWebsite`
   pipeline (Gemini/OpenRouter). On success the generation call sets the project to `review`;
   on failure it sets `error`. The worker marks the `queue_jobs` row `completed` or `failed`
   accordingly.
4. Logs a tick summary (heartbeat status, candidate count, chosen count, per-job outcome,
   which engine — `via claude-cli` or `via gemini`).

If you stop the worker (Ctrl+C), it writes one final `idle` heartbeat before exiting. Once
your heartbeat goes stale (>90s), the cron's safety valve takes those jobs back over so
nothing gets stuck.

## How to run

```bash
# 1. Dry run first — verifies wiring against the live DB, makes zero claims/generations.
npx tsx scripts/claude-worker.ts --dry-run --once

# 2. A single real tick via the Claude CLI (claims + generates up to --cap leads, default 10).
npx tsx scripts/claude-worker.ts --once

# 3. A single real tick via the old Gemini/OpenRouter path instead.
npx tsx scripts/claude-worker.ts --once --gemini

# 4. Run forever (heartbeat every 30s, a tick every ~60s). Ctrl+C to stop cleanly.
npx tsx scripts/claude-worker.ts
```

Flags:
- `--once` — run a single tick then exit (no forever-loop).
- `--dry-run` — claim nothing, generate nothing. Still writes the heartbeat (harmless and
  useful — it exercises the same backoff signal the cron reads). Logs what it *would* claim.
- `--cap N` — max leads per tick, default 10.
- `--gemini` — use the old `generateAndSaveWebsite` (Gemini/OpenRouter) path instead of the
  default Claude CLI path.

## Requirements

- `.env.local` in the repo root with the same Supabase + generation env vars the app uses
  locally (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, plus whatever
  Gemini/OpenRouter keys `lib/ai/generator.ts` needs if you run with `--gemini`). The script
  loads `.env.local` the same way `scripts/seed-award-templates.ts` does, before creating the
  Supabase client.
- For the default Claude CLI path: the `claude` CLI installed and logged in (`claude login`)
  under the account whose subscription you want to use. If it's missing, `generateSiteViaClaude`
  fails with an actionable error telling you to install/log in or re-run with `--gemini`.
- Run it from the repo root (`npx tsx scripts/claude-worker.ts ...`).

## Safety valve

The cron only backs off a high-value job while your heartbeat is fresh, and only for jobs
younger than 10 minutes. If your Mac goes to sleep, loses network, or the script crashes, the
heartbeat goes stale and the cron resumes taking those jobs itself — nothing is permanently
stuck waiting on you. Jobs claimed by Claude that sit in `processing` for more than 15 minutes
(e.g. the worker died mid-generation) are reclaimed by the same safety valve.

---

## v2 — Claude CLI generation (default)

The Claude path is now the default generation engine. Instead of an in-process AI SDK call,
`generateSiteViaClaude` (`lib/generation/claude-cli.ts`) shells out to your locally logged-in
`claude` CLI in non-interactive print mode (`claude -p --model sonnet --output-format text
--disallowed-tools Bash Edit Write Read WebFetch WebSearch`), writes one self-contained
award-grade prompt to stdin (architecture + contrast rules, craft-core non-negotiables, niche
design-knowledge, and the real business data — including real Google Places photo URLs), and
collects the single-file React component from stdout. This uses your **Claude subscription**,
not the Anthropic API — no extra per-generation API cost.

`--gemini` forces the old in-process `generateAndSaveWebsite` (Gemini/OpenRouter) path. The
claim/heartbeat/job-status plumbing is identical either way — only the generation step differs,
and the tick log tells you which one ran (`via claude-cli` / `via gemini`).

**COMPLIANCE:** the Claude subscription is licensed for interactive/personal use. This path is
fine for your own low-volume, high-value leads run from your own Mac. A commercial production
backend generating at real volume should switch to the Anthropic API instead (`ANTHROPIC_API_KEY`
+ the Anthropic SDK) rather than scripting the subscription CLI. That swap is localized —
`runClaudeCLI` in `lib/generation/claude-cli.ts` is the only place that would need to change.
