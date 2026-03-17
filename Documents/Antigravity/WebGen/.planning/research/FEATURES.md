# Feature Research: 12 Improvements for WebGen

**Research Date:** 2026-03-18
**Dimension:** Features
**Project:** WebGen -- Internal Bulk AI Website Generator

## Executive Summary

This document categorizes each of the 12 proposed improvements into table stakes (must-have for the feature to be useful), differentiators (competitive advantage, nice-to-have polish), and anti-features (things to deliberately NOT build). Complexity estimates use T-shirt sizing (S/M/L/XL). Dependencies between features are called out explicitly.

The overarching goal from PROJECT.md: **maximize the number of high-quality websites generated per hour with minimal manual intervention.** Every feature is evaluated against that lens.

---

## Feature 1: Batch Autopilot (End-to-End Automation Pipeline)

**What it is:** Discover businesses, generate websites, auto-fix failures, surface only errors for human review. One button, zero babysitting.

### Table Stakes
- **Pipeline orchestration** -- Chain discover -> enqueue -> generate -> validate -> auto-fix -> report. Without the full chain, user still babysits each step. Complexity: **L**
- **Failure escalation** -- When auto-fix exhausts retries, surface the failed project with error context. User must know WHAT failed and WHY. Complexity: **M**
- **Progress tracking** -- Real-time status of the batch (X of Y complete, Z failed). The existing `queue_jobs` table already tracks per-job status; extend to batch-level aggregation. Complexity: **M**
- **Idempotent resume** -- If autopilot is interrupted (server restart, timeout), it must pick up where it left off. Current fire-and-forget pattern (CONCERNS.md line 27-30) breaks this. Complexity: **L**

### Differentiators
- **Configurable pipeline stages** -- Let user skip enrichment, or skip auto-fix, or add a manual review gate. Useful but not essential for v1. Complexity: **M**
- **Scheduled runs** -- Cron-based autopilot (e.g., "generate 50 restaurants in NYC every night"). Complexity: **M**
- **Smart batching** -- Group businesses by industry so the LLM can warm up on a vertical. Marginal quality improvement. Complexity: **S**

### Anti-Features
- **Multi-user orchestration** -- Out of scope per PROJECT.md. Do NOT add user assignment, approval chains, or role-based pipeline stages.
- **External webhook triggers** -- The ingest webhook exists but adding external pipeline triggers adds attack surface for an internal tool.

### Dependencies
- Depends on: Feature 7 (error classification) for intelligent failure escalation
- Depends on: Feature 11 (queue health monitoring) for progress visibility
- Enables: Feature 9 (analytics dashboard) with batch-level metrics

### Complexity: **XL** (largest feature; orchestration + state machine + resume logic)

---

## Feature 2: Quality Scoring for AI-Generated Code

**What it is:** Automatically evaluate generated websites on render correctness, section completeness, responsiveness, and code quality.

### Table Stakes
- **Render success check** -- Does the generated code render without errors in the preview iframe? Binary pass/fail. The preview iframe already has an error handler (html-boilerplate.ts lines 123-140); capture this signal server-side. Complexity: **M**
- **Section completeness check** -- Does the output contain expected sections (hero, about, services, contact, footer)? Parse the generated React component AST or use regex. Complexity: **M**
- **Overall score aggregation** -- Combine sub-scores into a single 0-100 score stored on the project record. Without a score, there is nothing actionable. Complexity: **S**

### Differentiators
- **Visual regression scoring** -- Render to screenshot, use an LLM or perceptual hash to score visual quality. Expensive in compute. Complexity: **L**
- **Responsiveness check** -- Render at 3 viewport widths, detect layout breakage. Requires headless browser. Complexity: **L**
- **Code quality metrics** -- Measure component size, nesting depth, Tailwind class consistency. Useful for prompt tuning but not for end-user review. Complexity: **M**
- **Industry-specific scoring rubrics** -- Restaurants need menus, dentists need appointment CTAs. Requires maintained rubric per vertical. Complexity: **M**

### Anti-Features
- **Human calibration UI** -- Do NOT build a "rate this website" feedback loop. Single user, internal tool -- they approve or regenerate. Keep it automated.
- **Lighthouse/PageSpeed integration** -- Overkill for generated landing pages that are not yet deployed.

