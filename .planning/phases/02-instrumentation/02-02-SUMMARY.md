# Plan 02-02 Summary: Instrument AI Call Sites + Error Classification

**Status:** Complete
**Started:** 2026-03-18
**Completed:** 2026-03-18

## What Was Done

### Task 1: Instrument 7 AI Call Sites with Cost Tracking
Added `recordCost`/`buildCostRecord` calls to all AI generation points:
1. `generator.ts` — generateWebsiteCode (monolithic path)
2. `generator.ts` — generateWebsiteCode (modular/section path)
3. `generator.ts` — generateAndSaveWebsite
4. `revision.ts` — reviseWebsite
5. `revision.ts` — reviseWebsiteWithPatches (if exists)
6. `enricher.ts` — enrichBusinessData
7. `app/api/generate/stream/route.ts` — streaming generation (via result.usage)
8. `app/api/chat/refine/route.ts` — chat refinement

### Task 2: Integrate Error Classification into Validation Pipeline
- Added `classifyError` and `getFixPromptForError` imports to validation.ts
- `validateAndAutoFix` now classifies errors before fixing
- Error type and details stored on project record (`error_type`, `error_details` columns)
- Targeted fix prompts used instead of generic fix-all prompt

## Key Files Modified
- `webgen/lib/ai/generator.ts` — cost tracking on generateText calls
- `webgen/lib/ai/revision.ts` — cost tracking on revision calls
- `webgen/lib/ai/enricher.ts` — cost tracking on enrichment calls
- `webgen/lib/ai/validation.ts` — error classification integration
- `webgen/app/api/generate/stream/route.ts` — streaming cost tracking
- `webgen/app/api/chat/refine/route.ts` — refinement cost tracking

## Self-Check: PASSED
- All AI call sites have recordCost/buildCostRecord calls
- Error classification integrated into validateAndAutoFix
- Targeted fix prompts replace generic fix-all prompt
- Error type/details stored on project record
