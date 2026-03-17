# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

**Loose Type Safety in Schema Validation:**
- Issue: Multiple schema fields use `z.any()` instead of specific types, bypassing validation entirely
- Files: `lib/schemas/rich-data.ts`
- Examples: `heroVideo`, `header`, `footer`, `providers`, `eventMapping`, `favicon`, `raster`, `accessibility`, `pages`
- Impact: AI-generated code can receive undefined or malformed data, leading to runtime crashes. Type-unsafe code paths aren't caught at compile time.
- Fix approach: Replace `z.any()` with precise Zod schemas. Add strict validation tests for each schema field. Consider generating types from Supabase schema automatically.

**Type Casting Throughout Generator Logic:**
- Issue: Widespread use of `as any` casts in `lib/ai/generator.ts` to bypass TypeScript strict mode
- Files: `lib/ai/generator.ts` (lines with `(richData.brandIdentity as any)`, `(e.target as HTMLImageElement)`)
- Impact: Masks real type errors. Future refactoring risks breaking code silently.
- Fix approach: Remove all `as any` casts. Use proper discriminated unions and type guards. Add exhaustiveness checks.

**Debug/Test Files in Production:**
- Issue: Multiple `.txt` files containing test data and debugging output remain in the codebase
- Files: `ashwini_code.txt`, `ashwini_json.txt`, `failed_code.txt`, `processed_output.txt`, `db-dump.txt`, `project-0f.txt`, `supabase-discovery-log.txt`, `supabase-test-log.txt`
- Impact: Increases deployment size, confusion about what's production code. Security risk if these contain sensitive data.
- Fix approach: Delete all `.txt` files. Move any needed test data to `tests/fixtures/` directory. Add `.txt` to `.gitignore`.

**Fire-and-Forget Async Operations:**
- Issue: Background generation tasks in `app/dashboard/actions.ts` use promise chains without proper error tracking
- Files: `app/dashboard/actions.ts` (lines 54-58, 247-250)
- Example: `generateAndSaveWebsite(projectId).then(...).catch(console.error)` with no retry mechanism
- Impact: Failed generations go undetected until user checks. No observability into why a generation failed.
- Fix approach: Integrate with job queue system properly. Add exponential backoff retries. Implement proper error logging with Sentry or similar.

**Incomplete Error Boundaries:**
- Issue: Client component `EditorPage` has no error boundary, only Suspense fallback
- Files: `app/editor/page.tsx`
- Impact: A single error in nested components crashes the entire editor page with no recovery.
- Fix approach: Wrap `<EditorContent />` in an error boundary component. Implement specific error UI for preview failures vs. API failures.

## Known Bugs

**Auto-Fix May Mask Original Errors:**
- Symptoms: When code validation fails, two o3-mini fix attempts run. If both fail, original code is returned without marking project as fixed.
- Files: `lib/ai/generator.ts` (lines 1093-1177, specifically line 1166)
- Trigger: Generate code that has validation errors → validation fails → auto-fix runs → both attempts fail → original broken code saved
- Impact: User sees "generated" status but code is broken. Confusing UX.
- Workaround: Manually trigger "Fix All Errors" to retry. Check project status carefully before approving.
- Fix approach: Return the latest fixed attempt (fixedCode2) even if still invalid, not the original. Update project with `status: 'error'` to signal it needs manual review.

**Race Condition in Queue Processing:**
- Symptoms: Multiple queue processors could theoretically claim the same job if optimistic locking fails
- Files: `lib/queue.ts` (lines 176-192)
- Trigger: High concurrency + network latency between jobs updating status
- Impact: Rare, but same project could be generated twice simultaneously, overwriting each other's results.
- Workaround: Current implementation limits concurrency to 3, reducing risk. Monitor queue_jobs table for duplicates.
- Fix approach: Add database-level uniqueness constraint on `(project_id, status='processing')`. Or use distributed lock with Supabase advisory locks.

**Babel Transform Silently Drops Invalid Code:**
- Symptoms: Code validation in `validateGeneratedCode` may miss complex syntax errors that Babel can't parse
- Files: `lib/ai/generator.ts` (lines 1056-1078)
- Trigger: Code with syntax errors that don't match regex patterns in lines 1031-1042
- Impact: Code passes validation but breaks when rendered in preview iframe
- Fix approach: Improve Babel error handling. Catch specific SyntaxError exceptions. Add regex patterns for more error types.

