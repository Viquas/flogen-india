# Pitfalls Research

**Research Date:** 2026-03-18
**Domain:** Internal AI website generator (Next.js 16 + Supabase + AI SDK v6)
**Scope:** 12 planned improvements to existing bulk generation pipeline

---

## P1: Batch Automation Swallowing Failures Silently

**Feature:** End-to-end batch autopilot (discover, generate, auto-fix, surface failures)
**Phase:** Batch automation

**The Mistake:**
Building batch automation on top of the existing fire-and-forget pattern in `app/dashboard/actions.ts`. The current `generateAndSaveWebsite().then().catch(console.error)` pattern means a batch of 50 projects could silently lose 15 failures with no aggregated report. Projects that auto-fix returns original broken code for (the known bug at line 1166 of `generator.ts`) get marked as "generated" -- batch automation will stamp them as done when they are broken.

**Warning Signs:**
- Batch completion reports "50/50 done" but manual review finds broken sites
- No difference in batch outcome between a run with 0 errors and one with 20 errors
- `queue_jobs` table has completed jobs whose linked projects have `status: 'error'`
- Auto-fix returns the original broken code and batch marks it as success

**Prevention Strategy:**
- Add a terminal `batch_result` status per project that is distinct from generation status: `success | fixed | failed | needs_review`
- Never mark a batch as complete until every project has a terminal status
- Build the batch status aggregator BEFORE building the autopilot -- you need the reporting layer first
- Fix the auto-fix bug (return `fixedCode2` instead of original, set `status: 'error'`) as a prerequisite, not an afterthought
- Require an explicit "surface failures" step that blocks batch completion

**Relevant Existing Issues:**
- Auto-fix returns original broken code if both attempts fail (CONCERNS.md: Known Bugs)
- Fire-and-forget async with no error tracking (CONCERNS.md: Tech Debt)
- Race condition in queue processing (CONCERNS.md: Known Bugs)

---

## P2: Quality Scoring That Measures the Wrong Things

**Feature:** Generation quality scoring (auto-evaluate renders, sections, responsiveness)
**Phase:** Quality scoring

**The Mistake:**
Building a scoring system that checks syntactic properties (has a hero section, has a footer, code compiles) instead of semantic quality (does the hero match the business, is the CTA relevant, does the color scheme fit the industry). Syntactic checks are easy to implement but produce false confidence -- a page that scores 95/100 because it has all the right sections can still look terrible or be completely wrong for the business.

A second common mistake: scoring generated code without actually rendering it. The Babel validation in `generator.ts` already misses errors that only manifest at render time (CONCERNS.md: "Babel Transform Silently Drops Invalid Code"). A scoring system that evaluates code without rendering it in a headless browser will repeat this exact gap.

**Warning Signs:**
- High-scoring projects still get rejected during manual review
- Score distribution is clustered (everything scores 80-95) with no discrimination
- Scores don't correlate with approval rates -- you approve low-scoring ones and reject high-scoring ones
- Visual rendering bugs (overlapping text, missing images, broken layout) in projects that passed all checks

**Prevention Strategy:**
- Define scoring criteria by working backwards from actual rejection reasons: audit 20-30 manually rejected projects, categorize why they were rejected, build scores for those specific criteria
- Include a headless browser render check (Playwright screenshot + viewport assertions) as a required scoring dimension -- do not rely solely on code analysis
- Build calibration into the system: track score vs. manual approval rate, adjust weights when they diverge
- Start with 3-5 high-signal dimensions, not 20 granular ones. Suggested starting set: (1) renders without JS errors, (2) has visible business name, (3) no overlapping/clipped content at 3 breakpoints, (4) all sections have real content not lorem ipsum, (5) color contrast passes WCAG AA
- Store scores as structured data (not a single number) so you can analyze which dimensions matter

**Relevant Existing Issues:**
- Babel transform silently drops invalid code (CONCERNS.md: Known Bugs)
- No observability/analytics (CONCERNS.md: Missing Critical Features)

---

## P3: Few-Shot Templates That Poison Output Quality

**Feature:** Industry-aware template seeding (use best approved outputs as few-shot examples)
**Phase:** Template/prompt improvements