### Dependencies
- Enables: Feature 1 (autopilot) uses quality score to decide auto-fix vs. approve
- Enables: Feature 9 (analytics) to track quality trends over time
- Soft dependency on: Feature 12 (pre-rendering) if visual scoring needs screenshots

### Complexity: **L** (scoring logic + AST parsing + optional headless rendering)

---

## Feature 3: Few-Shot Template Seeding for LLMs

**What it is:** Use the best approved outputs as few-shot examples in prompts, segmented by industry.

### Table Stakes
- **Template tagging by industry** -- Existing template save/load system must tag templates with industry/vertical. Without tags, you can't match a dentist example to a dentist prompt. Complexity: **S**
- **Automatic few-shot injection** -- When generating for industry X, inject 1-2 approved examples from industry X into the system prompt. The generator already has a 1000+ line system prompt; add a few-shot section dynamically. Complexity: **M**
- **Example selection logic** -- Pick highest-quality approved examples (by quality score from Feature 2, or recency). Random selection defeats the purpose. Complexity: **S**

### Differentiators
- **Negative examples** -- Include a "bad" example with annotation of what went wrong. LLMs learn from contrast. Complexity: **S**
- **Dynamic prompt length management** -- Track token count; if few-shot examples exceed budget, truncate or summarize them. Prevents context window overflow. Complexity: **M**
- **A/B comparison** -- Test generation quality with vs. without few-shot examples. Ties into Feature 10 (prompt versioning). Complexity: **M**

### Anti-Features
- **User-facing template marketplace** -- Internal tool. Do NOT build browsing, rating, or sharing UIs for templates.
- **Auto-approval of generated templates** -- A generated output should only become a few-shot seed after explicit user approval. Garbage in, garbage out.

### Dependencies
- Depends on: Feature 2 (quality scoring) to rank template candidates
- Depends on: Feature 10 (prompt versioning) to track which templates were used in which prompt version
- Uses existing: Template save/load system (already in codebase)

### Complexity: **M** (mostly prompt engineering + template metadata)

---

## Feature 4: AI Provider Cost/Token Tracking

**What it is:** Track spend, token usage, and model selection per generation across all providers (OpenAI, Gemini, OpenRouter).

### Table Stakes
- **Per-generation token logging** -- Log input tokens, output tokens, model used, and estimated cost. The AI SDK v6 `streamText` and `generateText` return usage metadata. Capture it. Complexity: **S**
- **Cost estimation** -- Map model + token count to dollar cost using a pricing table. Prices change; store as config, not hardcoded. Complexity: **S**
- **Persistent storage** -- Write cost records to a new `generation_costs` table or add columns to `projects`. Must survive server restart. Complexity: **S**
- **Running total visible somewhere** -- At minimum, show total spend on the dashboard stats cards. Without visibility, tracking is pointless. Complexity: **S**

### Differentiators
- **Per-model comparison** -- Show cost and quality by model to inform model selection strategy. Complexity: **M**
- **Budget alerts** -- Warn when daily/monthly spend exceeds threshold. Useful when running hundreds of generations. Complexity: **S**
- **Provider fallback cost optimization** -- Prefer cheaper provider when quality score is equivalent. Ties into Feature 2. Complexity: **M**
- **Historical cost trends** -- Chart spend over time. Nice for optimization but not blocking. Complexity: **M**

### Anti-Features
- **Real-time billing integration** -- Do NOT build Stripe/payment integration. Internal tool, not a SaaS product.
- **Per-user cost allocation** -- Single user. No need for cost center accounting.

### Dependencies
- Independent (can be built standalone)
- Feeds into: Feature 9 (analytics dashboard) for cost visualization
- Informs: Feature 10 (prompt versioning) -- know cost impact of prompt changes

### Complexity: **S** (smallest feature; mostly logging + a DB table + dashboard stat)

---

## Feature 5: Static Site Export from React Components

**What it is:** Export generated React/Tailwind components as self-contained static HTML bundles ready for deployment or hosting.