**HTML Preview Escaping Issues:**
- Symptoms: Special HTML characters in generated component props may not escape properly in preview
- Files: `lib/utils/html-boilerplate.ts` (line 65)
- Example: JSON string with `<` or `>` inside it gets escaped as `\u003c` but might break JSX parsing
- Impact: Some generated pages fail to render in preview despite being syntactically valid
- Fix approach: Test with special characters in business data (names with `<`, descriptions with `>`). Use safer serialization.

## Security Considerations

**Environment Variables Not Validated at Startup:**
- Risk: Missing or invalid AI API keys silently fall back to alternatives, potentially using wrong models
- Files: `lib/ai/generator.ts` (lines 27-42), `app/api/generate/stream/route.ts` (line 27-31)
- Current mitigation: Stream route checks if ANY key exists, but doesn't validate which one was requested
- Recommendations:
  - Validate required env vars at server startup, fail fast
  - Log which model/API is being used for each generation
  - Add monitoring alert if fallbacks are triggered frequently

**Unvalidated Admin Client Creation:**
- Risk: `createAdminClient()` uses service role key without validation. If key is leaked, full DB access compromised.
- Files: `lib/supabase/admin.ts`
- Current mitigation: Service role key should be in `.env` (not committed), but no runtime checks
- Recommendations:
  - Add assertions that service role key exists before using admin client
  - Implement request signing to verify requests come from trusted origin
  - Log all admin operations to audit table

**XSS Risk in Live Preview:**
- Risk: Generated code runs in sandboxed iframe, but user-provided business data could contain malicious scripts
- Files: `app/editor/page.tsx` → `LivePreview` component, `lib/utils/html-boilerplate.ts`
- Current mitigation: Code preprocesses to remove `dangerouslySetInnerHTML`, but input validation is loose
- Recommendations:
  - Sanitize all user input before passing to generator
  - Validate business_data against strict schema before using in any code
  - Add Content Security Policy headers to preview iframe

**API Routes Lack Rate Limiting:**
- Risk: `/api/generate/stream`, `/api/chat/refine`, `/api/discovery/google-places` accept unlimited requests
- Files: `app/api/generate/stream/route.ts`, `app/api/chat/refine/route.ts`, `app/api/discovery/google-places/route.ts`
- Current mitigation: None detected
- Recommendations:
  - Implement rate limiting per IP/user (Upstash Redis or similar)
  - Add request size limits
  - Implement circuit breaker for external API calls

**Secrets in Error Messages:**
- Risk: Error messages could leak API keys or sensitive data
- Files: `app/dashboard/actions.ts` and many error handlers
- Example: If API returns error with key in response, it gets logged to console
- Recommendations:
  - Sanitize all error messages before logging
  - Never log full error objects; log structured error codes instead
  - Use monitoring service that redacts secrets

## Performance Bottlenecks

**Large Generator File (1456 lines):**
- Problem: `lib/ai/generator.ts` contains system prompt (1000+ lines), multiple functions, and complex validation
- Files: `lib/ai/generator.ts`
- Cause: Monolithic design makes it hard to maintain and difficult to test parts independently
- Improvement path:
  - Extract system prompt to separate file `lib/ai/prompts/system.ts`
  - Move validation logic to `lib/validators/generated-code.ts`
  - Split generator into `generateAndSaveWebsite`, `reviseWebsite`, `streamWebsiteCode` modules
  - Add lazy loading of validation dependencies

**Queue Processing Busy Loop:**
- Problem: Queue processor polls database every 2 seconds even with no jobs pending (lines 153-154)
- Files: `lib/queue.ts` (line 153)
- Cause: No database subscription/notification, only polling
- Improvement path:
  - Replace polling with Supabase realtime subscription for `queue_jobs` table
  - Implement exponential backoff: if no jobs found, wait 30s before next poll
  - Add metrics to track queue depth and processing time

**Synchronous Babel Transform on Every Validation:**
- Problem: Babel transform runs synchronously in main thread during code generation
- Files: `lib/ai/generator.ts` (lines 1058-1070)
- Cause: No caching, no worker threads
- Improvement path:
  - Move Babel transform to worker thread
  - Cache validation results by code hash
  - Implement timeout (currently unbounded)
  - Add metrics to measure transform time

