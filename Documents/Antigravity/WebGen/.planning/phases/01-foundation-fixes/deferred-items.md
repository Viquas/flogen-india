# Deferred Items - Phase 01: Foundation Fixes

## Pre-existing TypeScript Errors

Discovered during Plan 01-01 verification. Out of scope for bug fix plan.

1. **`app/api/generate/process/route.ts:27`** - TS2345: `project_id` in query result is `string | null` but callback expects `string`. Needs a null filter or type assertion.

2. **`lib/ai/generator.ts:1058`** - TS7016: Missing type declarations for `@babel/standalone`. Fix: `npm i --save-dev @types/babel__standalone` or add a `.d.ts` declaration file.

*Logged: 2026-03-18*
