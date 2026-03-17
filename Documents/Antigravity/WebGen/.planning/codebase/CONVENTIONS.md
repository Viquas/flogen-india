# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `error-boundary.tsx`, `project-grid.tsx`)
- Utility/helper files: kebab-case (e.g., `file-utils.ts`, `html-boilerplate.ts`)
- Action files: kebab-case ending with `.ts` (e.g., `actions.ts`, `config/actions.ts`)
- Schemas: kebab-case (e.g., `project.ts`, `rich-data.ts`)

**Functions:**
- Exported functions: camelCase (e.g., `jsonToMarkdown()`, `preprocessCode()`)
- React component functions: PascalCase (e.g., `ErrorBoundary`, `DashboardPage`)
- Hook functions: camelCase with `use` prefix (e.g., `useRealtimeProject()`, `useRealtimeProjects()`)
- Server action functions: camelCase with descriptive verbs (e.g., `resetStuckProjects()`, `fixWebsiteErrors()`, `approveProject()`)

**Variables:**
- Constants: camelCase or SCREAMING_SNAKE_CASE for config (e.g., `maxDuration`, `CONCURRENCY`)
- State variables: camelCase (e.g., `hasError`, `isProcessing`, `pendingCount`)
- Database field names: snake_case (e.g., `created_at`, `generated_code`, `project_id`)

**Types:**
- Interface names: PascalCase (e.g., `ErrorBoundaryProps`, `QueueJob`, `Project`)
- Type exports: PascalCase (e.g., `type ContactInfo = z.infer<...>`)
- Zod schemas: PascalCase ending with `Schema` (e.g., `BusinessDataSchema`, `ProjectSchema`)

## Code Style

**Formatting:**
- ESLint v9 with Next.js core-web-vitals and TypeScript configs
- Config: `eslint.config.mjs` - uses flat config format
- Indentation: 2 spaces (observed in all files)
- Imports: organized with proper formatting
- No Prettier config found - relies on ESLint for formatting

**Linting:**
- Active plugins: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Builds on Next.js recommended rules with TypeScript support
- Ignores `.next/`, `out/`, `build/`, and `next-env.d.ts`

## Import Organization

**Order:**
1. External dependencies (react, next, third-party packages)
2. Type imports (from '@supabase/supabase-js', custom types)
3. Internal imports from lib (using `@/` alias)
4. Internal imports from components (using `@/` alias)
5. Inline type definitions where needed

**Path Aliases:**
- `@/*` resolves to project root `./*` (configured in `tsconfig.json`)
- All internal imports use absolute paths with `@/` prefix
- Examples: `@/lib/supabase/admin`, `@/components/ui/button`, `@/lib/schemas/project`

**Example pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import type { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProjectSchema } from '@/lib/schemas/project'
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations with `console.error()` logging
- Error objects checked with `error instanceof Error` before accessing `.message`
- Server actions return `{ success: boolean, error?: string, data?: any }`
- API routes return `NextResponse.json()` with status codes (400, 404, 500)
- Errors include context prefix (e.g., `[Queue]`, `[Stream]`, `[AutoFix]`)
- Fallback patterns for missing data (e.g., return empty array `[]` on query failure)

**Error responses follow pattern:**
```typescript
if (error) {
    console.error('Context: description', error)
    return { success: false, error: error.message }
}
```

**HTTP error responses:**
```typescript
return NextResponse.json(
    { success: false, error: 'Error message' },
    { status: 400 }
)
```

## Logging

**Framework:** `console.log()` and `console.error()` (no logging library)

**Patterns:**
- Informational logs: `console.log()` with context prefix in brackets
- Error logs: `console.error()` with full context
- Prefixes used: `[Queue]`, `[Stream]`, `[AutoFix]`, `[ErrorBoundary]`, `[CalendarActivity]`
- Database/operation context always included

**Examples:**
```typescript
console.log(`[Queue] Starting job ${job.id} for project ${job.project_id}`)
console.error('[Queue] Failed to fetch pending jobs:', fetchError.message)
console.error("[AutoFix] Enrichment failed", enrichError)
```

## Comments

**When to Comment:**
- Block comments above complex server actions explaining what they do
- JSDoc comments for exported functions explaining parameters and return values
- Inline comments for non-obvious business logic or workarounds
- Comments explaining schema validation purposes or requirements

**JSDoc/TSDoc:**
- Used for exported server actions and public functions
- Includes description, parameter types, and return type info
- Example: `/** Reset projects stuck in 'generating' status for longer than \`minutesThreshold\`. */`

## Function Design

**Size:**
- Server actions: 10-50+ lines (complex business logic expected)
- API route handlers: 30-70 lines (integration with external services)
- Utility functions: 5-30 lines (focused operations)
- React components: 50-300+ lines (large components split into multiple files)

**Parameters:**
- Named parameters preferred over positional for functions with multiple arguments
- API parameters: destructured from `NextRequest` or `req.json()`
- Server action parameters: camelCase, typed explicitly
- Optional parameters: use `?:` in type definitions

**Return Values:**
- Server actions: return object with `{ success: boolean, error?: string, data?: any }` structure
- API routes: return `NextResponse` or `Response` with JSON
- Utility functions: return typed values or null/undefined
- Async functions: always return Promise-wrapped type

**Example function pattern:**
```typescript
export async function resetStuckProjects(minutesThreshold = 10) {
    const supabase = createAdminClient()
    // ... implementation
    return { success: true, count }
}
```

## Module Design

**Exports:**
- Named exports preferred over default exports
- React components: default export (per Next.js page convention)
- Utilities and functions: named exports
- Types and schemas: named exports

**Barrel Files:**
- Not extensively used; imports are direct from source files
- Component imports use full paths: `@/components/dashboard/calendar-nav`
- Utility imports use full paths: `@/lib/supabase/admin`

**Module responsibilities:**
- `lib/` directory: Business logic, database clients, AI integration
- `components/` directory: UI components, UI logic
- `app/api/` directory: API endpoints, request handling
- `app/dashboard/` and `app/editor/`: Server page components and actions
- `hooks/` directory: Custom React hooks for client-side logic

## TypeScript

**Strict Mode:** Enabled (`"strict": true` in `tsconfig.json`)

**Type Patterns:**
- Interfaces used for component props (e.g., `DashboardPageProps`, `ErrorBoundaryProps`)
- Zod schemas for runtime validation of external data
- Type inference with `z.infer<typeof Schema>` for derived types
- Generic types for reusable utilities (e.g., `<T>` in database queries)

**Database Types:**
- `@/types/database` imports Database type from Supabase
- All database operations type-checked against schema

## React & Component Patterns

**Functional Components:**
- Always use functional components, no class components except error boundaries
- Use `export default function ComponentName()` for page components
- Use arrow functions for utility components
- Props destructured in function signature

**Hooks:**
- Hooks called at top level only
- State with `useState`
- Effects with `useEffect`
- Memoization with `useMemo` and `useCallback` where needed
- Custom hooks prefixed with `use`
- Realtime subscriptions in `useEffect` cleanup with proper unsubscribe

**Client Components:**
- Marked with `"use client"` at top of file when needed
- Server action invocation via function calls
- Form submissions via `form action="..."`

**Server Components:**
- Default unless explicitly marked `"use client"`
- Can directly call database and server actions
- Async functions for data fetching (without await in component body - use Promise.all when parallel queries needed)

---

*Convention analysis: 2026-03-18*
