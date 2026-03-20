# Phase 4: Batch Autopilot - Research

**Researched:** 2026-03-18
**Domain:** Pipeline orchestration, state machine design, crash recovery, real-time progress tracking
**Confidence:** HIGH

## Summary

Phase 4 implements the batch autopilot -- a single-button pipeline that chains discovery, enqueueing, generation, validation, auto-fix, quality scoring, and failure reporting into one unattended operation. The core technical challenge is building a **crash-recoverable state machine** backed by the existing `batches` table, so the pipeline can resume after server restart without duplicating work or silently swallowing failures.

The existing codebase already provides every building block the autopilot needs: the discovery endpoint (`api/discovery/google-places`), the queue system (`lib/queue.ts` with `addBatch`), the generation pipeline (`generateAndSaveWebsite` with quality scoring), the error classifier (`error-classifier.ts` with 7 categories and targeted fix prompts), and the auto-fix agent (`autoFixAllErrors` in `actions.ts`). The autopilot's job is to **orchestrate** these existing pieces into a sequenced pipeline with proper state tracking, progress reporting, and failure surfacing -- not to reimplement any of them.

**Primary recommendation:** Build `lib/autopilot.ts` as a state machine with 6 stages (DISCOVER, ENQUEUE, GENERATE, FIX, SCORE, DONE/FAILED). Persist pipeline state to a new `batch_runs` table (not `batches.metadata` JSONB -- see Architecture Patterns). Use polling-based progress tracking from the client against batch_run + queue_jobs + projects aggregation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTO-01 | One-button pipeline: discover -> enqueue -> generate -> validate -> auto-fix -> report | State machine in `lib/autopilot.ts` orchestrates existing endpoints/modules sequentially. New `batch_runs` table tracks pipeline stage. Server action `runAutopilot()` is the single entry point. |
| AUTO-02 | Failed projects surfaced with error context and classification after pipeline completes | After FIX stage, query projects WHERE batch_id = X AND status = 'error', join with error_type/error_details columns already on projects table. Build a `BatchReport` component showing failures grouped by error category. |
| AUTO-03 | Real-time batch progress visible (X of Y complete, Z failed) | Poll `batch_runs` row for current stage; aggregate queue_jobs + projects by batch_id for counts. Client polls every 3s during active run. Use existing queue_jobs.status + projects.status + projects.quality_score. |
| AUTO-04 | Pipeline resumes from interruption without duplication (idempotent resume) | `batch_runs.current_stage` persisted to DB at each transition. On resume, check stage: DISCOVER idempotent (skip if projects exist for batch), ENQUEUE idempotent (queue dedup constraint), GENERATE/FIX resume by re-checking project statuses. Each stage checks completion before re-running. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | existing | State persistence, batch_runs table, project/queue queries | Already in stack; all state lives in Supabase |
| Next.js Server Actions | existing | Entry point for autopilot trigger and progress polling | Already used for all dashboard mutations |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | existing | Duration formatting for progress display | Already in project dependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom state machine in `lib/autopilot.ts` | Inngest / QStash / Temporal | External services add infrastructure dependency. This is an internal tool running on a single server (dev mode or VPS per code comments). Custom state machine is simpler and sufficient. |
| Polling for progress | Supabase Realtime subscriptions | Realtime is already enabled for `projects` table. However, polling is simpler to implement and debug, and the project already uses polling patterns (queue 2s poll, queue dashboard). Realtime could be a future enhancement. |
| New `batch_runs` table | Storing state in `batches.metadata` JSONB | JSONB is untyped, harder to query/index, and the existing `batches` table has limited status enum ('processing'/'completed'/'failed'). A dedicated table with proper columns is cleaner and enables SQL queries for progress aggregation. |

**Installation:**
```bash
# No new packages needed -- all dependencies already in project
```

## Architecture Patterns

### Recommended Project Structure

```
webgen/
├── lib/
│   ├── autopilot.ts              # State machine: orchestrator module
│   └── autopilot-types.ts        # Types: BatchRun, PipelineStage, BatchReport
├── app/
│   ├── dashboard/
│   │   ├── actions.ts            # Extended: runAutopilot(), getAutopilotProgress(), resumeAutopilot()
│   │   └── autopilot/
│   │       └── batch-progress.tsx # Client component: real-time progress display
│   └── api/                      # No new API routes needed -- use server actions
├── components/
│   └── dashboard/
│       ├── autopilot-button.tsx   # "Run Autopilot" button with config options
│       └── batch-report.tsx       # Failure report with error classification grouping
└── types/
    └── database.ts               # Extended: batch_runs table types
```

