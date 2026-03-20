# Phase 1: Foundation Fixes - Research

**Researched:** 2026-03-18
**Domain:** Bug fixes, module decomposition, codebase cleanup (Next.js 16 + Supabase + AI SDK v6)
**Confidence:** HIGH

## Summary

Phase 1 addresses six requirements that fix known bugs, decompose a monolithic generator module, and clean up debug artifacts. The work is entirely within the existing codebase with no new libraries or external dependencies needed. All six fixes are well-scoped: three are targeted bug fixes at specific line numbers, one is a file extraction, one is a module decomposition, and one is a cleanup task.

The auto-fix bug (FIX-01) and queue race condition (FIX-02) are the highest-risk items because they involve stateful logic with database interactions. The decomposition (FIX-04/FIX-05) is the largest task by volume but carries low risk since it is a pure structural refactor with no behavioral changes. The fire-and-forget fix (FIX-03) and debug file cleanup (FIX-06) are straightforward.

**Primary recommendation:** Fix the three bugs first (FIX-01, FIX-02, FIX-03), then extract the system prompt (FIX-04), then decompose the generator (FIX-05), then clean up debug files (FIX-06). This ordering ensures behavioral fixes are isolated and testable before structural changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-01 | Auto-fix returns latest fix attempt (not original broken code) when both attempts fail, sets status to 'error' | Bug located at `generator.ts:1166`. Line returns `code` (original) instead of `fixedCode2` (latest attempt). Status update already exists at lines 1158-1164 but returns wrong code. Single-line fix. |
| FIX-02 | Queue processing uses database-level uniqueness constraint to prevent duplicate job claims | `queue_jobs` table (setup_supabase.sql:69-78) has no uniqueness constraint on `(project_id, status)`. Queue relies on optimistic locking at `queue.ts:177-187` which is insufficient under concurrent access. Requires SQL migration + application-level guard. |
| FIX-03 | Background generation tasks use proper error tracking instead of fire-and-forget Promise chains | Fire-and-forget patterns at `actions.ts:54-58` (regenerateProject) and `actions.ts:246-250` (regenerateProjects). Also in `queue.ts:36` and `queue.ts:67` (fallback paths). Need to capture errors and update project status on failure. |
| FIX-04 | System prompt extracted from generator.ts into a separate versioned file | System prompt is the `SYSTEM_PROMPT` export at `generator.ts:46-496` (~450 lines). Revision prompt at `generator.ts:498-527` (~30 lines). Both are template literals. Extract to `lib/ai/prompts/system.ts`. |
| FIX-05 | Generator module decomposed into focused modules (prompts, validation, cost tracking, error classification) | `generator.ts` is 1456 lines containing: model config (1-43), prompts (46-527), generation (530-812), revision (815-999), validation (1001-1081), auto-fix (1087-1178), project persistence (1181-1238), pipeline orchestration (1241-1411), template cleaning (1416-1456). Natural decomposition into 5-6 modules. |
| FIX-06 | Debug .txt files removed from codebase and added to .gitignore | 8 debug files found in `webgen/`: `ashwini_code.txt`, `ashwini_json.txt`, `failed_code.txt`, `processed_output.txt`, `db-dump.txt`, `project-0f.txt`, `supabase-discovery-log.txt`, `supabase-test-log.txt`. `.gitignore` already has `*.txt` and specific patterns but files persist because they were never tracked by git (repo is uninitialized/fresh). |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. Phase 1 works entirely with the existing stack:

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| Next.js | 16.1.6 | App framework, server actions | Yes |
| @supabase/supabase-js | ^2.95.3 | Database operations, migrations | Yes |
| ai (Vercel AI SDK) | ^6.0.77 | AI generation (no changes needed) | Yes |
| @babel/standalone | (bundled) | Code validation (no changes needed) | Yes |
| zod | (bundled) | Schema validation (no changes needed) | Yes |

### Supporting

No new supporting libraries needed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SQL partial unique index for FIX-02 | Supabase RPC advisory lock | Advisory locks are more complex, partial unique index is simpler and sufficient for this use case |
| Inline error tracking for FIX-03 | Sentry/error monitoring service | Over-engineering for Phase 1; structured logging + DB status updates are sufficient now |

## Architecture Patterns

### Recommended Decomposition Structure for FIX-04/FIX-05