**Icon Lookup With String Replacement:**
- Problem: Phosphor icon lookup uses regex matching and string replacement in hot path
- Files: `lib/utils/html-boilerplate.ts` (lines 142-200+)
- Cause: Every generated page re-processes icon names
- Improvement path:
  - Pre-compute icon mapping once
  - Use lookup table instead of regex
  - Cache icon resolution results

## Fragile Areas

**Business Data Enrichment Flow:**
- Files: `lib/ai/enricher.ts`, `app/dashboard/actions.ts` (lines 88-103)
- Why fragile:
  - Enrichment is optional and silently skipped if it fails
  - No rollback if enrichment succeeds but generation fails
  - Dependencies between enrichment and validation not explicit
- Safe modification:
  - Make enrichment idempotent (safe to retry)
  - Add `$$manifest` version check to detect stale enriched data
  - Add unit tests for enrichment edge cases
  - Document when enrichment must run vs. when it's optional

**Code Patch Application in Revisions:**
- Files: `lib/ai/generator.ts` (lines 814-920)
- Why fragile:
  - Patches applied sequentially; if middle patch fails, following patches may still apply
  - No transaction semantics; if generation crashes mid-patch, state is corrupted
  - Fallback to full rewrite is silent
- Safe modification:
  - Validate all patches before applying any
  - Track which patches succeeded for error reporting
  - Add dry-run mode to preview patches before committing
  - Test coverage: add test cases for patch ordering and failure modes

**Project Status State Machine:**
- Files: Database schema in `types/database.ts`, status updates in `app/dashboard/actions.ts`
- Why fragile:
  - Status transitions are not validated (can jump from any state to any state)
  - No guards against invalid state transitions (e.g., `deployed` → `generating`)
  - Race conditions possible when multiple actors update simultaneously
- Safe modification:
  - Create explicit state machine with allowed transitions
  - Add database constraints to prevent invalid transitions
  - Implement locking mechanism for concurrent updates
  - Test coverage: test all valid and invalid transitions

**Preview iframe Error Handling:**
- Files: `lib/utils/html-boilerplate.ts` (lines 123-140)
- Why fragile:
  - Global error handler may not catch all errors (async, network, etc.)
  - Error display logic depends on root div being empty (brittle assumption)
  - No timeout or fallback if script never loads
- Safe modification:
  - Add timeout handler (10s max for script to load)
  - Use MutationObserver to detect when root is rendered
  - Add additional error sources: CSP violations, resource loading failures
  - Test coverage: test all error types that might occur in preview

## Scaling Limits

**Queue Processing Concurrency Fixed at 3:**
- Current capacity: 3 simultaneous generations per server instance
- Limit: Will bottleneck at ~100 projects/hour per instance (assuming 60s avg generation time)
- Scaling path:
  - Move from in-process queue to managed queue (Vercel Queues, AWS SQS, Inngest)
  - Scale horizontally by deploying multiple instances
  - Add metrics to monitor queue depth and processing latency

**Database Connections via Supabase:**
- Current capacity: Supabase free tier has connection pool limits (~50 concurrent)
- Limit: Will hit connection exhaustion under load if all requests try to connect simultaneously
- Scaling path:
  - Implement connection pooling at application level (pgBouncer in Supabase)
  - Migrate to dedicated Supabase tier with larger connection pool
  - Reduce connection lifetime per request

**Stream Generation Timeout (5 minutes):**
- Current capacity: Vercel function timeout is 5 minutes by default
- Limit: Complex generations may be cut off mid-stream
- Scaling path:
  - For self-hosted: increase timeout to 15+ minutes
  - For Vercel: switch to background jobs (Inngest) instead of direct streaming
  - Add checkpoint/resume mechanism so long generations can resume

**Babel Transform Memory:**
- Current capacity: Babel standalone loads entire compiler into memory
- Limit: Very large components (>50KB) may OOM on serverless
- Scaling path:
  - Move Babel transform to edge function with higher memory
  - Implement code splitting: generate pages in chunks
  - Use lighter transpiler (SWC, esbuild) instead of Babel

## Dependencies at Risk