### Pattern 1: DB-Backed State Machine

**What:** Each autopilot run is a row in `batch_runs` with a `current_stage` column. The orchestrator advances the stage and persists to DB before executing each stage's work. On crash recovery, the orchestrator reads `current_stage` and resumes from that point.

**When to use:** Any multi-step pipeline that must survive process crashes.

**Example:**
```typescript
// lib/autopilot-types.ts
export type PipelineStage =
  | 'pending'      // Created, not started
  | 'discovering'  // Calling Google Places API
  | 'enqueueing'   // Adding projects to generation queue
  | 'generating'   // Waiting for queue to drain
  | 'fixing'       // Running autoFixAllErrors on failures
  | 'scoring'      // Aggregating final quality scores
  | 'completed'    // Pipeline finished successfully
  | 'failed'       // Pipeline aborted due to unrecoverable error

export interface BatchRun {
  id: string
  batch_id: string | null       // FK to batches table (set after DISCOVER stage)
  current_stage: PipelineStage
  config: {                     // Frozen at creation time
    query: string
    location: string
    industry: string
    entries: number
    templateId?: string
    autoFixEnabled: boolean
    qualityThreshold: number    // Projects below this score get auto-fixed
  }
  progress: {                   // Updated at each stage transition
    total_projects: number
    generated: number
    fixed: number
    failed: number
    avg_quality_score: number | null
  }
  error_message: string | null  // If stage fails, capture why
  started_at: string
  completed_at: string | null
  updated_at: string
}
```

### Pattern 2: Idempotent Stage Execution

**What:** Each stage checks its preconditions before running. If the stage's work is already done (e.g., projects already exist for this batch), it skips to the next stage. This makes resume after crash safe.

**When to use:** Every stage of the autopilot pipeline.

**Example:**
```typescript
// Pseudocode for the DISCOVER stage
async function executeDiscoverStage(run: BatchRun): Promise<void> {
  // Idempotency check: if batch_id already set and projects exist, skip
  if (run.batch_id) {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', run.batch_id)
    if (count && count > 0) {
      // Discovery already completed, advance to next stage
      await advanceStage(run.id, 'enqueueing')
      return
    }
  }

  // Execute discovery (calls the existing Google Places API logic)
  const result = await discoverBusinesses(run.config)

  // Persist batch_id and project count before advancing
  await supabase.from('batch_runs').update({
    batch_id: result.batchId,
    progress: { ...run.progress, total_projects: result.count },
    current_stage: 'enqueueing',
    updated_at: new Date().toISOString(),
  }).eq('id', run.id)
}
```

### Pattern 3: Stage-Aware Progress Polling

**What:** The client polls a single server action that reads `batch_runs.current_stage` and aggregates project/queue counts for the current batch. Different stages return different progress shapes.

**When to use:** Real-time progress display during autopilot execution.

**Example:**
```typescript
// Server action: getAutopilotProgress(runId)
// Returns: { stage, progress: { total, generated, failed, fixing }, isComplete }

// Client: poll every 3 seconds
useEffect(() => {
  if (!runId || isComplete) return
  const interval = setInterval(async () => {
    const progress = await getAutopilotProgress(runId)
    setProgress(progress)
    if (progress.isComplete) clearInterval(interval)
  }, 3000)
  return () => clearInterval(interval)
}, [runId, isComplete])
```

### Anti-Patterns to Avoid