```
webgen/lib/ai/
├── generator.ts          # Slim orchestration (~250 lines): generateAndSaveWebsite, generateWebsiteCode, streamWebsiteCode
├── revision.ts           # reviseWebsite, reviseWebsiteWithPatches (~200 lines)
├── validation.ts         # validateGeneratedCode, validateAndAutoFix (~150 lines)
├── project-persistence.ts # updateProjectWithCode (~60 lines)
├── template-cleaning.ts  # cleanTemplateCode (~50 lines)
├── model-config.ts       # getModel, provider setup (~45 lines)
├── enricher.ts           # (already separate, no changes)
└── prompts/
    ├── system.ts          # SYSTEM_PROMPT export (~450 lines)
    └── revision.ts        # REVISION_SYSTEM_PROMPT export (~30 lines)
```

### Pattern 1: Module Decomposition Without Behavioral Change

**What:** Extract functions from a monolith into focused modules, re-exporting from the original file to preserve all existing import paths.

**When to use:** When a file exceeds maintainability thresholds (300+ lines) but many other files import from it.

**Approach:**
1. Create new module files with the extracted functions
2. Update `generator.ts` to import from new modules and re-export everything it currently exports
3. All external consumers (`queue.ts`, `actions.ts`, `app/api/` routes) continue importing from `generator.ts` unchanged
4. In a subsequent step (after verification), update consumers to import from specific modules directly

This ensures zero breaking changes during decomposition.

### Pattern 2: Database-Level Constraint for Concurrency Safety (FIX-02)

**What:** Use a PostgreSQL partial unique index to prevent two `processing` jobs for the same `project_id`.

