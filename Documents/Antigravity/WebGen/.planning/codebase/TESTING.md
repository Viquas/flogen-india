# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Status:** No automated testing framework configured or in use.

**No test files found:**
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files in the codebase
- No Jest, Vitest, or other test runner configuration
- No test dependencies in `package.json`

**Available for future setup:**
- ESLint v9 with TypeScript support (can be extended)
- Next.js testing utilities available through community packages
- TypeScript strict mode enabled for type safety

## Manual Testing Approach

**Current Pattern:**
The codebase relies on manual testing and development-time validation:

1. **API Route Testing:**
   - Direct HTTP requests to verify endpoint behavior
   - Manual testing via curl, Postman, or browser
   - Error handling tested through try-catch logging to console
   - Example: `app/api/generate/stream/route.ts` sends SSE events for real-time feedback

2. **Database Operations:**
   - Supabase queries tested directly against live database
   - `console.error()` logs capture and report failures
   - Fallback patterns allow graceful degradation when operations fail
   - Example in `app/dashboard/actions.ts`: error checking after each database operation

3. **Component Validation:**
   - Visual testing during development
   - Error boundary (`components/error-boundary.tsx`) catches and displays React errors
   - Console errors logged for debugging

4. **Schema Validation:**
   - Zod schemas (`lib/schemas/project.ts`, `lib/schemas/rich-data.ts`) validate at runtime
   - SafeParse used in API handlers to validate incoming data before processing
   - Example: `BusinessDataSchema.safeParse(otherData)` in `app/api/generate/stream/route.ts`

## Code Quality Mechanisms

**Type Safety:**
- TypeScript strict mode enabled
- All major functions have explicit return types
- Database types generated from Supabase schema
- Zod schemas provide runtime validation

**Error Tracking:**
- Console logging with context prefixes (`[Queue]`, `[Stream]`, `[AutoFix]`)
- Error messages include operation context and details
- Stack traces available in browser/server console

**Validation:**
- Zod schema validation for business data structures
- Status enum validation for project states
- API request validation before processing
- Query sanitization (example: `searchProjects()` removes special characters)

## Testing Best Practices for Future Implementation

When adding automated testing, follow these patterns observed in the codebase:

### Unit Test Structure
```typescript
// Location: lib/converters.test.ts (if tests added)
import { jsonToMarkdown, markdownToJson } from '@/lib/converters'

describe('converters', () => {
  describe('jsonToMarkdown', () => {
    it('should convert business data to markdown', () => {
      const input = JSON.stringify({
        businessName: 'Test Business',
        industry: 'Tech',
        description: 'A test business'
      })
      const result = jsonToMarkdown(input)
      expect(result).toContain('# Test Business')
      expect(result).toContain('**Industry:** Tech')
    })
  })
})
```

### Integration Test Pattern
```typescript
// Location: app/api/generate/stream/stream.test.ts
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/generate/stream', () => {
  it('should stream website code generation', async () => {
    const mockRequest = {
      json: async () => ({
        rules: 'Modern design',
        mode: 'json',
        businessName: 'Test'
      })
    } as NextRequest

    const response = await POST(mockRequest)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
  })
})
```

### Mocking Patterns
When testing is implemented, mock:
- **Database clients:** Mock `createAdminClient()` and Supabase queries
- **AI models:** Mock `generateText()` and `streamText()` from 'ai'
- **External APIs:** Mock Google Places, OpenAI, Google Gemini calls
- **File system:** Mock `saveCodeToDisk()` in file operations

Do NOT mock:
- Zod schema validation (test actual parsing)
- Business logic in server actions
- State management in React hooks
- Error handling paths

### Test Data & Fixtures

**Location:** `lib/mock-data.ts` (already exists with templates and project history)

**Current mock data:**
```typescript
export interface ProjectHistoryItem {
  // Project history interface
}

export interface Template {
  // Template interface
}

export const MOCK_TEMPLATES: Template[] = []
export const MOCK_PROJECT_HISTORY: ProjectHistoryItem[] = [
  // Mock data for development
]
```

**Pattern for test fixtures:**
Create fixtures following this structure:
```typescript
// lib/test-fixtures.ts
export const mockBusinessData = {
  businessName: 'Test Salon',
  industry: 'Beauty',
  description: 'A professional salon',
  services: ['Haircut', 'Coloring'],
  contactInfo: { email: 'test@salon.com', phone: '555-0123' }
}

export const mockProjectData = {
  id: 'test-id',
  business_data: mockBusinessData,
  status: 'review' as const,
  generated_code: 'export default function GeneratedPage() { ... }'
}
```

## Error Testing

**Current Error Handling (without tests):**
```typescript
// From app/dashboard/actions.ts
try {
  const { data, error } = await supabase.from('projects').select(...)
  if (error) {
    console.error('Failed to fetch projects by date:', error)
    return { success: false, error: error.message }
  }
  return { success: true, data }
} catch (e) {
  console.error("Error fetching projects:", e)
}
```

**When testing is added:**
- Test both error path and success path
- Verify error messages are user-friendly
- Check that fallback logic works when primary operation fails
- Ensure error logging includes context

## Coverage Recommendations

**High Priority (should test first):**
- Server actions in `app/dashboard/actions.ts` - database operations
- AI generation functions in `lib/ai/generator.ts` - complex business logic
- Schema validation in `lib/schemas/` - data integrity
- API routes in `app/api/` - external service integration

**Medium Priority:**
- Queue processing logic in `lib/queue.ts` - critical for background jobs
- Supabase client initialization in `lib/supabase/` - initialization
- React hooks in `hooks/use-realtime.ts` - state subscriptions

**Lower Priority (type safety covers most issues):**
- UI components - visual testing sufficient
- Utility functions with simple logic
- Configuration files

## Async Testing Patterns

**Queue job testing example:**
```typescript
it('should process queue jobs sequentially', async () => {
  const mockQueue = new GenerationQueue()
  await mockQueue.add('project-1')
  await mockQueue.add('project-2')

  // Should process one at a time respecting maxConcurrent = 3
  expect(mockQueue.isProcessing).toBe(true)
})
```

**Realtime subscription testing example:**
```typescript
it('should subscribe to project updates', () => {
  const { result } = renderHook(() => useRealtimeProject('id-1', initialProject))

  // Simulate postgres change
  expect(result.current.status).toBe('generating')
})
```

---

*Testing analysis: 2026-03-18*
