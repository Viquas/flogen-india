# Project Research Summary

**Project:** WebGen -- 12 Improvements for Internal Bulk AI Website Generator
**Domain:** AI-powered bulk website generation (Next.js 16 + Supabase + AI SDK v6)
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

WebGen is a single-user internal tool that bulk-generates business websites using AI (Gemini, OpenAI, OpenRouter) on a Next.js 16 + Supabase + shadcn/ui stack. The 12 planned improvements fall into four categories: pipeline automation (batch autopilot), quality infrastructure (scoring, error classification, prompt versioning, few-shot templates), observability (cost tracking, analytics dashboard, queue monitoring), and UX acceleration (keyboard shortcuts, diff view, export, preview pre-rendering). The existing codebase already provides the foundational infrastructure -- queue system, template table, revision history, HTML boilerplate -- so most features extend rather than replace. Only 2-4 new npm packages are needed (recharts, diff, optionally puppeteer and jszip), and all persistence stays within Supabase.

The recommended approach is to build foundation-first: instrument the generator with cost tracking, error classification, and prompt versioning before attempting the batch autopilot. This is because the autopilot depends on accurate error handling, quality scoring, and cost visibility to make intelligent decisions. The single most important architectural decision is to modularize `generator.ts` (currently 1456 lines with a 1000+ line inline system prompt) by extracting concerns into dedicated modules (`cost-tracker.ts`, `error-classifier.ts`, `quality-scorer.ts`, `prompts.ts`, `template-seeder.ts`). Every downstream feature benefits from this decomposition.

The primary risks are: (1) building on top of 3 known bugs (auto-fix returns original broken code, queue race condition, fire-and-forget async) that will cascade into every new feature, (2) quality scoring that measures syntax instead of semantics, producing false confidence, and (3) batch automation that silently swallows failures. All three are mitigable with a focused Phase 0 that fixes existing bugs before feature work begins. The 12 features are achievable with the existing stack and minimal new dependencies, but ordering matters -- building the orchestration layer (autopilot) before its dependencies (scoring, classification) will produce an unreliable system.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, Supabase, AI SDK v6, shadcn/ui, Monaco Editor) handles 10 of 12 features with zero new dependencies. The stack research explicitly rejected heavy alternatives (BullMQ/Redis, Temporal, LangChain, Playwright, Tremor, Sentry/Helicone) in favor of extending existing patterns. This is the right call for a single-user internal tool.

**New dependencies (confirmed needed):**
- `recharts` ^2.15: React charting for analytics dashboard -- standard choice, tree-shakeable, 450KB
- `diff` ^7: Server-side diff computation for revision summaries -- 25KB, used alongside Monaco's built-in diff editor

**New dependencies (recommended, optional):**
- `puppeteer` ^24: Headless Chrome for quality scoring visual checks and screenshot capture -- heavy (300MB Chrome binary) but enables render-based quality validation
- `jszip` ^3.10: ZIP archive creation for batch export -- 45KB, only needed if single-file HTML download is insufficient

**Key stack decisions:**
- Supabase remains the single data store (no Redis, no external caching)
- State machine pattern for batch autopilot (no workflow engines)
- Monaco Editor reused for all code display needs (diff view, prompt editing)
- Server components for data-heavy pages (analytics, queue admin); client components for interactive pages (review workflow, editor)

### Expected Features

**Must have (table stakes -- required for each feature to be useful):**
- Batch autopilot: full pipeline chain with failure escalation, progress tracking, and idempotent resume
- Quality scoring: render success check, section completeness, aggregated 0-100 score
- Cost tracking: per-generation token logging, cost estimation, persistent storage, visible running total
- Error classification: error taxonomy, automatic classification, category-specific fix prompts
- Prompt versioning: prompt extraction from generator.ts, version tagging per generation, version switching
- Queue health: status display, stuck job detection, manual retry/cancel
- Keyboard shortcuts: j/k navigation, a/r/f/e actions, visual focus indicator, ? help overlay
- Diff view: side-by-side Monaco diff, revision history list, visual preview diff
- Export: single-file HTML export, asset bundling, download button
- Analytics: success/failure rate, generation timing, filterable by model/industry, cost summary
- Template seeding: industry tagging, automatic few-shot injection, quality-based example selection
- Pre-rendering: prefetch next N project data, cache management, instant preview switching