**The Mistake:**
Using approved projects as few-shot examples without cleaning them first. Approved code contains business-specific data (addresses, phone numbers, brand colors, specific copy) that bleeds into new generations. A dental clinic template used as a few-shot for a restaurant will produce a restaurant page that mentions "Dr. Smith's office hours" in the footer because the LLM pattern-matched the template structure including its content.

Second mistake: stuffing too many examples into the system prompt. The existing system prompt in `generator.ts` is already 1000+ lines. Adding 2-3 full React component examples (each 200-400 lines) will push the prompt past effective context utilization, and the model will start ignoring instructions in favor of copying example patterns.

**Warning Signs:**
- Generated pages contain text/data from template businesses instead of the target business
- All outputs for an industry look identical in structure (diversity collapses)
- Token costs spike significantly after enabling few-shot (3-4x increase per generation)
- Quality doesn't improve or gets worse despite adding examples

**Prevention Strategy:**
- Sanitize templates before using as few-shot: replace all business-specific content with descriptive placeholders (`{{business_name}}`, `{{hero_tagline}}`, `{{address}}`). This is a data pipeline step, not optional cleanup
- Limit to 1 example per generation (not 2-3). One well-chosen example provides most of the structural benefit; additional examples have sharply diminishing returns and increasing bleed risk
- Use template excerpts (just the component structure, 50-80 lines) not full page code. Strip out data-binding logic, keep only the JSX structure
- Version templates alongside prompts (see P10) -- when you change the system prompt, old templates may produce worse results with the new prompt
- Measure output diversity: if >80% of outputs for an industry share identical section ordering, your templates are over-constraining

**Relevant Existing Issues:**
- Generator module is monolithic, 1456 lines with 1000+ line system prompt (CONCERNS.md: Performance Bottlenecks)
- Template save/load system exists but no sanitization (PROJECT.md: Validated Requirements)

---

## P4: Cost Tracking That Misses the Real Spend

**Feature:** Cost and token tracking per generation across all providers
**Phase:** Cost tracking

**The Mistake:**
Tracking only the main generation call and missing the hidden costs. The current pipeline has at least 4 AI call sites: (1) main generation via `streamWebsiteCode`, (2) enrichment via `enricher.ts`, (3) auto-fix via `reviseWebsite` with o3-mini (up to 2 attempts), and (4) chat refinement via `/api/chat/refine`. Tracking only the generation call will undercount actual cost by 40-60% because enrichment and auto-fix are where the expensive retry loops live.

Second mistake: using hardcoded price tables that go stale. OpenAI, Google, and OpenRouter all change pricing without notice. A cost tracker that says "$0.02 per generation" based on cached pricing from launch month will be wrong within weeks.

**Warning Signs:**
- Tracked costs don't match provider billing dashboards
- Auto-fix-heavy batches show the same cost as clean batches
- Cost per project varies wildly but your tracker shows uniform costs
- Total tracked spend is 50% of actual invoice amount

**Prevention Strategy:**
- Instrument at the AI SDK level, not the application level. Wrap the `ai` SDK's `streamText` and `generateText` calls with a cost-tracking middleware that captures `usage.promptTokens` and `usage.completionTokens` from every call, not just generation calls
- Map every AI call to a `project_id` and a `call_type` enum (`generation | enrichment | auto_fix_1 | auto_fix_2 | refinement`). This is critical for understanding where money actually goes
- Store token counts, not dollar amounts, as the primary data. Compute dollar amounts at query time using a pricing config that can be updated. This way when pricing changes you don't need to recompute historical data -- just update the lookup table
- Include the model used per call (the fallback chain means the same project might use Gemini for generation and o3-mini for auto-fix)
- Add a cost column to the existing `projects` table for quick dashboard access, but store detailed per-call breakdowns in a new `generation_costs` table

**Relevant Existing Issues:**
- No observability beyond console.log (PROJECT.md: Context)
- Multiple AI providers with fallback chain (ARCHITECTURE.md: Generator Module)
- Fire-and-forget pattern means enrichment/auto-fix costs are invisible (CONCERNS.md: Tech Debt)

---

## P5: Static Export Breaking React Interactivity

**Feature:** One-click deploy/export pipeline (static HTML bundle or hosting push)
**Phase:** Export pipeline

**The Mistake:**
Running `ReactDOMServer.renderToString()` on generated components and shipping the static HTML. The generated pages are React/Tailwind SPAs with interactive elements (navigation toggles, scroll animations, form handlers, modals). Static rendering strips all event handlers and state management, producing a page that looks correct but is completely non-interactive -- buttons don't click, menus don't open, forms don't submit.