- **In-memory state machine:** Do NOT store pipeline state only in the Node.js process. Server restarts, hot reloads, and serverless cold starts will lose it. Always persist to DB.
- **Calling the discovery API route from server-side:** The existing `/api/discovery/google-places` route does discovery + project creation + queue enqueueing all in one call. The autopilot should extract and reuse the logic, not HTTP-call its own API route. Alternatively, call the route handler function directly, but structure the autopilot so each stage is separately resumable.
- **Fire-and-forget for the whole pipeline:** The existing `autoFixAllErrors` uses `Promise.allSettled` which is correct, but the overall pipeline must NOT be fire-and-forget. The batch_run row must always reach a terminal state (completed/failed).
- **Polling inside the server process:** The queue already has a `process()` loop with 2s polling. The autopilot should NOT add another polling loop on the server. Instead, after enqueueing, the autopilot waits for the queue to drain by periodically checking queue_jobs status for the batch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Discovery + project creation | New discovery logic | Existing `api/discovery/google-places/route.ts` logic (extract into a callable function) | The route already handles Google Places pagination, dedup, batch creation, and project insertion. 230 lines of battle-tested code. |
| Generation orchestration | New generation pipeline | Existing `generationQueue.addBatch()` + `queue.process()` | The queue already handles concurrency (3 slots), job claiming with optimistic locks, stuck job recovery, and error tracking. |
| Auto-fix with error classification | New fix logic | Existing `autoFixAllErrors()` + `fixWebsiteErrors()` + `classifyError()` | Already handles concurrent fixing (3 slots), enrichment, targeted fix prompts per error category. |
| Quality scoring | New scoring | Existing `scoreGeneratedCode()` fire-and-forget hook in generator | Already runs after every generation automatically. Autopilot just needs to read the results. |
| Progress aggregation | Custom event system | SQL COUNT queries on queue_jobs + projects by batch_id | Simple, no infrastructure, matches existing patterns. |

**Key insight:** The autopilot is pure orchestration. Every pipeline stage already exists as a working module. The value is in the state machine, crash recovery, and failure surfacing -- not in reimplementing generation or fixing.

## Common Pitfalls

### Pitfall 1: Batch Silently Swallows Failures (P1 from PITFALLS.md)

**What goes wrong:** Batch completes "50/50 done" but 15 projects are actually broken. The auto-fix returned original broken code (now fixed in Phase 1), but the batch report doesn't distinguish "generated but low quality" from "truly failed."

**Why it happens:** The existing `generateAndSaveWebsite` sets status to 'review' even for projects that barely pass validation. A project with quality_score=20 and a project with quality_score=90 both show as "completed."

**How to avoid:**
- After the FIX stage, classify each project into a terminal result: `success` (quality >= threshold), `fixed` (was error, auto-fix succeeded), `needs_review` (quality below threshold but code exists), `failed` (status='error' after fix attempts).
- Store this per-project result in the `batch_runs.progress` JSON or a computed field.
- The batch report UI groups projects by these categories, not by raw project status.
- NEVER mark a batch_run as 'completed' until every project has been evaluated.

**Warning signs:** Batch reports always show 100% success. Users find broken sites during manual review that the autopilot called "done."

### Pitfall 2: Discovery-Enqueueing is Not Atomic

**What goes wrong:** The discovery step creates projects and enqueues them in one API call. If the server crashes between project creation and queue enqueueing, you have orphaned projects in 'queued' status with no queue_jobs.

**Why it happens:** The existing `/api/discovery/google-places/route.ts` does `insert projects` then `addBatch(projectIds)` as two separate operations. The addBatch is fire-and-forget relative to the HTTP response.

**How to avoid:**
- In the autopilot, DISCOVER stage creates the batch + projects. ENQUEUE stage separately reads un-enqueued projects for the batch and adds them to the queue.
- On resume, ENQUEUE checks: "which projects in this batch have no queue_job?" and enqueues only those.
- This two-stage approach makes each stage independently idempotent.

**Warning signs:** Projects stuck in 'queued' status with no corresponding queue_job row.

### Pitfall 3: Generation Wait Loop Never Terminates

**What goes wrong:** The autopilot waits for all queue jobs to complete for the batch, but some jobs get stuck in 'processing' forever (the known stuck-job issue). The autopilot hangs indefinitely.

**Why it happens:** The existing `resetStuckProjects()` has a 10-minute threshold, but the autopilot might not invoke it. The queue's `recoverStuckJobs()` runs on module load but not periodically during autopilot execution.

**How to avoid:**
- The GENERATE stage has a maximum wait time (e.g., `entries * 120 seconds` with a floor of 5 minutes and ceiling of 60 minutes).
- Every poll cycle (3s), check for stuck processing jobs (started_at > 5 min ago) and auto-reset them to 'pending' for retry.
- After the timeout, any remaining 'processing' or 'pending' jobs are forcefully marked as 'failed' and the pipeline advances to the FIX stage.
- The `batch_runs.progress` captures how many were force-failed.

**Warning signs:** Autopilot shows "Generating... X/Y" for more than 30 minutes without progress.

### Pitfall 4: Resume Creates Duplicate Projects