**SQL:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_jobs_project_processing
ON queue_jobs (project_id)
WHERE status = 'processing';
```

This allows multiple completed/failed jobs per project but prevents two simultaneous `processing` entries. The existing optimistic lock at `queue.ts:177-187` (update WHERE status='pending') remains as application-level defense; the database constraint is the hard guarantee.

### Pattern 3: Error-Capturing Background Tasks (FIX-03)

**What:** Replace fire-and-forget `.then().catch(console.error)` with structured error capture that updates the project status in the database.

**Current pattern (broken):**
```typescript
generateAndSaveWebsite(projectId).then(() => {
    console.log(`Regeneration completed for ${projectId}`)
}).catch(err => {
    console.error(`Regeneration failed for ${projectId}`, err)
})
```

**Fixed pattern:**
```typescript
generateAndSaveWebsite(projectId).then(() => {
    console.log(`Regeneration completed for ${projectId}`)
}).catch(async (err) => {
    console.error(`Regeneration failed for ${projectId}`, err)
    const supabase = createAdminClient()
    await supabase
        .from('projects')
        .update({
            status: 'error',
            generation_phase: `Generation failed: ${err instanceof Error ? err.message.substring(0, 200) : 'Unknown error'}`,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
})
```

The key insight: `generateAndSaveWebsite` already handles most errors internally (see `generator.ts:1396-1410`), but if it throws an unhandled error, the fire-and-forget wrapper silently swallows it. The fix ensures database state is updated even for unhandled exceptions.

### Anti-Patterns to Avoid

- **Moving files and updating imports in one step:** Decompose by extracting code to new files and re-exporting from the original. Update import paths only after verification that re-exports work.
- **Changing behavior during decomposition:** FIX-05 must be a pure structural refactor. No bug fixes, no logic changes -- just moving code between files. Bug fixes (FIX-01) should be committed separately.
- **Adding a unique constraint without handling the insert error:** After adding the partial unique index for FIX-02, the `queue.ts` `add()` method must handle the potential uniqueness violation error gracefully (e.g., log a warning that job already exists for this project).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Preventing duplicate processing jobs | Application-level distributed lock | PostgreSQL partial unique index | Database constraint is the only truly race-condition-safe approach; application logic can always have TOCTOU gaps |
| Module re-exports after decomposition | Manual index.ts barrel file | Direct re-exports from generator.ts | Barrel files add indirection; re-exporting from the original module preserves all existing import paths |

**Key insight:** Every fix in this phase uses existing tools and patterns. The complexity is in correctly modifying existing code, not in adopting new technology.

## Common Pitfalls

### Pitfall 1: Auto-Fix Return Value Change Breaks Caller Assumptions

**What goes wrong:** Changing `return code` to `return fixedCode2` at line 1166 could subtly change behavior if callers assume the returned code always passes validation when status is not 'error'.
**Why it happens:** `validateAndAutoFix` is called from two places: `generateAndSaveWebsite` (line 1318 and 1384). Both callers immediately save the returned code via `updateProjectWithCode`, which sets status to 'review'.
**How to avoid:** After `validateAndAutoFix` returns `fixedCode2` (which still has errors), the status is already set to 'error' at line 1158-1164. But `updateProjectWithCode` (line 1226) overwrites status to 'review'. The fix must ensure that when `validateAndAutoFix` has marked the project as 'error', the subsequent `updateProjectWithCode` does NOT override the status back to 'review'. Two options: (a) have `validateAndAutoFix` return a flag indicating fix failed, and skip the `updateProjectWithCode` call; or (b) make `updateProjectWithCode` not overwrite an 'error' status. Option (a) is cleaner.
**Warning signs:** After the fix, check that projects with failed auto-fix end up with status 'error', not 'review'.

### Pitfall 2: Partial Unique Index Must Handle the Error in Application Code

**What goes wrong:** Adding the database constraint for FIX-02 without updating `queue.ts` to handle the constraint violation error. When the unique index rejects a duplicate, Supabase returns a PostgreSQL error (code 23505). If unhandled, it falls through to the fallback direct-generation path at `queue.ts:33-37`, creating a second generation outside the queue.
**Why it happens:** The existing code has a catch-all error handler that falls back to direct generation on ANY insert error.
**How to avoid:** After adding the constraint, update the error handling in `queue.ts` `add()` to distinguish between "unique violation" (safe to ignore -- job already exists) and other errors (fall back to direct generation). Check for PostgreSQL error code `23505` or the string `duplicate key`.
**Warning signs:** Same project appearing in both queue-based and direct generation paths simultaneously.

### Pitfall 3: Decomposition Breaks Circular Dependencies

**What goes wrong:** `generator.ts` has internal cross-references: `generateAndSaveWebsite` calls `generateWebsiteCode`, `reviseWebsite`, `validateAndAutoFix`, and `updateProjectWithCode`. If these are split into separate files that import each other, circular module dependencies can cause runtime `undefined` errors.
**Why it happens:** `validation.ts` needs `reviseWebsite` (for auto-fix), and the orchestrator needs both validation and revision.
**How to avoid:** Structure the dependency graph as a DAG: `prompts/` (no deps) -> `model-config.ts` (no deps) -> `revision.ts` (imports model-config, prompts) -> `validation.ts` (imports revision) -> `generator.ts` (imports everything, orchestrates). Never let a lower-level module import from `generator.ts`.
**Warning signs:** `TypeError: X is not a function` errors at runtime after decomposition.

### Pitfall 4: .gitignore Already Has *.txt -- Files Were Never Committed

**What goes wrong:** The `.gitignore` already contains `*.txt` (line 27). The debug files exist on disk but were never committed to git (the git status shows the entire `./` directory as untracked). Simply running `git rm` will fail because these files are not tracked.
**Why it happens:** The entire webgen project directory appears to be untracked (per git status showing `?? ./`).
**How to avoid:** Just delete the files from disk. Verify `.gitignore` already covers `*.txt` (it does). No git operations needed for the files themselves -- just `rm` them. The `.gitignore` already prevents their return.
**Warning signs:** `git rm` failing with "not under version control" errors.

### Pitfall 5: validateAndAutoFix Status Override Race

**What goes wrong:** The `validateAndAutoFix` function sets `status: 'error'` at line 1158-1164. But the caller (`generateAndSaveWebsite`) then calls `updateProjectWithCode` which unconditionally sets `status: 'review'` at line 1226. This means the 'error' status gets immediately overwritten.
**Why it happens:** The auto-fix function and the save function both update the same project row's status, with no coordination.
**How to avoid:** The fix for FIX-01 should make `validateAndAutoFix` return both the code AND a boolean `fixFailed` flag. When `fixFailed` is true, the caller should still save the code (for inspection) but skip `updateProjectWithCode` and instead save with `status: 'error'` directly. Or better: return `{ code, status }` where status is either 'review' (fix worked or code was valid) or 'error' (fix failed).
**Warning signs:** Projects that should show as 'error' appearing as 'review' after auto-fix failure.

## Code Examples

### FIX-01: Auto-Fix Return Value Fix

The bug is at `webgen/lib/ai/generator.ts` line 1166. Current code returns original broken `code` instead of the latest attempt `fixedCode2`:

```typescript
// CURRENT (line 1166): returns original broken code
return code

// FIXED: return the latest fix attempt for inspection
return fixedCode2
```

But this alone is insufficient due to Pitfall 5 (status override). The function signature should change to:

```typescript
// CURRENT signature
async function validateAndAutoFix(
    code: string, businessData: any, projectId: string, supabase: any
): Promise<string>

// RECOMMENDED new signature
async function validateAndAutoFix(
    code: string, businessData: any, projectId: string, supabase: any
): Promise<{ code: string; fixFailed: boolean }>
```

Then at callers (lines 1318 and 1384):
```typescript
// CURRENT
const validatedCode = await validateAndAutoFix(code, data, projectId, supabase)
const updateResult = await updateProjectWithCode(projectId, validatedCode)

// FIXED
const { code: validatedCode, fixFailed } = await validateAndAutoFix(code, data, projectId, supabase)
if (fixFailed) {
    // Save code for inspection but preserve 'error' status
    await supabase.from('projects').update({
        generated_code: validatedCode,
        status: 'error',
        updated_at: new Date().toISOString(),
    }).eq('id', projectId)
} else {
    const updateResult = await updateProjectWithCode(projectId, validatedCode)
}
```

### FIX-02: Partial Unique Index Migration

```sql
-- Migration: Add partial unique index to prevent duplicate processing jobs
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_jobs_project_processing
ON queue_jobs (project_id)
WHERE status = 'processing';

-- Optional: also prevent duplicate pending jobs for same project
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_jobs_project_pending
ON queue_jobs (project_id)
WHERE status = 'pending';
```

Application-side guard in `queue.ts` `add()` method:
```typescript
const { error: insertError } = await supabase.from('queue_jobs').insert(payload)
if (insertError) {
    // Check if this is a uniqueness constraint violation (job already queued/processing)
    if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
        console.log(`[Queue] Job already exists for project ${projectId}, skipping duplicate`)
        return
    }
    // Other errors: fall back to direct generation
    console.error('[Queue] queue_jobs insert failed, falling back:', insertError.message)
    // ... existing fallback logic
}
```

### FIX-03: Fire-and-Forget Error Capture Locations

Four locations need updating in two files:

1. `actions.ts:54-58` (regenerateProject) -- single project background generation
2. `actions.ts:246-250` (regenerateProjects) -- batch background generation
3. `queue.ts:36` (add fallback) -- queue insert failure fallback
4. `queue.ts:67` (addBatch fallback) -- batch queue insert failure fallback

## State of the Art

No changes in technology landscape relevant to this phase. All fixes use existing PostgreSQL features and TypeScript patterns.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fire-and-forget promises | Structured error capture with DB status update | This phase | Failures become visible in dashboard |
| Optimistic lock only | Optimistic lock + DB uniqueness constraint | This phase | Eliminates theoretical race condition |

## Open Questions

1. **Should `validateAndAutoFix` save to disk even when fix fails?**
   - What we know: `updateProjectWithCode` calls `saveCodeToDisk` (line 1187) and creates a revision snapshot. When fix fails, we want the latest attempt code saved to DB but unclear if disk save is needed.
   - What's unclear: Whether `saved_html/` directory is used for anything other than backup.
   - Recommendation: Save to DB (for inspection) but skip `updateProjectWithCode` entirely for failed fixes. Just do a direct `supabase.update()` with the code and 'error' status. This avoids creating a misleading revision snapshot for broken code.

2. **Should the queue pending index be added alongside the processing index?**
   - What we know: The partial unique index on `(project_id) WHERE status = 'processing'` prevents duplicate processing. But a project could also have multiple `pending` jobs.
   - What's unclear: Whether the `addBatch` function ever intentionally creates duplicate pending jobs for the same project.
   - Recommendation: Add both indexes (`pending` and `processing`). The `addBatch` function creates one job per project ID, so duplicates would be bugs. Handle constraint violations gracefully in both `add()` and `addBatch()`.

3. **How should decomposed modules handle the Supabase client dependency?**
   - What we know: `generator.ts` currently uses dynamic `import('@/lib/supabase/admin')` inside functions. The validation module will need `reviseWebsite` from the revision module for auto-fix.
   - What's unclear: Whether to pass Supabase client as a parameter or continue using dynamic imports.
   - Recommendation: Continue using dynamic imports (consistent with existing pattern). Pass the Supabase client as a parameter only to `validateAndAutoFix` (which already receives it).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all existing dependencies
- Architecture: HIGH - Decomposition structure derived from clear function boundaries in the existing 1456-line file
- Pitfalls: HIGH - All bugs have exact line numbers, all fixes have verified approaches from reading the actual code

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- no moving targets in this phase)

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `webgen/lib/ai/generator.ts` (1456 lines, all function boundaries mapped)
- Direct code analysis of `webgen/lib/queue.ts` (259 lines, race condition at lines 176-192)
- Direct code analysis of `webgen/app/dashboard/actions.ts` (577 lines, fire-and-forget at lines 54-58, 246-250)
- Database schema from `webgen/setup_supabase.sql` (queue_jobs table definition at lines 69-78)
- TypeScript types from `webgen/types/database.ts` (queue_jobs schema at lines 183-231)
- `.gitignore` at `webgen/.gitignore` (already has `*.txt` rule at line 27)
- `.planning/codebase/CONCERNS.md` (bug documentation with line numbers)
- `.planning/codebase/ARCHITECTURE.md` (layer architecture, data flows)
- `.planning/research/PITFALLS.md` (CC1, CC3, P1, P7, P10, P11 all reference Phase 1 prerequisites)
