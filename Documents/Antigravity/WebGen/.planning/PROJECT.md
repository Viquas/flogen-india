# WebGen

## What This Is

An internal bulk AI website generator. Discovers businesses via Google Places, enriches their data, generates React/Tailwind landing pages using LLMs (Gemini/OpenRouter/OpenAI), and provides an editor for review/revision/approval. Built for a single user to generate high volumes of business websites efficiently.

## Core Value

Maximize the number of high-quality websites generated per hour with minimal manual intervention.

## Requirements

### Validated

- ✓ Google Places business discovery with pagination and deduplication — existing
- ✓ AI-powered website generation from business data (Gemini/OpenRouter/OpenAI fallback chain) — existing
- ✓ Streaming code generation with SSE and live preview — existing
- ✓ Dashboard with calendar view, project grid, and stats — existing
- ✓ Code editor with Monaco, live preview, and device mode switching — existing
- ✓ Revision system with AI-powered chat refinement — existing
- ✓ Auto-fix error recovery with retry logic — existing
- ✓ Batch creation from discovery results — existing
- ✓ Queue system with concurrent processing (max 3) — existing
- ✓ Supabase database with projects, batches, queue_jobs, revisions tables — existing
- ✓ File-based persistence (saved_html/) alongside database storage — existing
- ✓ Real-time project status updates via Supabase subscriptions — existing
- ✓ Template save/load system — existing
- ✓ Business data enrichment from Google Places — existing

### Active

- [ ] End-to-end batch autopilot (discover → generate → auto-fix → surface only failures)
- [ ] Generation quality scoring (auto-evaluate renders, sections, responsiveness)
- [ ] Industry-aware template seeding (use best approved outputs as few-shot examples)
- [ ] Cost and token tracking per generation across all providers
- [ ] One-click deploy/export pipeline (static HTML bundle or hosting push)
- [ ] Keyboard-driven review workflow (j/k navigate, a approve, r regenerate, f fix, e edit)
- [ ] Smart error classification with targeted fix strategies
- [ ] Diff view for revisions (before/after comparison using project_revisions)
- [ ] Generation analytics dashboard (success rate by model/industry, timing, failure patterns)
- [ ] Prompt versioning (extract system prompt, version it, tag generations)
- [ ] Queue health and stuck job admin UI (surface resetStuckProjects visually)
- [ ] Parallel preview pre-rendering (background render next 5 projects during review)

### Out of Scope

- Multi-user auth / RBAC — single user, internal tool
- Public-facing API — no external consumers
- Rate limiting — trusted local use only
- Mobile app — desktop browser workflow
- Payment processing — not a commercial product
- CI/CD pipeline — deploy manually or via Vercel

## Context

- Brownfield project with established Next.js 16 + Supabase + AI SDK v6 stack
- Editor page is the most complex component (~56KB, client-side heavy)
- Generator module is monolithic (1456 lines, 1000+ line system prompt)
- No test suite exists — relies on manual testing and type safety
- Queue system uses polling (2s interval), no Supabase realtime subscription
- Auto-fix silently returns original broken code if both fix attempts fail
- 8 debug .txt files remain in codebase
- No observability beyond console.log with semantic prefixes

## Constraints

- **Single user**: All features optimized for power-user workflow, no multi-tenancy
- **AI provider costs**: Must track spend — running hundreds of generations adds up
- **Existing schema**: Must work with current Supabase tables (projects, batches, queue_jobs, revisions)
- **No breaking changes**: Existing generation pipeline must keep working while improvements are added
- **Next.js 16**: Stay on current framework version, use App Router patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing Supabase schema | Avoid migration complexity, extend with new columns/tables | — Pending |
| All 12 improvements in scope | User wants comprehensive upgrade of internal tool | — Pending |
| Maintain existing generation pipeline | Can't break what works while adding features | — Pending |

---
*Last updated: 2026-03-18 after initialization*
