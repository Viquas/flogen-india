# TESTING.md

## Status: No Tests

This codebase has **zero test coverage**. No test framework is installed.

## Evidence

- Root `package.json` test script: `echo "Error: no test specified" && exit 1`
- No Jest, Vitest, Playwright, or any testing library in dependencies
- No test files (`*.test.js`, `*.spec.js`, `*.test.ts`, `*.spec.ts`) anywhere in the codebase
- No `__tests__/` directories

## Implications

- All validation is manual/visual
- No regression protection for refactoring
- Adding tests would require setting up a framework from scratch

## Recommended Setup (if adding tests)

- **Unit/Integration:** Vitest (compatible with Vite/Next.js, fast)
- **E2E:** Playwright (already installed as MCP tool in dev environment)
- **Component:** React Testing Library + Vitest