The current `html-boilerplate.ts` already wraps components in a client-side React rendering shell with CDN dependencies (React, ReactDOM, Babel standalone). An export pipeline that tries to "simplify" this by pre-rendering will break the output.

**Warning Signs:**
- Exported pages look correct in screenshots but nothing is clickable
- Mobile navigation hamburger menus don't open
- Contact forms are visible but non-functional
- Smooth scroll links jump instead of animating

**Prevention Strategy:**
- Export the full client-rendered bundle, not server-rendered HTML. The export should be the same `html-boilerplate.ts` output that works in the preview iframe -- it already self-contains React, ReactDOM, and Babel via CDN
- For a true static export: use a headless browser (Playwright) to render the page, wait for hydration, then serialize the fully-hydrated DOM with inline event handlers compiled. This is complex and should be a later optimization, not the initial approach
- Initial export target should be a single self-contained `.html` file with the same CDN dependencies the preview uses. Test that the exported file works when opened as `file://` (not just `http://`) -- CDN dependencies require network access
- Add an export validation step: open exported file in Playwright, click 3 interactive elements, assert they respond
- Consider offering two export modes: "interactive" (full React bundle) and "static" (pre-rendered, no JS, for print/screenshot use cases)

**Relevant Existing Issues:**
- HTML preview escaping issues (CONCERNS.md: Known Bugs)
- Preview iframe error handling is fragile (CONCERNS.md: Fragile Areas)
- Babel standalone loaded in-browser for every preview (CONCERNS.md: Performance Bottlenecks)

---

## P6: Keyboard Shortcuts That Conflict and Trap Focus

**Feature:** Keyboard-driven review workflow (j/k navigate, a approve, r regenerate, f fix, e edit)
**Phase:** Keyboard shortcuts

**The Mistake:**
Adding global keyboard listeners that fire when the user is typing in the Monaco editor, search inputs, or chat refinement textarea. Pressing `e` to type "excellent work" in the refinement chat will instead trigger the "edit" shortcut. Pressing `j` or `k` while editing code will navigate away from the current project, losing unsaved changes.

Second mistake: not handling the editor page's complex focus hierarchy. The editor has Monaco (which has its own extensive keyboard shortcuts), a live preview iframe (which captures focus), a chat panel, and navigation. A single `document.addEventListener('keydown')` approach will create conflicts with all of these.