### Table Stakes
- **Single-file HTML export** -- Render the React component to static HTML with inlined CSS (Tailwind) and no JS framework dependency. The `saved_html/` directory already stores HTML-wrapped output; extend to be fully self-contained. Complexity: **M**
- **Asset bundling** -- Inline or bundle fonts, icons (Phosphor icons already processed in html-boilerplate.ts), and images. Missing assets = broken deployed site. Complexity: **M**
- **Download button** -- One-click download of the static bundle as a .zip or single .html file from the editor. Complexity: **S**

### Differentiators
- **Vercel/Netlify deploy integration** -- Push to hosting provider via API. Reduces manual steps but adds external dependency. Complexity: **L**
- **Multi-page export** -- Export with multiple routes (about, services, contact). Currently generates single-page components. Complexity: **L**
- **SEO metadata injection** -- Add meta tags, Open Graph, structured data (schema.org) to exported HTML. Complexity: **M**
- **Custom domain mapping** -- Associate exported sites with domains. Way beyond scope for v1. Complexity: **XL**

### Anti-Features
- **CMS integration** -- Do NOT build WordPress/Webflow export. The value is in static simplicity.
- **Server-side rendering pipeline** -- Export must be STATIC. No Node.js server requirement for deployed sites.
- **Hosting management dashboard** -- Out of scope. Export the file; hosting is someone else's problem.

### Dependencies
- Independent (can be built standalone)
- Uses existing: `html-boilerplate.ts` and `saved_html/` infrastructure
- Benefits from: Feature 2 (quality scoring) -- only export sites that pass quality threshold

### Complexity: **M** (rendering pipeline + asset resolution + zip packaging)

---

## Feature 6: Keyboard Shortcut System for Review Workflows

**What it is:** vim-style keyboard shortcuts for rapid project review: j/k navigate, a approve, r regenerate, f fix, e edit.

### Table Stakes
- **Navigation shortcuts (j/k)** -- Move between projects in the grid/list without mouse. Fundamental for speed. Complexity: **S**
- **Action shortcuts (a/r/f/e)** -- Approve, regenerate, fix, edit the currently selected project. Must map to existing server actions. Complexity: **S**
- **Visual focus indicator** -- Highlighted border/background on the currently selected project card. Without visual feedback, user can't tell which project they're acting on. Complexity: **S**
- **Shortcut discovery (? key)** -- Show a help overlay listing all shortcuts. Standard pattern. Complexity: **S**

### Differentiators
- **Customizable key bindings** -- Let user remap shortcuts. Complexity: **S**
- **Batch select (Shift+j/k)** -- Select multiple projects for bulk approve/regenerate. Complexity: **M**
- **Preview on hover/focus** -- Auto-load preview when a project is focused. Ties into Feature 12. Complexity: **M**
- **Context-sensitive shortcuts** -- Different shortcuts in dashboard vs. editor vs. review mode. Complexity: **M**

### Anti-Features
- **Full vim emulation** -- Do NOT build command mode, visual mode, or macros. Simple hotkeys only.
- **Accessibility-first redesign** -- Important in general, but this is an internal power-user tool. Hotkeys supplement, not replace, mouse interaction.

### Dependencies
- Independent (can be built standalone, purely frontend)
- Benefits from: Feature 12 (pre-rendering) to make preview instant on focus
- Benefits from: Feature 2 (quality scoring) to show score on focused project

### Complexity: **S** (purely client-side; event listeners + state management)

---

## Feature 7: Error Classification with Targeted Fix Strategies

**What it is:** Categorize generation errors (syntax, render, missing sections, style, data) and apply error-type-specific fix prompts.

### Table Stakes
- **Error taxonomy** -- Define categories: syntax error, render error, missing sections, style issues, data mapping failure, timeout. Without a taxonomy, all errors get the same generic fix prompt. Complexity: **S**
- **Automatic classification** -- Parse error messages, Babel validation output (generator.ts lines 1056-1078), and preview iframe errors to assign category. Complexity: **M**
- **Category-specific fix prompts** -- Different fix strategy per error type. Syntax errors get a "fix this specific syntax" prompt; missing sections get "add the missing X section" prompt. The current auto-fix uses one generic prompt for all errors. Complexity: **M**
- **Error metadata storage** -- Store classified error info on the project record (error_type, error_details). Currently errors are only in console.log. Complexity: **S**