**Should have (differentiators -- build if time allows):**
- Configurable autopilot pipeline stages (skip enrichment, add review gates)
- Visual regression scoring via headless browser screenshots
- Negative few-shot examples for better LLM contrast learning
- Budget alerts for cost tracking
- A/B testing for prompt versions
- Batch select (Shift+j/k) for keyboard shortcuts
- AI-generated change summaries alongside diffs
- Failure pattern heatmaps in analytics

**Defer to v2+:**
- Scheduled/cron-based autopilot runs
- Vercel/Netlify deploy integration
- Multi-page export
- Custom domain mapping
- Custom report builder for analytics
- Auto-optimization of prompts via LLM

### Architecture Approach

The 12 features integrate as modular extensions to the existing 4-layer architecture (Presentation, API Routes, Business Logic, Data Access). The key insight is that 4 features (#3 template seeding, #4 cost tracking, #7 error classification, #10 prompt versioning) all modify `generator.ts`, making its decomposition the critical prerequisite. Each feature becomes its own module with a clear interface, called by the generator rather than added to it.

**Major components (new):**
1. **Autopilot Orchestrator** (`lib/autopilot.ts`) -- state machine coordinating discover-enqueue-generate-fix-score pipeline; persists state to `batches.metadata` for crash recovery
2. **Quality Scorer** (`lib/ai/quality-scorer.ts`) -- pure function evaluating generated code on render success, section count, structure; hooks into `updateProjectWithCode()`
3. **Cost Tracker** (`lib/ai/cost-tracker.ts`) -- wrapper around AI SDK's `generateText`/`streamText` that captures usage metadata from every call site
4. **Error Classifier** (`lib/ai/error-classifier.ts`) -- AST-based error categorization with separate routing table mapping categories to fix strategies
5. **Prompt Manager** (`lib/ai/prompts.ts`) -- versioned prompt loading with in-memory cache, fallback to hardcoded prompt, version tagging per generation
6. **Template Seeder** (`lib/ai/template-seeder.ts`) -- queries top-rated templates by industry, sanitizes and injects as few-shot context
7. **Export Bundler** (`lib/export/bundler.ts`) -- extends existing `html-boilerplate.ts` to produce downloadable static HTML bundles

**Schema additions (all additive, no breaking changes):**
- New tables: `generation_costs`, `prompt_versions`, `project_scores`, `batch_runs`
- New columns: `projects.quality_score` (JSONB), `projects.prompt_version` (text), `projects.error_classification` (text), `queue_jobs.started_at/completed_at` (timestamptz), `queue_jobs.error_type` (text)

### Critical Pitfalls

1. **Batch automation silently swallows failures (P1)** -- The existing fire-and-forget pattern and auto-fix bug (returns original broken code) will produce batch reports that claim 100% success while 30% of outputs are broken. Fix: add terminal `batch_result` status per project, fix the auto-fix return bug, require explicit failure surfacing before batch completion.

2. **Quality scoring measures the wrong things (P2)** -- Syntactic checks (has hero, has footer, code compiles) produce false confidence. Pages score 95/100 but look terrible. Fix: work backwards from actual rejection reasons, include headless browser render check, start with 3-5 high-signal dimensions, track score vs. manual approval rate correlation.

3. **Few-shot templates poison output quality (P3)** -- Approved code contains business-specific data that bleeds into new generations. Fix: sanitize templates by replacing content with placeholders before injection, limit to 1 example per generation, use excerpts (50-80 lines) not full page code.

4. **Error classification creates fix loops (P7)** -- Classifier detects error -> fix creates new error -> classifier detects new error -> infinite loop. Fix: implement loop detection (hash error type + code region, abort if same hash appears twice), track fix success rate per category, route low-success categories directly to manual review.

5. **Building features on a broken foundation (CC1)** -- All 12 features inherit 3 known bugs. Fix: dedicate Phase 0 to fixing auto-fix return bug, queue race condition, and fire-and-forget async chains. Budget 1-2 days. This prevents cascading issues across every feature.

## Implications for Roadmap

Based on combined research, the following phase structure is recommended. The ordering is driven by dependency chains (features that other features consume must come first) and risk mitigation (fix bugs before building on them).

### Phase 0: Foundation Fixes
**Rationale:** All 4 research files independently flag the same 3 bugs as blocking. PITFALLS.md calls this out as cross-cutting concern CC1. ARCHITECTURE.md identifies the generator monolith as a risk area. This must come first.
**Delivers:** Stable foundation for all 12 features; decomposed generator.ts
**Addresses:** CC1 (features on broken foundation), CC3 (monolith grows)
**Work:**
- Fix auto-fix return-original-code bug in generator.ts
- Fix queue race condition with DB uniqueness constraint
- Replace fire-and-forget async with error tracking
- Extract 1000+ line system prompt from generator.ts to separate file
- Add database indexes for analytics queries: `(status, created_at)`, `(model, created_at)`, `(batch_id, status)`
**Avoids:** P1, P7, P11, CC1, CC3

### Phase 1: Instrumentation Layer
**Rationale:** Cost tracking (#4), error classification (#7), and prompt versioning (#10) are foundational data producers that every downstream feature consumes. STACK.md, FEATURES.md, and ARCHITECTURE.md all agree these are zero-dependency, small/medium complexity, and should come first. Queue health UI (#11) reads existing data and provides immediate operational visibility.
**Delivers:** Per-generation cost records, classified errors, versioned prompts, queue admin panel
**Addresses:** Features #4 (S complexity), #7 (M), #10 (M), #11 (S)
**Uses:** AI SDK usage metadata, Babel AST parsing (@babel/standalone already in deps), Supabase tables
**Avoids:** P4 (instrument at SDK level, not app level), P7 (decouple classification from fix strategies), P10 (tag every generation with prompt version), P11 (fix queue bugs first in Phase 0)

### Phase 2: Quality and Intelligence
**Rationale:** Quality scoring (#2) and template seeding (#3) depend on Phase 1 outputs (prompt versioning for prompt-quality correlation, error classification for scoring). Analytics dashboard (#9) needs cost and quality data to display. These three compose Phase 1 modules into user-facing value.
**Delivers:** Automated quality scores per generation, industry-aware few-shot prompting, visual analytics
**Addresses:** Features #2 (L complexity), #3 (M), #9 (L)
**Uses:** `recharts` for analytics charts, existing templates table for few-shot seeding
**Avoids:** P2 (start with high-signal dimensions, not comprehensive scoring), P3 (sanitize templates, limit to 1 example, use excerpts), P9 (add indexes in Phase 0, use time-windowed queries)

### Phase 3: Orchestration
**Rationale:** Batch autopilot (#1) is the highest-value feature but has the most dependencies (quality scoring for auto-approve/reject, error classification for targeted fixes, cost tracking for budget awareness). All research files agree it must come after its dependencies. This is the XL-complexity capstone feature.
**Delivers:** One-button end-to-end pipeline: discover -> generate -> score -> auto-fix -> surface failures
**Addresses:** Feature #1 (XL complexity)
**Implements:** State machine orchestrator (lib/autopilot.ts) coordinating all Phase 1 and Phase 2 modules
**Avoids:** P1 (terminal batch_result status per project, explicit failure surfacing, never mark batch complete until all projects resolved)

### Phase 4: UX Acceleration
**Rationale:** Keyboard shortcuts (#6), diff view (#8), export (#5), and preview pre-rendering (#12) are independent UI features that enhance the review workflow. They have no upstream dependencies and can be built in any order. Grouping them last keeps focus on infrastructure first, but individual items could be pulled earlier if needed.
**Delivers:** Keyboard-driven review, revision comparison, static HTML export, instant preview navigation
**Addresses:** Features #6 (S), #8 (M), #5 (M), #12 (M)
**Uses:** `diff` package for server-side diffs, Monaco diff editor for visual comparison, `jszip` for export bundles, existing `html-boilerplate.ts` for export
**Avoids:** P6 (focus-aware shortcuts, check activeElement before firing, test with Monaco), P8 (use Monaco diff editor, add AI change summary), P5 (export full client-rendered bundle, not server-rendered HTML), P12 (prefetch data only, not browser instances; start with 2 projects not 5)

### Phase Ordering Rationale

- **Dependency chains drive order:** Phase 1 produces data (costs, error types, prompt versions) that Phase 2 consumes (quality scoring, analytics, template selection) which Phase 3 orchestrates (autopilot). Reversing this order produces features that lack the inputs they need.
- **Bug fixes gate everything:** The 3 known bugs (auto-fix, queue race, fire-and-forget) affect at minimum 6 of 12 features. Fixing them in Phase 0 prevents cascading failures.
- **Monolith decomposition is the bottleneck:** Features #3, #4, #7, and #10 all modify generator.ts. Extracting the system prompt and creating separate modules in Phase 0 prevents merge conflicts and enables parallel development in Phase 1.
- **UX features are safe to reorder:** Phase 4 items have no downstream dependents. If keyboard shortcuts or export are urgently needed, they can be pulled into an earlier phase without disrupting the dependency chain.
- **Analytics requires data to display:** The analytics dashboard is placed in Phase 2 (not Phase 4) because it provides critical feedback loops for quality scoring and cost optimization decisions that inform Phase 3 autopilot configuration.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Quality Scoring):** The scoring criteria need calibration against actual rejection reasons. Research recommends auditing 20-30 manually rejected projects to define dimensions. If Puppeteer-based visual scoring is pursued, serverless deployment constraints need investigation (@sparticuz/chromium for Vercel).
- **Phase 3 (Batch Autopilot):** State machine design for crash recovery is non-trivial. The idempotent resume requirement (survive server restart mid-pipeline) needs careful schema design for the `batch_runs` table and state persistence.

**Phases with standard patterns (skip research-phase):**
- **Phase 0 (Foundation Fixes):** All fixes are well-documented in CONCERNS.md with specific line numbers. No research needed.
- **Phase 1 (Instrumentation):** Cost tracking is straightforward AI SDK usage capture. Error classification uses existing Babel AST parsing. Prompt versioning is CRUD. Queue admin is UI over existing data.
- **Phase 4 (UX Acceleration):** Keyboard shortcuts, Monaco diff editor, HTML export, and data prefetching are all well-established patterns with zero ambiguity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack verified from package.json. New dependencies are mainstream, well-maintained packages. Explicit rejection rationale provided for every alternative considered. |
| Features | HIGH | Feature research is grounded in actual codebase analysis (specific file references, line numbers). Table stakes vs. differentiators distinction is clear and well-reasoned. |
| Architecture | HIGH | Architecture research maps to existing code structure with specific file paths and integration points. Schema migrations are all additive. Component boundary diagram is detailed and consistent with features research. |
| Pitfalls | HIGH | Pitfalls are grounded in specific known bugs from CONCERNS.md. Warning signs are concrete and testable. Prevention strategies reference specific code locations. Cross-cutting concerns identified. |

**Overall confidence:** HIGH -- All four research files are internally consistent, cross-reference each other, and are grounded in codebase analysis rather than speculation. The dependency ordering is agreed upon across all research dimensions.

### Gaps to Address

- **Quality scoring calibration data:** No existing record of why projects were manually rejected. Phase 2 planning should include an audit sprint of 20-30 rejected projects to establish scoring dimensions.
- **Puppeteer in serverless:** If visual quality scoring is pursued, the 300MB Chrome binary is incompatible with standard Vercel deployment limits. Need to evaluate `puppeteer-core` + `@sparticuz/chromium` or defer visual scoring to local-only runs.
- **AI provider pricing maintenance:** Cost tracking requires a manually-maintained pricing lookup table. No API exists for cross-provider pricing. This is an ongoing maintenance burden, not a one-time implementation task.
- **Test infrastructure:** The codebase has zero tests. Research recommends adding tests for critical paths (quality scorer, error classifier, batch completion) but does not prescribe a test framework. This decision should be made in Phase 0 planning.
- **Supabase connection limits:** Background pre-rendering and batch processing combined could exceed the ~50 concurrent connection limit. The resource budgeting strategy from P12 prevention needs concrete implementation during Phase 4 planning.

## Sources

All research was conducted via direct codebase analysis of the following project files:

### Primary (HIGH confidence -- direct code inspection)
- `PROJECT.md` -- project scope, validated requirements, existing feature inventory
- `CONCERNS.md` -- known bugs, tech debt, missing features, scaling limits
- `package.json` -- verified dependency versions and existing stack
- `lib/ai/generator.ts` -- 1456-line generator module, system prompt, validation logic
- `lib/queue.ts` -- queue implementation, concurrency model, stuck job recovery
- `lib/utils/html-boilerplate.ts` -- HTML preview/export boilerplate
- `lib/supabase/` -- database access patterns, admin/server/client factory
- `types/database.ts` -- auto-generated Supabase schema types
- `app/dashboard/actions.ts` -- server actions, auto-fix pipeline
- `app/editor/page.tsx` -- editor page, Monaco integration

### Secondary (HIGH confidence -- official documentation patterns)
- Next.js 16 App Router conventions (server/client components, server actions)
- Vercel AI SDK v6 `streamText`/`generateText` usage and response metadata
- Supabase JS v2 query patterns and realtime subscriptions
- Monaco Editor diff API (built-in to existing @monaco-editor/react)

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
