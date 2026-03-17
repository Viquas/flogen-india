# Requirements: WebGen

**Defined:** 2026-03-18
**Core Value:** Maximize the number of high-quality websites generated per hour with minimal manual intervention.

## v1 Requirements

Requirements for the 12 improvements milestone. Each maps to roadmap phases.

### Foundation Fixes

- [x] **FIX-01**: Auto-fix returns the latest fix attempt (not original broken code) when both attempts fail, and sets status to 'error'
- [x] **FIX-02**: Queue processing uses database-level uniqueness constraint to prevent duplicate job claims
- [x] **FIX-03**: Background generation tasks use proper error tracking instead of fire-and-forget Promise chains
- [ ] **FIX-04**: System prompt extracted from generator.ts into a separate versioned file
- [ ] **FIX-05**: Generator module decomposed into focused modules (prompts, validation, cost tracking, error classification)
- [x] **FIX-06**: Debug .txt files removed from codebase and added to .gitignore

### Cost & Token Tracking

- [ ] **COST-01**: Every AI generation logs input tokens, output tokens, model used, and estimated cost to a persistent table
- [ ] **COST-02**: Cost estimation uses a configurable pricing table (not hardcoded) that can be updated when provider prices change
- [ ] **COST-03**: Dashboard stats cards show running total spend for the current month
- [ ] **COST-04**: Cost records include all AI calls (generation, enrichment, auto-fix retries), not just primary generation

### Error Classification

- [ ] **ERR-01**: Error taxonomy defined with categories: syntax error, render error, missing sections, style issues, data mapping failure, timeout
- [ ] **ERR-02**: Errors automatically classified using Babel validation output and preview error signals
- [ ] **ERR-03**: Each error category has a targeted fix prompt (not one generic fix-all prompt)
- [ ] **ERR-04**: Error classification stored on project record (error_type, error_details columns)

### Prompt Versioning

- [ ] **PROMPT-01**: System prompt lives in a versioned, loadable format outside of generator.ts
- [ ] **PROMPT-02**: Every generation records which prompt version was used
- [ ] **PROMPT-03**: User can switch which prompt version to use for the next generation
- [ ] **PROMPT-04**: Prompt versions stored in database with creation date and change notes

### Queue Health UI

- [ ] **QUEUE-01**: Admin page shows count of queued, processing, completed, and failed jobs in real-time
- [ ] **QUEUE-02**: Stuck jobs (processing > 10 min) are visually highlighted with warning indicator
- [ ] **QUEUE-03**: One-click retry and cancel buttons for failed/stuck jobs
- [ ] **QUEUE-04**: Job detail view shows error message, attempt count, and timestamps

### Quality Scoring

- [ ] **QUAL-01**: Generated code evaluated for render success (renders without errors in preview)
- [ ] **QUAL-02**: Generated code evaluated for section completeness (hero, about, services, contact, footer)
- [ ] **QUAL-03**: Sub-scores aggregated into a 0-100 quality score stored on the project record
- [ ] **QUAL-04**: Projects sortable by quality score in dashboard to prioritize review

### Few-Shot Template Seeding

- [ ] **TMPL-01**: Templates tagged with industry/vertical metadata
- [ ] **TMPL-02**: When generating for industry X, 1-2 approved examples from industry X are automatically injected as few-shot context
- [ ] **TMPL-03**: Example selection picks highest-quality approved templates (by quality score or recency)
- [ ] **TMPL-04**: Template content sanitized (business-specific data replaced with placeholders) before injection

### Analytics Dashboard

- [ ] **ANAL-01**: Dashboard page shows generation success/failure rate grouped by day/week
- [ ] **ANAL-02**: Average generation time displayed with p50/p95 latency breakdown
- [ ] **ANAL-03**: Metrics filterable by AI model and business industry
- [ ] **ANAL-04**: Cost summary showing total spend, cost per successful generation, cost per model

### Batch Autopilot

- [ ] **AUTO-01**: One-button pipeline chains discover -> enqueue -> generate -> validate -> auto-fix -> report
- [ ] **AUTO-02**: Failed projects surfaced with error context and classification after pipeline completes
- [ ] **AUTO-03**: Real-time batch progress visible (X of Y complete, Z failed)
- [ ] **AUTO-04**: Pipeline resumes from where it left off after interruption (idempotent resume)

### Keyboard Shortcuts

- [ ] **KEY-01**: j/k keys navigate between projects in dashboard grid
- [ ] **KEY-02**: a/r/f/e keys approve, regenerate, fix, and open editor for focused project
- [ ] **KEY-03**: Visual focus indicator (highlighted border) shows currently selected project
- [ ] **KEY-04**: ? key shows help overlay listing all available shortcuts

### Diff View

- [ ] **DIFF-01**: Side-by-side code diff view using Monaco diff editor for any two revisions
- [ ] **DIFF-02**: Revision history list shows all revisions with timestamps, selectable for comparison
- [ ] **DIFF-03**: Visual preview diff shows before/after rendered preview side-by-side in iframes

### Static Export