**What goes wrong:** Server crashes during DISCOVER. On resume, the autopilot re-runs discovery with the same query, creating a second set of duplicate projects and a second batch.

**Why it happens:** The discovery step is not idempotent -- it always creates new projects.

**How to avoid:**
- The DISCOVER stage sets `batch_runs.batch_id` immediately after batch creation, before enqueueing.
- On resume, if `batch_runs.batch_id` is not null, skip DISCOVER entirely and proceed to ENQUEUE.
- If `batch_runs.batch_id` is null but `current_stage = 'discovering'`, it means discovery didn't complete. Re-run it (the dedup check against existing placeIds in the discovery endpoint already prevents exact duplicates from Google Places).

**Warning signs:** Two batches with identical project names created within minutes of each other.

## Code Examples

### Autopilot Orchestrator Entry Point

```typescript
// lib/autopilot.ts
export async function runAutopilotPipeline(runId: string): Promise<void> {
  const supabase = createAdminClient()

  // Load the batch run record
  const { data: run } = await supabase
    .from('batch_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (!run) throw new Error(`BatchRun ${runId} not found`)

  // Stage execution loop -- each stage advances the DB state
  const stageHandlers: Record<string, (run: BatchRun) => Promise<void>> = {
    pending: executeDiscoverStage,
    discovering: executeDiscoverStage,    // Resume = re-enter same stage
    enqueueing: executeEnqueueStage,
    generating: executeGenerateStage,
    fixing: executeFixStage,
    scoring: executeScoringStage,
  }

  let currentStage = run.current_stage

  while (currentStage !== 'completed' && currentStage !== 'failed') {
    const handler = stageHandlers[currentStage]
    if (!handler) {
      await markFailed(runId, `Unknown stage: ${currentStage}`)
      return
    }

    try {
      // Re-read the run to get latest state
      const { data: freshRun } = await supabase
        .from('batch_runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (!freshRun) throw new Error('Run disappeared')

      await handler(freshRun as unknown as BatchRun)

      // Re-read to get the stage the handler advanced to
      const { data: updated } = await supabase
        .from('batch_runs')
        .select('current_stage')
        .eq('id', runId)
        .single()

      currentStage = updated?.current_stage ?? 'failed'
    } catch (err) {
      await markFailed(runId, err instanceof Error ? err.message : String(err))
      return
    }
  }
}
```

### Schema for batch_runs Table

```sql
-- Phase 4: Batch Autopilot
CREATE TABLE IF NOT EXISTS batch_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    current_stage TEXT NOT NULL DEFAULT 'pending'
        CHECK (current_stage IN ('pending', 'discovering', 'enqueueing', 'generating', 'fixing', 'scoring', 'completed', 'failed')),
    config JSONB NOT NULL,           -- Frozen pipeline configuration
    progress JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Running progress counters
    error_message TEXT DEFAULT NULL,  -- Failure reason if stage errors
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_runs_stage ON batch_runs(current_stage) WHERE current_stage NOT IN ('completed', 'failed');
CREATE INDEX IF NOT EXISTS idx_batch_runs_batch ON batch_runs(batch_id);

ALTER TABLE batch_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to batch_runs" ON batch_runs FOR ALL USING (true) WITH CHECK (true);
```

### Progress Aggregation Query

```typescript
// Server action: getAutopilotProgress(runId)
export async function getAutopilotProgress(runId: string) {
  const supabase = createAdminClient()

  const { data: run } = await supabase
    .from('batch_runs')
    .select('current_stage, batch_id, config, progress, error_message, started_at, completed_at')
    .eq('id', runId)
    .single()

  if (!run || !run.batch_id) {
    return { stage: run?.current_stage ?? 'unknown', progress: null, isComplete: false }
  }

  // Aggregate project statuses for this batch
  const { data: projects } = await supabase
    .from('projects')
    .select('status, quality_score, error_type')
    .eq('batch_id', run.batch_id)

  const counts = {
    total: projects?.length ?? 0,
    generated: projects?.filter(p => p.status === 'review' || p.status === 'approved').length ?? 0,
    error: projects?.filter(p => p.status === 'error').length ?? 0,
    generating: projects?.filter(p => p.status === 'generating' || p.status === 'queued').length ?? 0,
    avgQuality: null as number | null,
  }

  const scored = projects?.filter(p => p.quality_score != null) ?? []
  if (scored.length > 0) {
    counts.avgQuality = Math.round(scored.reduce((s, p) => s + (p.quality_score ?? 0), 0) / scored.length)
  }

  const isComplete = run.current_stage === 'completed' || run.current_stage === 'failed'

  return {
    stage: run.current_stage,
    progress: counts,
    config: run.config,
    errorMessage: run.error_message,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    isComplete,
  }
}
```