**Warning Signs:**
- Users report shortcuts firing when typing in text fields
- Monaco editor's Ctrl+S, Ctrl+Z, etc. stop working after adding global shortcuts
- Pressing shortcut keys while preview iframe is focused does nothing (events don't bubble out of iframes)
- Unsaved code changes are lost when navigation shortcuts fire unexpectedly

**Prevention Strategy:**
- Implement a focus-aware shortcut system: shortcuts only fire when no text input, textarea, or contenteditable element has focus. Check `document.activeElement` tag name before executing
- Use a dedicated keyboard shortcut library (e.g., `tinykeys` or `hotkeys-js`) that handles focus scoping, rather than raw `addEventListener`
- Scope shortcuts to specific UI contexts: navigation shortcuts (j/k) only work on the dashboard/review list, not in the editor. Edit shortcuts only work when a project card is focused
- Add a visible shortcut indicator (small overlay or bottom bar showing available shortcuts for the current context) so the user knows what's active
- Require modifier keys for destructive actions: `a` to approve is fine for non-destructive review, but `r` to regenerate should require `Shift+R` or a confirmation
- Test with Monaco editor open: verify that all Monaco shortcuts still work, that shortcut keys don't fire while typing in editor

**Relevant Existing Issues:**
- Editor page is the most complex component at ~56KB (PROJECT.md: Context)
- No error boundary on EditorPage client component (CONCERNS.md: Incomplete Error Boundaries)

---

## P7: Error Classification That Creates Fix Loops

**Feature:** Smart error classification with targeted fix strategies
**Phase:** Error classification

**The Mistake:**
Building a classifier that detects error types but routes them all through the same fix path. The current auto-fix sends all errors to o3-mini with a generic "fix this code" prompt. A classification system that distinguishes between "missing import," "syntax error," and "runtime render error" but then sends all three to the same LLM prompt has added complexity without adding value.

Worse: classification that triggers automatic fix attempts can create loops. Error is classified as "missing import" -> fix adds import -> import causes "duplicate identifier" error -> classified as "syntax error" -> fix removes the import -> back to "missing import." The existing auto-fix already allows 2 attempts; adding classification without loop detection will make this worse.

**Warning Signs:**
- Same project oscillates between two error states across fix attempts
- Fix success rate doesn't improve after adding classification (still around the same %)
- Classification says "syntax error" but the actual problem is that the generated component references a nonexistent API
- Token costs for auto-fix increase but fix rates stay flat

**Prevention Strategy:**
- Build classification and fix strategies as separate, decoupled systems. Classification labels the error; a separate routing table maps labels to fix strategies. This lets you add new strategies without changing the classifier
- Define fix strategies with concrete, different prompts: "missing import" gets a prompt that only adds imports, "layout broken" gets a prompt that restructures JSX, "syntax error" gets a code-only prompt without design context. If two strategies have the same prompt, merge them
- Implement loop detection: hash the error type + affected code region. If the same hash appears twice in a fix chain, abort and surface for manual review. Do not attempt a third fix
- Track fix success rate per error category. If a category has <20% fix success, flag it as "not auto-fixable" and route directly to manual review
- Fix the existing auto-fix return-original-code bug (CONCERNS.md) BEFORE layering classification on top. Classification on a broken fix pipeline adds noise

**Relevant Existing Issues:**
- Auto-fix returns original broken code if both attempts fail (CONCERNS.md: Known Bugs)
- Auto-fix recursion logic untested (CONCERNS.md: Test Coverage Gaps)
- Babel transform silently drops invalid code (CONCERNS.md: Known Bugs)

---

## P8: Code Diff That Doesn't Handle LLM-Generated Code Well

**Feature:** Diff view for revisions (before/after comparison)
**Phase:** Diff view

**The Mistake:**
Using a standard line-by-line diff algorithm (Myers, patience) on LLM-generated code. LLMs frequently rewrite entire components when asked to make small changes -- the revision system's `reviseWebsite()` function can return completely restructured code even for "change the button color" requests. A line diff of two versions that are semantically similar but structurally different will show 90% of lines as changed, making the diff useless for review.

The existing patch system in `generator.ts` (lines 814-920) already has problems with patch application ordering. A diff view built on the same assumptions will inherit these problems.

**Warning Signs:**
- Every diff shows massive changes even for trivial revisions
- Reviewer can't identify what actually changed between versions
- Diff view is slower than just reading the new version directly
- Structural changes (moving a section up/down) show as full delete + insert instead of a move

**Prevention Strategy:**
- Use a semantic-aware diff library, not just text diff. Libraries like `diff-match-patch` with cleanup passes, or AST-based diffing (parse both versions, diff the AST), will produce more meaningful diffs for generated code
- For initial implementation: use Monaco's built-in diff editor (`MonacoDiffEditor`). It already handles the rendering and the codebase already uses Monaco. This gives you a functional diff view with minimal new dependencies
- Add a "summary" panel alongside the diff that uses a cheap LLM call to describe what changed in 2-3 bullet points. For LLM-generated code, a natural language summary of changes is often more useful than a code diff
- Store the revision prompt (what the user asked to change) alongside the diff. Displaying "User asked: change button color to blue" next to a 200-line diff immediately tells the reviewer what to look for
- Don't try to build 3-way merge or conflict resolution -- this is a single-user tool with linear revision history. Keep it simple: side-by-side view of version N and version N-1

**Relevant Existing Issues:**
- Code patch application is fragile, patches applied sequentially (CONCERNS.md: Fragile Areas)
- Revision system exists in `project_revisions` table but has no UI (CONCERNS.md: Missing Critical Features)

---

## P9: Analytics Dashboard That Queries Production Tables in Real-Time

**Feature:** Generation analytics dashboard (success rate by model/industry, timing, failure patterns)
**Phase:** Analytics

**The Mistake:**
Running aggregate analytics queries directly against the `projects` and `queue_jobs` tables during page load. Queries like `SELECT model, COUNT(*) GROUP BY model WHERE status = 'error'` scanning all projects will slow down as the table grows. With hundreds of generations per day, the projects table will reach 10K+ rows within weeks. Aggregate queries on a table that's also being written to by the queue processor will create lock contention.

**Warning Signs:**
- Analytics dashboard takes 3-5+ seconds to load
- Dashboard generation list becomes slower after analytics feature ships
- Supabase dashboard shows increasing query latency on `projects` table
- Queue processing slows down during dashboard page loads

**Prevention Strategy:**
- Create a separate `generation_stats` materialized view or summary table that aggregates metrics periodically (every 5 minutes or on-demand), not on every page load
- For the initial implementation: use Supabase's built-in `.count()` queries with appropriate filters and indexes, but limit the time window (show last 7 days by default, not all-time)
- Add database indexes on the columns you'll filter by: `(status, created_at)`, `(model, created_at)`, `(batch_id, status)`. Without these, every analytics query is a full table scan
- Separate read path from write path: analytics queries should use a read replica or at minimum a different connection pool than the queue processor. Supabase supports this on paid tiers
- Pre-compute expensive aggregates: success rate by model, average generation time, failure rate by industry. Store in a `daily_stats` table updated by a cron job or post-generation hook, not computed at query time
- Start with 3-4 key metrics (success rate, avg time, cost per generation, failure rate), not a comprehensive analytics suite. You can always add more dimensions later

**Relevant Existing Issues:**
- No observability/analytics currently exists (CONCERNS.md: Missing Critical Features)
- Queue polls every 2s, adding query load (CONCERNS.md: Performance Bottlenecks)
- Database connection limits on Supabase free tier (~50 concurrent) (CONCERNS.md: Scaling Limits)

---

## P10: Prompt Versioning Without Rollback Capability

**Feature:** Prompt versioning (extract system prompt, version it, tag generations)
**Phase:** Prompt versioning

**The Mistake:**
Versioning prompts by saving them to a database table but not linking each generation to the exact prompt version used. When generation quality drops, you need to answer "which prompt version caused this?" If generations aren't tagged with their prompt version, you can't correlate quality changes to prompt changes. You end up doing manual archaeology: "I think I changed the prompt on Tuesday, and quality dropped on Wednesday..."

Second mistake: extracting the 1000+ line system prompt from `generator.ts` into a database-editable field without a review/diff workflow. A typo in a database-stored prompt can break all generations with no version control, no diff, and no easy rollback.

**Warning Signs:**
- Quality drops but you can't identify which prompt change caused it
- Two projects generated minutes apart produce wildly different quality because a prompt was edited between them
- Rolling back to a previous prompt version requires manually copying text from a database backup
- No way to A/B test two prompt versions on the same business data

**Prevention Strategy:**
- Store prompts in code (files), not database. Version them with git. A file like `lib/ai/prompts/system-v3.ts` that exports a string is debuggable, diffable, and rollback-able with `git revert`
- Tag every generation record with the prompt version ID (a hash or semver string). Add a `prompt_version` column to the `projects` table
- Build the version-to-quality correlation query early: "show me success rate grouped by prompt_version." This is the primary value of versioning -- without this query, versioning is just bookkeeping
- Implement a "canary" deployment pattern for prompts: new prompt version runs on 10% of generations for one batch, compare quality scores (P2) against the current version, then promote or rollback
- Keep the prompt extraction refactor separate from the versioning feature. Extract first (move from inline string in `generator.ts` to a separate file), stabilize, then add versioning. Don't try to do both simultaneously

**Relevant Existing Issues:**
- Generator module is monolithic with 1000+ line system prompt inline (CONCERNS.md: Performance Bottlenecks)
- No test suite to catch prompt regressions (PROJECT.md: Context)

---

## P11: Queue Monitoring UI That Masks the Real Problem

**Feature:** Queue health and stuck job admin UI
**Phase:** Queue monitoring

**The Mistake:**
Building a UI that shows queue status and provides "retry" and "cancel" buttons without fixing the underlying queue reliability issues. The current queue has: (1) a race condition where multiple processors can claim the same job, (2) polling every 2 seconds even when idle, and (3) no mechanism to detect jobs stuck in `processing` state other than a 10-minute timeout in `resetStuckProjects()`. A monitoring UI on top of this will show you the problems in real-time but not prevent them.

Second mistake: building the monitoring UI as a dashboard page that requires the user to navigate to it. Queue problems happen during batch processing when the user is away. By the time they check the monitoring UI, jobs have been stuck for hours.

**Warning Signs:**
- User relies on the monitoring UI to manually restart stuck jobs multiple times per day
- The "retry" button is the most-clicked element in the admin UI
- Queue shows jobs in `processing` state for longer than the expected generation time (60-90s)
- Same project appears in queue multiple times due to the race condition

**Prevention Strategy:**
- Fix queue reliability bugs BEFORE building the monitoring UI. Specifically: add database-level uniqueness constraint on `(project_id, status='processing')`, replace 2-second polling with exponential backoff (2s -> 4s -> 8s -> 30s when idle), add a heartbeat column so stuck detection is precise (no heartbeat update in 60s = stuck, not "10 minutes in generating state")
- Add proactive alerting, not just passive monitoring. If a job has been in `processing` for >3 minutes, auto-surface a notification in the dashboard without requiring navigation to a separate admin page
- Implement the monitoring as an overlay/panel on the existing dashboard, not a separate page. During batch processing, the user should see queue health in their peripheral vision, not behind a navigation click
- Add automatic recovery: stuck jobs should auto-retry once before requiring manual intervention. The monitoring UI should only show jobs that failed automatic recovery
- Log queue events to a `queue_events` table (job_started, job_completed, job_failed, job_stuck, job_retried) for post-mortem analysis. The monitoring UI queries this table, not the live `queue_jobs` table

**Relevant Existing Issues:**
- Race condition in queue processing (CONCERNS.md: Known Bugs)
- Queue processing busy loop polls every 2s (CONCERNS.md: Performance Bottlenecks)
- Queue recovery after server crash untested (CONCERNS.md: Test Coverage Gaps)
- No manual intervention UI for stuck jobs (CONCERNS.md: Missing Critical Features)

---

## P12: Background Rendering That Starves the Active Workflow

**Feature:** Parallel preview pre-rendering (background render next 5 projects during review)
**Phase:** Background rendering

**The Mistake:**
Launching 5 background rendering processes that compete for the same resources as the active generation queue. The queue processor already uses 3 concurrent slots. Adding 5 background preview renders means 8 concurrent processes hitting AI APIs, Supabase connections, and browser memory simultaneously. On Vercel with serverless functions and a 50-connection Supabase pool, this will cause connection exhaustion and timeout failures for the active generation that the user is actually waiting on.

Second mistake: pre-rendering into heavy headless browser instances (Playwright/Puppeteer) without lifecycle management. Each headless browser tab uses 100-300MB of memory. Five concurrent tabs is 500MB-1.5GB of memory just for previews, on top of the Next.js process and generation.

**Warning Signs:**
- Active generation becomes slower or times out after enabling background rendering
- Supabase connection errors (`too many connections`) appear in logs
- Browser tabs crash or become unresponsive during review workflow
- Serverless function memory limits (1GB default on Vercel) are hit, causing cold starts

**Prevention Strategy:**
- Background rendering must yield to active work. Implement a priority system: active generation and active preview get full resources; background rendering only runs when active slots are available. Never let background rendering use more than 1 concurrent slot
- Don't use headless browsers for pre-rendering. The preview iframe already renders client-side using the same `html-boilerplate.ts` approach. Pre-rendering should mean "pre-fetch project data and pre-generate the HTML boilerplate string" -- not "launch a browser and render." The actual rendering happens in the user's browser when they navigate
- Implement a lightweight pre-fetch: load next 5 projects' `generated_code` from the database into an in-memory LRU cache. When user navigates to the next project, the data is already available. This costs ~5 database queries, not 5 browser instances
- Add a resource budget: if system memory > 70% or active queue jobs > 2, disable background rendering entirely. Resume when resources free up
- Start with pre-fetching 2 projects (prev + next), not 5. Measure actual navigation patterns first -- if users review linearly, pre-fetching +1 is sufficient. Pre-fetching 5 is premature optimization

**Relevant Existing Issues:**
- Queue processing concurrency fixed at 3 (CONCERNS.md: Scaling Limits)
- Database connection limit ~50 concurrent (CONCERNS.md: Scaling Limits)
- Babel transform memory issues with large components (CONCERNS.md: Scaling Limits)
- Stream generation timeout of 5 minutes (CONCERNS.md: Scaling Limits)

---

## Cross-Cutting Pitfalls

### CC1: Adding Features Without Fixing the Foundation

**The Mistake:**
Layering 12 new features on top of known bugs (auto-fix returns broken code, race conditions, fire-and-forget async). Every new feature inherits these bugs. Batch automation inherits the auto-fix bug. Quality scoring inherits the Babel validation gap. Cost tracking inherits the fire-and-forget pattern. The new features will be blamed for unreliability that originates in the existing foundation.

**Prevention Strategy:**
- Phase 0 (pre-work): Fix the 3 critical bugs before starting any feature work:
  1. Auto-fix returns original code -> return latest attempt + set status to 'error'
  2. Race condition in queue -> add DB uniqueness constraint
  3. Fire-and-forget async -> add error tracking to all `.then().catch()` chains
- Budget 1-2 days for these fixes. They are small, well-documented in CONCERNS.md, and prevent cascading issues across all 12 features

### CC2: No Test Coverage for New Features

**The Mistake:**
Adding 12 features to a codebase with zero tests, then wondering why regressions appear constantly. Each feature touches shared infrastructure (generator, queue, database). Without tests, changing the queue for monitoring (P11) can break batch automation (P1), and you won't know until manual testing catches it.

**Prevention Strategy:**
- Add integration tests for the specific code paths each feature touches BEFORE modifying them. Not a full test suite -- just the critical paths
- Minimum test coverage for new features: (1) batch completion correctly aggregates statuses, (2) quality scoring produces consistent scores for the same input, (3) cost tracking captures tokens from all AI call sites, (4) keyboard shortcuts don't fire in text inputs
- Use the existing `scripts/` directory pattern: lightweight test scripts that can run locally. Don't block on setting up Jest/Vitest if it takes more than 30 minutes

### CC3: Monolith Gets Bigger Before It Gets Smaller

**The Mistake:**
Adding quality scoring, error classification, cost tracking, and prompt versioning logic to the existing 1456-line `generator.ts`. Each feature adds 100-200 lines. Without refactoring first, the file becomes 2000+ lines and even harder to modify safely.

**Prevention Strategy:**
- Extract the system prompt to a separate file (`lib/ai/prompts/`) as the first step of prompt versioning (P10). This immediately reduces `generator.ts` by 1000+ lines
- Each new feature gets its own module: `lib/ai/quality-scorer.ts`, `lib/ai/error-classifier.ts`, `lib/ai/cost-tracker.ts`. These modules are called from the generator, not added to it
- Define clear interfaces between generator and new modules. The generator should emit events (generation_started, generation_completed, generation_failed) that other modules subscribe to, rather than having inline calls

---

## Phase Mapping Summary

| Pitfall | Prerequisites (Fix First) | Feature Phase |
|---------|---------------------------|---------------|
| P1: Batch silent failures | Fix auto-fix bug, fix fire-and-forget | Batch automation |
| P2: Wrong quality metrics | None, but render-based scoring needs Playwright | Quality scoring |
| P3: Template data bleed | Extract system prompt from generator.ts | Template/prompt |
| P4: Missed cost tracking | Instrument all AI call sites | Cost tracking |
| P5: Static export breaks React | Test html-boilerplate.ts export path | Export pipeline |
| P6: Shortcut focus conflicts | None, but test with Monaco | Keyboard shortcuts |
| P7: Error fix loops | Fix auto-fix return-original bug | Error classification |
| P8: Useless LLM diffs | None (use Monaco diff editor) | Diff view |
| P9: Slow analytics queries | Add DB indexes on projects table | Analytics |
| P10: Prompt versioning without correlation | Extract prompt from generator.ts | Prompt versioning |
| P11: Monitoring without fixing queue | Fix race condition, fix polling | Queue monitoring |
| P12: Background rendering resource starvation | None, but enforce resource budgets | Background rendering |
| CC1: Features on broken foundation | Fix 3 critical bugs (Phase 0) | All phases |
| CC2: No test coverage | Add minimal integration tests | All phases |
| CC3: Monolith grows | Extract prompt, modularize generator.ts | All phases |

---

*Research completed: 2026-03-18*
*Sources: PROJECT.md, CONCERNS.md, ARCHITECTURE.md, STRUCTURE.md, INTEGRATIONS.md, STACK.md, CONVENTIONS.md*