- [ ] **EXP-01**: Generated React component exportable as self-contained static HTML with inlined Tailwind CSS
- [ ] **EXP-02**: Exported HTML bundles fonts, icons, and images (no external dependencies)
- [ ] **EXP-03**: One-click download button in editor exports as .html or .zip file

### Preview Pre-Rendering

- [ ] **PRE-01**: Next 3-5 project records and generated code prefetched in background during review
- [ ] **PRE-02**: Prefetch cache evicts old entries when user navigates past them
- [ ] **PRE-03**: Navigating to a prefetched project displays instantly from cache

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Autopilot Enhancements

- **AUTO-05**: Configurable pipeline stages (skip enrichment, add manual review gate)
- **AUTO-06**: Scheduled/cron-based autopilot runs
- **AUTO-07**: Smart batching by industry for LLM warm-up

### Quality Enhancements

- **QUAL-05**: Visual regression scoring via headless browser screenshots
- **QUAL-06**: Responsiveness check at 3 viewport widths
- **QUAL-07**: Industry-specific scoring rubrics (restaurants need menus, dentists need CTAs)

### Export Enhancements

- **EXP-04**: Vercel/Netlify deploy integration via API
- **EXP-05**: Multi-page export (about, services, contact as separate routes)
- **EXP-06**: SEO metadata injection (meta tags, Open Graph, schema.org)

### Analytics Enhancements

- **ANAL-05**: Failure pattern heatmap (industry x model matrix)
- **ANAL-06**: Prompt version comparison metrics
- **ANAL-07**: CSV export of raw analytics data

### Other Enhancements

- **TMPL-05**: Negative few-shot examples for LLM contrast learning
- **PROMPT-05**: A/B testing parallel generations with different prompt versions
- **KEY-05**: Batch select with Shift+j/k for bulk operations
- **DIFF-04**: AI-generated natural language change summaries
- **PRE-04**: Background iframe pre-rendering (not just data prefetch)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user auth / RBAC | Single user, internal tool |
| Public-facing API | No external consumers |
| Rate limiting | Trusted local use only |
| Mobile app | Desktop browser workflow |
| Payment processing | Not a commercial product |
| CMS integration (WordPress/Webflow export) | Value is in static simplicity |
| Custom domain mapping | Way beyond scope, hosting is external |
| Custom report builder for analytics | Fixed dashboard sufficient for single user |
| Auto-optimization of prompts via LLM | Manual iteration safer and more predictable |
| Real-time streaming analytics dashboard | Unnecessary; refresh on navigation sufficient |
| Human calibration UI for quality scoring | Single user approves or regenerates, no feedback loop needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 1 | Complete |
| FIX-02 | Phase 1 | Complete |
| FIX-03 | Phase 1 | Complete |
| FIX-04 | Phase 1 | Pending |
| FIX-05 | Phase 1 | Pending |
| FIX-06 | Phase 1 | Complete |
| COST-01 | Phase 2 | Pending |
| COST-02 | Phase 2 | Pending |
| COST-03 | Phase 2 | Pending |
| COST-04 | Phase 2 | Pending |
| ERR-01 | Phase 2 | Pending |
| ERR-02 | Phase 2 | Pending |
| ERR-03 | Phase 2 | Pending |
| ERR-04 | Phase 2 | Pending |
| PROMPT-01 | Phase 2 | Pending |
| PROMPT-02 | Phase 2 | Pending |
| PROMPT-03 | Phase 2 | Pending |
| PROMPT-04 | Phase 2 | Pending |
| QUEUE-01 | Phase 2 | Pending |
| QUEUE-02 | Phase 2 | Pending |
| QUEUE-03 | Phase 2 | Pending |
| QUEUE-04 | Phase 2 | Pending |
| QUAL-01 | Phase 3 | Pending |
| QUAL-02 | Phase 3 | Pending |
| QUAL-03 | Phase 3 | Pending |
| QUAL-04 | Phase 3 | Pending |
| TMPL-01 | Phase 3 | Pending |
| TMPL-02 | Phase 3 | Pending |
| TMPL-03 | Phase 3 | Pending |
| TMPL-04 | Phase 3 | Pending |
| ANAL-01 | Phase 3 | Pending |
| ANAL-02 | Phase 3 | Pending |
| ANAL-03 | Phase 3 | Pending |
| ANAL-04 | Phase 3 | Pending |
| AUTO-01 | Phase 4 | Pending |
| AUTO-02 | Phase 4 | Pending |
| AUTO-03 | Phase 4 | Pending |
| AUTO-04 | Phase 4 | Pending |
| KEY-01 | Phase 5 | Pending |
| KEY-02 | Phase 5 | Pending |
| KEY-03 | Phase 5 | Pending |
| KEY-04 | Phase 5 | Pending |
| DIFF-01 | Phase 5 | Pending |
| DIFF-02 | Phase 5 | Pending |
| DIFF-03 | Phase 5 | Pending |
| EXP-01 | Phase 5 | Pending |
| EXP-02 | Phase 5 | Pending |
| EXP-03 | Phase 5 | Pending |
| PRE-01 | Phase 5 | Pending |
| PRE-02 | Phase 5 | Pending |
| PRE-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation (phase numbers updated to 1-5)*