### Differentiators
- **Fix success rate tracking per category** -- Know which error types are fixable and which need human intervention. Complexity: **M**
- **Cascading fix strategies** -- If category-specific fix fails, try broader strategy. Multi-step escalation. Complexity: **M**
- **Pattern detection** -- Identify systematic errors (e.g., "Gemini always forgets footer on restaurant sites"). Feeds into prompt improvement. Complexity: **L**

### Anti-Features
- **User-facing error editing** -- Do NOT let the user manually edit error classifications. The system classifies; the user reviews the fixed output.
- **Error reporting to AI providers** -- Not useful. The errors are in our prompts, not their models.

### Dependencies
- Enables: Feature 1 (autopilot) uses error classification to decide retry strategy
- Enables: Feature 9 (analytics) for failure pattern analysis
- Uses existing: Babel validation in generator.ts, preview error handler in html-boilerplate.ts

### Complexity: **M** (taxonomy design + classification logic + fix prompt variants)

---

## Feature 8: Code Diff Visualization

**What it is:** Before/after comparison view for revisions using the existing `project_revisions` table.

### Table Stakes
- **Side-by-side diff view** -- Show old code and new code with additions/deletions highlighted. Monaco Editor has built-in diff support (`MonacoDiffEditor`). Complexity: **S**
- **Revision history list** -- List all revisions for a project from `project_revisions` table with timestamps. UI to select which two revisions to compare. Complexity: **M**
- **Visual preview diff** -- Side-by-side rendered preview (before/after in iframes). Code diff alone is not enough; user needs to see visual impact. Complexity: **M**

### Differentiators
- **Inline diff mode** -- Toggle between side-by-side and inline (unified) diff. Monaco supports both. Complexity: **S**
- **Change summary** -- AI-generated natural language summary of what changed ("Added contact section, fixed header alignment"). Complexity: **M**
- **Revert to revision** -- One-click rollback to any previous revision. Complexity: **M**

### Anti-Features
- **Git-style branching** -- Do NOT build branches, merges, or conflict resolution. Linear revision history only.
- **Collaborative diffing** -- No comments, annotations, or review threads on diffs. Single user.

### Dependencies
- Uses existing: `project_revisions` table (schema exists, CONCERNS.md notes no UI for it yet)
- Uses existing: Monaco Editor (already in stack, has diff API)
- Independent (can be built standalone)

### Complexity: **M** (Monaco diff integration + revision list UI + dual preview)

---

## Feature 9: Analytics Dashboard for Generation Metrics

**What it is:** Visualize success rates, timing, costs, and failure patterns across all generations.

### Table Stakes
- **Success/failure rate** -- Percentage of generations that produced usable output vs. errors. Grouped by day/week. Complexity: **M**
- **Generation timing** -- Average time per generation, p50/p95 latency. Helps identify slow models or complex industries. Complexity: **S**
- **Filterable by model and industry** -- Breakdowns by AI provider (Gemini/OpenAI/OpenRouter) and business vertical. Complexity: **M**
- **Cost summary** -- Total spend, cost per successful generation, cost per model. Requires Feature 4 data. Complexity: **S**

### Differentiators
- **Failure pattern heatmap** -- Visual matrix showing which industry + model combinations fail most. Complexity: **M**
- **Trend lines** -- Track improvements over time (e.g., quality scores going up as templates improve). Complexity: **M**
- **Prompt version comparison** -- Side-by-side metrics for different prompt versions. Ties into Feature 10. Complexity: **L**
- **Export to CSV** -- Download raw analytics data for external analysis. Complexity: **S**

### Anti-Features
- **Real-time streaming dashboard** -- Unnecessary refresh burden. Poll every 30s or refresh on navigation.
- **Custom report builder** -- Overengineered for single user. Fixed dashboard layout is sufficient.
- **Third-party analytics integration** -- Do NOT pipe data to Mixpanel/Amplitude. Keep data in Supabase.

### Dependencies
- Depends on: Feature 4 (cost tracking) for cost data
- Depends on: Feature 2 (quality scoring) for quality metrics
- Benefits from: Feature 7 (error classification) for failure pattern analysis
- Benefits from: Feature 10 (prompt versioning) for prompt comparison metrics