### Batch Report Component (Failure Surfacing)

```typescript
// Pattern for batch-report.tsx -- groups failures by error category
interface BatchReportProps {
  batchId: string
  projects: Array<{
    id: string
    businessName: string
    status: string
    error_type: string | null
    error_details: string | null
    quality_score: number | null
  }>
}

// Group failed projects by error_type for actionable failure report
// Uses the ErrorType enum from error-classifier.ts
// Display: "3 Syntax Errors, 2 Missing Sections, 1 Timeout"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fire-and-forget batch generation | DB-backed state machine with resume | This phase | Pipeline survives crashes, failures are visible |
| `batches.metadata` JSONB for state | Dedicated `batch_runs` table with typed columns | This phase | Queryable, indexable, typed pipeline state |
| Manual discovery -> manual fix -> manual review | Single-button autopilot | This phase | Core value proposition: hands-off generation |
| Failures visible only in console.log | Failure report with error classification grouping | This phase | Nothing silently swallowed |

**Deprecated/outdated:**
- The existing `batches.status` field ('processing'/'completed'/'failed') is too coarse for autopilot. The `batch_runs` table supersedes it for autopilot-managed batches. Non-autopilot batches (manual discovery) continue using `batches` directly.

## Open Questions

1. **Discovery extraction vs. API self-call**
   - What we know: The discovery logic is in a 230-line API route handler. The autopilot needs to call this logic from a server action.
   - What's unclear: Should we extract the discovery logic into a `lib/discovery.ts` module (cleaner separation) or call the API route handler function directly (less refactoring)?
   - Recommendation: Extract into `lib/discovery.ts`. The route handler can then import from it, and the autopilot imports from it. This is a minor refactor (move the function, keep the route as a thin wrapper) but gives clean module boundaries. **Confidence: HIGH** -- this follows the existing pattern of extracting logic into lib/ modules (queue.ts, quality-scorer.ts, error-classifier.ts).

2. **Quality threshold for auto-fix trigger**
   - What we know: Quality scorer produces 0-100. Projects with status='error' clearly need fixing. But what about projects with status='review' and quality_score=35?
   - What's unclear: What quality threshold should trigger auto-fix? Too low and you miss fixable issues; too high and you waste LLM calls on projects that are fine.
   - Recommendation: Default threshold of 50 (configurable in batch_runs.config). Projects below 50 with status='review' get sent through `fixWebsiteErrors()`. This is a config value the user can tune, not a hardcoded constant. **Confidence: MEDIUM** -- the threshold needs real-world calibration.

3. **Concurrent autopilot runs**
   - What we know: Single-user tool. But the user might accidentally trigger two autopilot runs.
   - What's unclear: Should we enforce single-active-run?
   - Recommendation: Allow multiple concurrent runs (each has its own batch_id and operates on separate projects). Add a warning in the UI if a run is already active, but don't block. The queue system already handles concurrency internally. **Confidence: HIGH** -- simplicity wins for single-user tool.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `lib/queue.ts`, `app/api/discovery/google-places/route.ts`, `app/dashboard/actions.ts`, `lib/ai/generator.ts`, `lib/ai/error-classifier.ts`, `lib/ai/quality-scorer.ts`, `types/database.ts`, `setup_supabase.sql`
- ARCHITECTURE.md -- Autopilot orchestrator design (component #1)
- FEATURES.md -- Batch autopilot table stakes analysis
- PITFALLS.md -- P1 (batch swallows failures silently)

### Secondary (MEDIUM confidence)
- Phase 2 summary (02-01-SUMMARY.md) -- Error classifier and cost tracker patterns established
- Phase 3 summary (03-01-SUMMARY.md) -- Quality scorer wired into generator pipeline

### Tertiary (LOW confidence)
- None -- all findings based on direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies needed; all building blocks exist in codebase
- Architecture: HIGH - State machine pattern is well-understood; DB schema follows existing conventions
- Pitfalls: HIGH - P1 from PITFALLS.md directly addresses the primary risk; other pitfalls derived from codebase analysis

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, no external dependency changes expected)