**AI SDK v6 Breaking Changes:**
- Risk: `ai` SDK is rapidly evolving; v6 is latest but v7 may break compatibility
- Files: `package.json` (pins `"ai": "^6.0.77"`)
- Impact: New major version could break `streamText`, `generateText`, or output schema
- Migration plan:
  - Pin to exact version `6.0.77` until testing completed for v7
  - Add integration tests for AI SDK functions
  - Subscribe to GitHub releases for breaking changes
  - Test migration to v7 quarterly

**OpenAI SDK Model String Format:**
- Risk: OpenAI frequently deprecates old model IDs (e.g., `gpt-3.5-turbo`)
- Files: `lib/ai/generator.ts` (line 42 uses `'o3'`, not `'o3-mini'`)
- Impact: If model is deprecated, default generation will fail silently
- Migration plan:
  - Add database config table for model names (not hardcoded)
  - Implement auto-fallback: try requested model, fallback to backup
  - Monitor OpenAI deprecation announcements monthly

**Supabase SDK Stability:**
- Risk: `@supabase/supabase-js` v2.95.3 is somewhat outdated
- Files: `package.json` pins `"@supabase/supabase-js": "^2.95.3"`
- Impact: Missing security patches, missing new features like realtime
- Migration plan:
  - Upgrade to latest v2 version next minor release
  - Run full integration test suite after upgrade
  - Monitor Supabase changelog for breaking changes

**Next.js 16 Early Release:**
- Risk: Using `next@16.1.6` with `react@19` - both are new and may have bugs
- Files: `package.json`
- Impact: Compatibility issues with ecosystem packages, potential security issues
- Migration plan:
  - Pin to LTS (v15) if stability is critical
  - If staying on v16, run comprehensive tests before production deployment
  - Watch Next.js GitHub issues for v16-specific regressions

## Missing Critical Features

**No Generation History/Audit Log:**
- Problem: Can't see what changes were made between revisions or who made them
- Blocks: Compliance requirements, debugging failed generations, reverting to exact prior state
- Schema exists (`project_revisions` table) but no UI to browse or filter by date/user

**No Rate Limiting on Public APIs:**
- Problem: `/api/generate/stream` and others accept unlimited requests
- Blocks: Can't safely expose API to external users without DoS protection
- Recommendation: Add Vercel KV or Upstash Redis middleware for rate limiting

**No Observability/Analytics:**
- Problem: No metrics on generation success rate, average time, cost per generation
- Blocks: Can't optimize performance or detect issues
- Recommendation: Integrate with Vercel Analytics, add custom events, log to external service

**No Manual Intervention UI for Stuck Jobs:**
- Problem: Jobs stuck in 'processing' can only be reset via manual DB query
- Blocks: Operational debugging when queue gets wedged
- Recommendation: Add admin dashboard to view/retry/cancel queue jobs

## Test Coverage Gaps

**Auto-Fix Recursion Logic Untested:**
- What's not tested: Second retry attempt with previous fixed code
- Files: `lib/ai/generator.ts` (lines 1142-1154)
- Risk: If fix attempt 1 returns code with new errors, attempt 2 may not handle it correctly
- Priority: High

**Code Patch Merging Edge Cases:**
- What's not tested: Patches that overlap, patches out of order, patches to same line multiple times
- Files: `lib/ai/generator.ts` (lines 814-920)
- Risk: Invalid patches could corrupt code silently
- Priority: High

**Queue Recovery After Server Crash:**
- What's not tested: Recovery when server crashes mid-job, orphaned jobs
- Files: `lib/queue.ts` (lines 77-112)
- Risk: Jobs could be lost or stuck forever after outage
- Priority: Medium

**Preview Iframe Sandbox Escape:**
- What's not tested: Whether generated code respects sandbox constraints
- Files: `lib/utils/html-boilerplate.ts`
- Risk: Malicious generated code could potentially escape sandbox
- Priority: Medium (only a risk if untrusted users can generate code)

**Business Data Validation Against Schema:**
- What's not tested: Invalid business_data that should fail validation but doesn't
- Files: `lib/schemas/project.ts`
- Risk: Bad data reaches generator, causes cryptic errors
- Priority: Medium

**Concurrent Project Editing:**
- What's not tested: Two clients editing same project simultaneously
- Files: `app/editor/page.tsx`, `app/dashboard/actions.ts`
- Risk: Concurrent updates could lose data or create inconsistent state
- Priority: Low (would need real-time collaboration feature)

---

*Concerns audit: 2026-03-18*