### Complexity: **L** (data aggregation queries + chart components + filter logic)

---

## Feature 10: Prompt Versioning and A/B Testing

**What it is:** Extract the system prompt from generator.ts, version it, tag each generation with prompt version, and compare performance.

### Table Stakes
- **Prompt extraction** -- Move the 1000+ line system prompt out of generator.ts into a versioned, loadable format. Currently embedded inline (CONCERNS.md line 121-127 calls this out). Complexity: **M**
- **Version tagging** -- Every generation records which prompt version was used. Store as column on `projects` table or `generation_costs` table. Complexity: **S**
- **Version switching** -- Ability to select which prompt version to use for the next generation batch. Complexity: **S**

### Differentiators
- **A/B testing** -- Run parallel generations with different prompt versions on same business data, compare quality scores. Complexity: **L**
- **Prompt diff view** -- See what changed between prompt versions. Can reuse Feature 8 diff infrastructure. Complexity: **S**
- **Rollback** -- Revert to a previous prompt version if new one performs worse. Complexity: **S**
- **Prompt analytics** -- Dashboard showing quality/cost/speed per prompt version. Feeds into Feature 9. Complexity: **M**

### Anti-Features
- **Visual prompt editor** -- The system prompt is highly technical. Do NOT build a WYSIWYG editor; use the code editor (Monaco is already in the stack).
- **Auto-optimization** -- Do NOT build an LLM that tunes its own prompt. Manual iteration is safer and more predictable for this use case.
- **Prompt marketplace/sharing** -- Single user, internal tool.

### Dependencies
- Depends on: Feature 2 (quality scoring) to compare prompt versions meaningfully
- Benefits from: Feature 4 (cost tracking) to measure cost impact of prompt changes
- Enables: Feature 9 (analytics) with prompt-version dimension
- Enables: Feature 3 (few-shot seeding) to know which templates were used with which prompt

### Complexity: **M** (prompt extraction is the main work; versioning is straightforward once extracted)

---

## Feature 11: Queue Health Monitoring UI

**What it is:** Visual admin panel showing queue depth, stuck jobs, processing times, and manual intervention controls.

### Table Stakes
- **Queue status display** -- Show count of queued, processing, completed, and failed jobs. Real-time or near-real-time (every 2s matches existing poll interval). Complexity: **S**
- **Stuck job detection** -- Highlight jobs in `processing` state for >10 minutes (matches existing `resetStuckProjects()` logic). Complexity: **S**
- **Manual retry/cancel** -- Button to retry a failed job or cancel a stuck one. The server actions exist (`resetStuckProjects`); just need UI. CONCERNS.md explicitly calls this out as a missing feature. Complexity: **S**
- **Job detail view** -- Click a job to see its error message, attempt count, and timestamps. Complexity: **S**

### Differentiators
- **Processing time histogram** -- Distribution of generation times. Identifies outliers. Complexity: **M**
- **Auto-recovery rules** -- Automatically retry stuck jobs after configurable timeout without manual intervention. Complexity: **M**
- **Queue throughput metrics** -- Jobs/hour, average wait time, utilization percentage. Complexity: **M**

### Anti-Features
- **Multi-queue management** -- Do NOT build support for multiple independent queues. One queue is enough for single-user tool.
- **Priority queue** -- Overengineered. FIFO is fine when one person is using it.
- **Distributed queue coordination** -- No multi-instance queue management. Single server, single queue.

### Dependencies
- Uses existing: `queue_jobs` table, `resetStuckProjects()` action, 2s polling
- Enables: Feature 1 (autopilot) needs queue visibility for pipeline monitoring
- Independent (can be built standalone)

### Complexity: **S** (mostly UI over existing data and actions)

---

## Feature 12: Background Pre-Rendering / Pre-Fetching

**What it is:** While user reviews one project, background-render the next N projects so preview is instant when they navigate.

### Table Stakes
- **Prefetch next N project data** -- Load project records and generated code for the next 3-5 projects in the queue/list. Simple data prefetching, no rendering. Complexity: **S**
- **Cache management** -- Evict old prefetched data when user moves past it. Don't let memory grow unbounded. Complexity: **S**
- **Instant preview switching** -- When user navigates to a prefetched project, display immediately from cache instead of loading. Complexity: **M**

