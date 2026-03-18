# Roadmap: WebGen

## Overview

WebGen is a working bulk AI website generator that needs 12 improvements across reliability, intelligence, automation, and UX. The roadmap progresses from stabilizing the foundation (fixing 3 known bugs, decomposing the monolithic generator), through instrumenting every generation with cost/error/prompt data, to building quality intelligence and analytics on that data, then orchestrating the full end-to-end autopilot pipeline, and finally accelerating the review workflow with keyboard shortcuts, diffs, export, and preview prefetching. Each phase produces outputs consumed by later phases -- the dependency chain is strict and validated by research.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation Fixes** - Fix known bugs, decompose generator monolith, clean up codebase (completed 2026-03-17)
- [x] **Phase 2: Instrumentation** - Add cost tracking, error classification, prompt versioning, and queue health visibility (completed 2026-03-17)
- [x] **Phase 3: Quality and Intelligence** - Automated quality scoring, industry-aware template seeding, analytics dashboard (completed 2026-03-18)
- [x] **Phase 4: Batch Autopilot** - End-to-end pipeline orchestration from discovery to failure surfacing (completed 2026-03-18)
- [ ] **Phase 5: UX Acceleration** - Keyboard-driven review, diff view, static export, preview pre-rendering

## Phase Details

### Phase 1: Foundation Fixes
**Goal**: The generation pipeline is reliable and the codebase is modular enough to safely extend
**Depends on**: Nothing (first phase)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06
**Success Criteria** (what must be TRUE):
  1. When auto-fix fails both attempts, the project status is set to 'error' and the last fix attempt (not original broken code) is preserved for inspection
  2. Two concurrent queue workers processing the same batch never claim the same job -- duplicate claims are prevented at the database level
  3. Background generation failures are captured and surfaced (not silently swallowed by fire-and-forget promises)
  4. The system prompt lives in its own file outside generator.ts, and generator.ts is decomposed into focused modules under 300 lines each
  5. No debug .txt files remain in the codebase, and .gitignore prevents their return
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Fix auto-fix return value, queue race condition, fire-and-forget errors, remove debug files (FIX-01, FIX-02, FIX-03, FIX-06)
- [ ] 01-02-PLAN.md — Extract system prompt and decompose generator.ts into focused modules (FIX-04, FIX-05)

### Phase 2: Instrumentation
**Goal**: Every AI generation produces structured cost, error, and prompt version data, and the operator can monitor queue health in real time
**Depends on**: Phase 1
**Requirements**: COST-01, COST-02, COST-03, COST-04, ERR-01, ERR-02, ERR-03, ERR-04, PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04, QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04
**Success Criteria** (what must be TRUE):
  1. After any AI call (generation, enrichment, auto-fix), the user can query a cost record showing input tokens, output tokens, model, and estimated cost -- and the dashboard shows running monthly spend
  2. When a generation fails, the error is automatically classified into a specific category (syntax, render, missing sections, style, data mapping, timeout) with a targeted fix prompt, and the classification is stored on the project record
  3. The user can view all prompt versions, see which version was used for any generation, and switch the active prompt version before generating
  4. The queue admin page shows real-time job counts by status, highlights stuck jobs (processing > 10 min), and provides one-click retry/cancel with full error details
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD
- [ ] 02-04: TBD

### Phase 3: Quality and Intelligence
**Goal**: Generated websites are automatically scored for quality, generation leverages the best approved outputs as few-shot examples, and the user has visual analytics across all generations
**Depends on**: Phase 2
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, TMPL-01, TMPL-02, TMPL-03, TMPL-04, ANAL-01, ANAL-02, ANAL-03, ANAL-04
**Success Criteria** (what must be TRUE):
  1. Every completed generation has a 0-100 quality score (based on render success and section completeness) stored on its project record, and projects are sortable by score in the dashboard
  2. When generating for a specific industry, the system automatically injects 1-2 sanitized, high-quality approved templates from that industry as few-shot context
  3. The analytics dashboard shows success/failure rates over time, generation timing with p50/p95 breakdown, cost summaries per model, and all metrics are filterable by AI model and industry
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Quality scoring module, DB schema, generator hook, dashboard sort/badge (QUAL-01, QUAL-02, QUAL-03, QUAL-04)
- [ ] 03-02-PLAN.md — Template seeder with sanitization, few-shot injection into generation prompts (TMPL-01, TMPL-02, TMPL-03, TMPL-04)
- [ ] 03-03-PLAN.md — Analytics dashboard with recharts charts, timing/cost/success metrics, model/industry filters (ANAL-01, ANAL-02, ANAL-03, ANAL-04)

### Phase 4: Batch Autopilot
**Goal**: The user can trigger one button and walk away while the system discovers businesses, generates websites, scores quality, auto-fixes failures, and surfaces only the projects that need human attention
**Depends on**: Phase 3
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04
**Success Criteria** (what must be TRUE):
  1. A single button triggers the full pipeline: discover -> enqueue -> generate -> validate -> auto-fix -> report, with no manual steps required between stages
  2. When the pipeline completes, failed projects are surfaced with their error classification and context -- nothing is silently swallowed
  3. During pipeline execution, the user sees real-time progress (X of Y complete, Z failed) updating live
  4. If the server restarts mid-pipeline, the pipeline resumes from where it left off without duplicating work or losing progress
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — DB-backed state machine orchestrator, batch_runs schema, extracted discovery module, server actions (AUTO-01, AUTO-02, AUTO-04)
- [ ] 04-02-PLAN.md — AutopilotButton, BatchProgress, BatchReport UI components integrated into discovery panel (AUTO-01, AUTO-02, AUTO-03)

### Phase 5: UX Acceleration
**Goal**: The review workflow is fast enough that the user spends seconds per project -- keyboard-driven navigation, instant diffs, one-click export, and pre-loaded previews
**Depends on**: Phase 1 (core features are independent of Phases 2-4)
**Requirements**: KEY-01, KEY-02, KEY-03, KEY-04, DIFF-01, DIFF-02, DIFF-03, EXP-01, EXP-02, EXP-03, PRE-01, PRE-02, PRE-03
**Success Criteria** (what must be TRUE):
  1. The user can navigate the dashboard with j/k keys, and approve/regenerate/fix/edit with a/r/f/e keys, with a visible focus indicator and a ? help overlay
  2. Any two revisions can be compared side-by-side in both a Monaco code diff and a visual rendered preview diff, with a selectable revision history list
  3. The user can click one button in the editor to download a self-contained static HTML file (or .zip) with inlined Tailwind CSS, fonts, and icons -- no external dependencies
  4. Navigating to the next project during review loads instantly because the next 3-5 projects are prefetched in the background, with cache eviction as the user moves past them
**Plans**: TBD

Plans:
- [x] 05-01-PLAN.md -- Vim-style keyboard shortcuts (j/k/a/r/f/e/?) with focus-guard hook and help overlay (KEY-01, KEY-02, KEY-03, KEY-04)
- [ ] 05-02: TBD
- [ ] 05-03: TBD
- [ ] 05-04: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Fixes | 2/2 | Complete    | 2026-03-17 |
| 2. Instrumentation | 3/4 | Complete    | 2026-03-17 |
| 3. Quality and Intelligence | 0/3 | Complete    | 2026-03-18 |
| 4. Batch Autopilot | 0/2 | Complete    | 2026-03-18 |
| 5. UX Acceleration | 1/4 | In Progress | - |

---
*Roadmap created: 2026-03-18*
*Last updated: 2026-03-18*