### Differentiators
- **Background iframe pre-rendering** -- Actually render the next N projects in hidden iframes so the preview is truly instant (not just data-loaded). Complexity: **M**
- **Predictive prefetching** -- Predict which project the user will review next based on sort order, filter state, or quality score. Complexity: **M**
- **Progressive loading indicator** -- Show prefetch status (3 of 5 preloaded) so user knows when to expect instant transitions. Complexity: **S**

### Anti-Features
- **Server-side pre-rendering** -- Do NOT render all projects server-side. Too expensive for hundreds of projects. Client-side prefetch of the next few is sufficient.
- **Screenshot thumbnail generation** -- Tempting but expensive. Defer to a future feature if visual scoring (Feature 2) already generates screenshots.
- **Infinite scroll with virtualization** -- The project grid likely won't have thousands of items visible at once. Don't over-optimize.

### Dependencies
- Benefits from: Feature 6 (keyboard shortcuts) -- prefetch in the direction of navigation
- Benefits from: Feature 2 (quality scoring) -- prioritize prefetching projects likely to need review
- Independent (can be built standalone, purely frontend)

### Complexity: **M** (client-side cache + prefetch logic + iframe management)

---

## Cross-Feature Dependencies Map

```
Feature 4 (Cost Tracking) -----> Feature 9 (Analytics Dashboard)
Feature 2 (Quality Scoring) ---> Feature 9 (Analytics Dashboard)
Feature 7 (Error Classification) -> Feature 9 (Analytics Dashboard)
Feature 10 (Prompt Versioning) -> Feature 9 (Analytics Dashboard)

Feature 7 (Error Classification) -> Feature 1 (Batch Autopilot)
Feature 11 (Queue Health) -------> Feature 1 (Batch Autopilot)

Feature 2 (Quality Scoring) ---> Feature 3 (Few-Shot Seeding)
Feature 10 (Prompt Versioning) -> Feature 3 (Few-Shot Seeding)

Feature 2 (Quality Scoring) ---> Feature 10 (Prompt Versioning) [for comparison]
Feature 4 (Cost Tracking) -----> Feature 10 (Prompt Versioning) [for cost impact]

Feature 12 (Pre-Rendering) ----> Feature 6 (Keyboard Shortcuts) [faster review]
Feature 8 (Diff View) uses ----> Monaco Editor (already in stack)
```

## Recommended Build Order (Dependency-Aware)

| Phase | Features | Rationale |
|-------|----------|-----------|
| **Phase 1: Foundations** | 4 (Cost Tracking), 7 (Error Classification), 11 (Queue Health), 6 (Keyboard Shortcuts) | All independent, small/medium complexity, produce data other features need |
| **Phase 2: Quality Layer** | 2 (Quality Scoring), 8 (Diff View), 10 (Prompt Versioning) | Build scoring and comparison tools that inform optimization |
| **Phase 3: Intelligence** | 3 (Few-Shot Seeding), 5 (Static Export), 12 (Pre-Rendering) | Use scoring + versioning to power smarter generation and faster workflows |
| **Phase 4: Orchestration** | 1 (Batch Autopilot), 9 (Analytics Dashboard) | Capstone features that depend on all prior data and infrastructure |

## Complexity Summary

| Feature | Complexity | Category |
|---------|-----------|----------|
| 1. Batch Autopilot | **XL** | Orchestration |
| 2. Quality Scoring | **L** | Quality |
| 3. Few-Shot Seeding | **M** | Quality |
| 4. Cost/Token Tracking | **S** | Observability |
| 5. Static Site Export | **M** | Output |
| 6. Keyboard Shortcuts | **S** | UX |
| 7. Error Classification | **M** | Quality |
| 8. Diff View | **M** | UX |
| 9. Analytics Dashboard | **L** | Observability |
| 10. Prompt Versioning | **M** | Quality |
| 11. Queue Health UI | **S** | Observability |
| 12. Pre-Rendering | **M** | UX |

---

*Research completed: 2026-03-18*
