# Phase 11: Auth Infrastructure & Schema - Research

**Researched:** 2026-03-25
**Domain:** Supabase Auth session management via Next.js 16 proxy.ts, database schema migrations, RLS policies
**Confidence:** HIGH

## Summary

Phase 11 is pure infrastructure: no user-facing features, just the foundation every subsequent v3.0 phase depends on. The work breaks into three distinct areas: (1) proxy.ts with Supabase session refresh and portal route protection, (2) SQL migrations for the new `client_requests` table and column additions to `claims` and `projects`, and (3) TypeScript type updates to match the schema changes.

The most critical correctness concern is the proxy.ts matcher configuration. The project currently has NO middleware or proxy -- adding one touches every HTTP request. A whitelist matcher targeting ONLY `/portal/:path*` and `/auth/callback` is mandatory. Running the proxy on all routes would break the Razorpay webhook (which reads `request.text()` for HMAC verification on line 9 of `razorpay/route.ts`), add unnecessary latency to admin routes, and interfere with public claim pages.

The existing Supabase client infrastructure (`lib/supabase/server.ts`, `admin.ts`, `client.ts`) already implements the `getAll`/`setAll` cookie bridge pattern needed by `@supabase/ssr`. The proxy utility adapts this same pattern for the proxy context where `cookies()` from `next/headers` is not available -- instead, cookies are read/written via `request.cookies` and `response.cookies`.

**Primary recommendation:** Implement proxy.ts with a strict whitelist matcher, then run the three SQL migrations, then update TypeScript types. Verify the webhook, admin, and claim pages still work BEFORE touching any portal code.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Unauthenticated /portal/* requests redirect to /portal/login
- After successful login, always redirect to /portal (no redirect-back logic -- portal is single-page, no deep links)
- Login page includes "forgot password" / password reset flow from day one (Supabase built-in)
- proxy.ts handles /auth/callback route for Supabase auth email confirmations and password reset links
- proxy.ts whitelist matcher: only /portal/:path* and /auth/callback -- nothing else touches auth middleware
- 5 request types in the ENUM: logo_upload, text_change, domain_setup, agent_call, booking_setup
- No catch-all "general" type -- every request maps to one of the 5 defined types
- domain_setup is a single type (not split into subtypes) -- JSONB payload differentiates subdomain vs connect vs agent help
- Status ENUM: 3 states only -- pending, in_progress, completed (no rejected state -- admin marks completed with a note if unfulfillable)
- admin_notes TEXT column for operator annotations (admin-only, not visible to client)
- SQL migration files stored in supabase/migrations/ directory (version controlled)
- Supabase Auth email provider enabled manually in Supabase dashboard (documented as prerequisite, not scripted)
- TypeScript types manually updated in types/database.ts (matching existing codebase pattern, no Supabase CLI gen)
- Two-client pattern: anon-key client for identity verification (auth.getUser()), admin client for data queries scoped by auth_user_id
- RLS enabled on client_requests only (new table) -- existing tables (claims, projects) untouched, use application-level filtering
- Dedicated lib/supabase/portal.ts file with createPortalClient() -- separate from existing server.ts and admin.ts

### Claude's Discretion
- Exact proxy.ts implementation (function signature, matcher syntax for Next.js 16)
- Cookie handling strategy (scoped vs global)
- Migration file naming convention
- RLS policy specifics on client_requests (SELECT/INSERT/UPDATE/DELETE granularity)
- Index selection on client_requests columns

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHEMA-01 | New client_requests table with RLS policies scoped to auth_user_id | SQL migration with 5-type ENUM, 3-status ENUM, JSONB content, RLS SELECT+INSERT policies using `auth.uid()`. Verified RLS syntax against Supabase docs. |
| SCHEMA-02 | claims.auth_user_id column (nullable UUID, FK to auth.users) | ALTER TABLE migration with nullable UUID column + index. Nullable because existing claims have no auth users and auth user is created AFTER payment. |
| SCHEMA-03 | projects.cal_embed_slug column (nullable TEXT) | Simple ALTER TABLE migration. Nullable TEXT column, no constraints needed. |
| AUTH-03 | proxy.ts protects /portal/* routes with Supabase session validation -- whitelist matcher to avoid breaking webhooks, admin, and public routes | Next.js 16 proxy.ts convention verified: export function named `proxy`, matcher config with whitelist. `@supabase/ssr` `createServerClient` with cookie bridge in proxy context. |
| AUTH-05 | claims table gains auth_user_id column linking to Supabase Auth user | Covered by SCHEMA-02 migration. FK to `auth.users(id)` in Supabase's auth schema. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.8.0 (existing) | Auth session management via cookie bridge | Already installed; provides `createServerClient` with `getAll`/`setAll` cookie pattern |
| `@supabase/supabase-js` | ^2.95.3 (existing) | Database client + Auth admin API | Already installed; `auth.admin.createUser()` for future phases, standard Supabase queries |
| `next` | 16.1.6 (existing) | `proxy.ts` file convention for request interception | Already installed; proxy.ts is the Next.js 16 successor to middleware.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^4.3.6 (existing) | Input validation for any new API routes | Already installed; use for validating proxy request params if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| proxy.ts whitelist matcher | Broad negative-lookahead matcher | Whitelist is safer -- new routes are unaffected by default; negative matcher requires updating exclusions for every new route |
| `getClaims()` in proxy | `getUser()` in proxy | `getClaims()` is faster (local JWT validation, no server round-trip) but Supabase docs still show `getUser()` in many examples. For this phase, use `getUser()` since it's the established pattern in the existing `server.ts` and the proxy only runs on portal routes (low volume). Can optimize to `getClaims()` later if needed. |
| Manual types in database.ts | `supabase gen types` CLI | Manual types match existing codebase pattern (no Supabase CLI gen in workflow). User locked this decision. |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Recommended Project Structure (New Files Only)
```
webgen/
  proxy.ts                              # NEW - Next.js 16 proxy (session refresh + portal protection)
  lib/supabase/
    proxy.ts                            # NEW - updateSession utility for proxy context
    portal.ts                           # NEW - createPortalClient() with anon key + cookies
    server.ts                           # EXISTING - cookie-aware server client (unchanged)
    admin.ts                            # EXISTING - service role client (unchanged)
    client.ts                           # EXISTING - browser client (unchanged)
  supabase/migrations/
    00000000000000_baseline.sql          # EXISTING
    20260319000001_add_generation_metrics.sql  # EXISTING
    20260320000001_add_design_language_column.sql  # EXISTING
    20260320000002_create_design_languages_table.sql  # EXISTING
    20260320000003_add_batch_assignee.sql  # EXISTING
    20260325000001_create_client_requests.sql  # NEW - client_requests table + RLS
    20260325000002_add_claims_auth_user_id.sql  # NEW - claims.auth_user_id column
    20260325000003_add_projects_cal_embed_slug.sql  # NEW - projects.cal_embed_slug column
  types/
    database.ts                         # MODIFIED - add client_requests types, update claims/projects
```

### Pattern 1: proxy.ts with Whitelist Matcher (Next.js 16)
**What:** The proxy file at project root intercepts requests matching the whitelist, refreshes Supabase auth cookies, and redirects unauthenticated users from portal routes to login.
**When to use:** Every request to `/portal/*` and `/auth/callback`.
**Key facts verified from official docs:**
- File: `proxy.ts` at project root (same level as `app/`)
- Export: named function `proxy` (not `middleware`)
- Config: `export const config = { matcher: [...] }`
- Runtime: Node.js by default (stable since Next.js 15.5) -- required for `@supabase/ssr`
- The proxy runs before routes are rendered
- Matcher patterns use path-to-regexp v1 syntax

**Example:**
```typescript
// proxy.ts (project root)
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/auth/callback',
  ],
}
```

### Pattern 2: updateSession Utility for Proxy Context
**What:** Creates a Supabase server client within the proxy context using request/response cookie bridge (not `cookies()` from `next/headers`), calls `getUser()` to refresh the session, and redirects unauthenticated portal requests.
**When to use:** Called by proxy.ts on every matched request.

**Example:**
```typescript
// lib/supabase/proxy.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs + verified gist pattern
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session -- getUser() validates with auth server
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated portal requests to login
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')
  const isLoginPage = request.nextUrl.pathname === '/portal/login'

  if (isPortalRoute && !isLoginPage && !user) {
    const loginUrl = new URL('/portal/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}
```

### Pattern 3: createPortalClient() -- Anon-Key Server Client for Portal
**What:** A cookie-aware server client using the anon key (not service role). Used in portal server components and API routes for identity verification via `auth.getUser()`. Data queries still use the admin client, scoped by `auth_user_id` in application code.
**When to use:** Any portal server component or API route that needs to verify the authenticated user.

**Example:**
```typescript
// lib/supabase/portal.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createPortalClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component -- ignore,
            // proxy handles session refresh
          }
        },
      },
    }
  )
}
```

### Pattern 4: Two-Client Data Access in Portal Routes
**What:** Portal API routes use `createPortalClient()` (anon key) to verify identity, then `createAdminClient()` (service role) for data queries scoped by `auth_user_id`. This is the locked decision from CONTEXT.md.
**Why:** RLS is only on `client_requests`. Existing tables have no RLS. Application-level filtering with the admin client is the pragmatic approach.

```typescript
// Example portal API route pattern
import { createPortalClient } from '@/lib/supabase/portal'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  // Step 1: Verify identity with anon-key client
  const portal = await createPortalClient()
  const { data: { user } } = await portal.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Query data with admin client, scoped by auth_user_id
  const admin = createAdminClient()
  const { data } = await admin
    .from('client_requests')
    .select('*')
    .eq('auth_user_id', user.id)

  return Response.json({ requests: data })
}
```

### Anti-Patterns to Avoid
- **Broad proxy matcher:** Never use `'/((?!_next/static|...).*)'` -- it would run on webhook, admin, and claim routes. Use a whitelist of portal routes only.
- **Importing `createAdminClient` in portal routes for identity checks:** The admin client bypasses RLS and has no session context. Always use `createPortalClient()` for `auth.getUser()`.
- **Using `getSession()` in server code:** Supabase docs explicitly warn against this. Use `getUser()` (validates with auth server) or `getClaims()` (local JWT validation).
- **Exporting function as `middleware` in proxy.ts:** Next.js 16 requires the export to be named `proxy`. A function named `middleware` in `proxy.ts` will silently do nothing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie refresh | Custom cookie parsing/JWT refresh logic | `@supabase/ssr` `createServerClient` with `getAll`/`setAll` | Handles token rotation, cookie chunking (tokens > 4KB get split), and expiry |
| Route protection in proxy | Manual JWT decoding/verification | `supabase.auth.getUser()` after creating server client in proxy | Contacts Supabase Auth server, handles edge cases (revoked tokens, expired refresh tokens) |
| RLS policies | Application-only auth checks on client_requests | Supabase RLS policies + application checks as defense-in-depth | RLS enforced at database level, catches bugs where application code forgets to filter |
| Auth callback handling | Custom token exchange endpoint | Supabase's built-in `/auth/callback` pattern via `exchangeCodeForSession` | Handles PKCE flow, magic links, password reset links correctly |
| Migration versioning | Ad-hoc SQL execution | Timestamped files in `supabase/migrations/` | Version controlled, reproducible, matches existing migration pattern |

**Key insight:** The existing `lib/supabase/server.ts` already implements the exact cookie bridge pattern (`getAll`/`setAll`) needed by `@supabase/ssr`. The proxy utility is a context adaptation of this same pattern -- not a new abstraction.

## Common Pitfalls

### Pitfall 1: Proxy Breaks Razorpay Webhook
**What goes wrong:** Adding proxy.ts with a broad matcher intercepts `/api/webhooks/razorpay`. The webhook handler reads `request.text()` on line 9 for HMAC verification. If the proxy touches the request body or adds response cookies, signature verification fails silently.
**Why it happens:** The default Supabase SSR guide shows a catch-all matcher. Copy-pasting it breaks the webhook.
**How to avoid:** Use the locked whitelist matcher: `['/portal/:path*', '/auth/callback']`. Nothing else.
**Warning signs:** Razorpay webhook returns 401 "Invalid signature" after adding proxy.ts. Test the webhook FIRST after adding the proxy.
**Verification step:** `curl -X POST http://localhost:3000/api/webhooks/razorpay` with a test payload should NOT trigger the proxy (check via console.log in proxy.ts).

### Pitfall 2: proxy.ts Exported as Wrong Function Name
**What goes wrong:** Exporting the function as `middleware` (the old convention) or `default` without naming it `proxy` causes the proxy to silently not execute.
**Why it happens:** Muscle memory from Next.js 14/15 middleware.ts convention. The Stack research (STACK.md) even shows `middleware.ts` examples -- this was written before the proxy.ts convention was verified.
**How to avoid:** The exported function MUST be named `proxy`. Both named export (`export function proxy()`) and default export (`export default function proxy()`) work. Verified from Next.js 16 official docs.
**Warning signs:** Portal routes load without auth redirect. No proxy logs appear.

### Pitfall 3: Cookie setAll Reassignment Pattern
**What goes wrong:** In the `updateSession` utility, the `response` variable must be reassigned inside `setAll` using `response = NextResponse.next({ request })`. If you forget this reassignment, cookies are set on the original response object but a new response is returned, losing the cookie updates.
**Why it happens:** The pattern is counterintuitive -- you're reassigning a variable inside a callback that was closed over.
**How to avoid:** Follow the exact pattern from the verified gist: create `let response`, and inside `setAll`, do `response = NextResponse.next({ request })` THEN set cookies on the new response.
**Warning signs:** Auth works on first login but sessions don't persist across page navigations.

### Pitfall 4: RLS Policy Missing `to authenticated` Clause
**What goes wrong:** Creating RLS policies without `to authenticated` means the policies apply to the `anon` role too. Since the portal client uses the anon key, this could theoretically work, but it also means unauthenticated requests (if they somehow bypass proxy) would be evaluated against the policy.
**Why it happens:** Forgetting the role specification in the policy.
**How to avoid:** Always include `to authenticated` in RLS policies. The service role client (admin) bypasses RLS automatically.
**Warning signs:** Unauthenticated requests return empty arrays instead of errors from client_requests.

### Pitfall 5: Foreign Key to auth.users Schema
**What goes wrong:** Referencing `auth.users(id)` in a foreign key requires the correct schema prefix. The `auth` schema is separate from `public` in Supabase.
**Why it happens:** Most tables reference other `public` schema tables. The `auth.users` table is in a different schema.
**How to avoid:** Use the full schema-qualified reference: `REFERENCES auth.users(id)`. Also note: the `auth_user_id` column on `claims` should NOT have a CASCADE delete -- if a Supabase Auth user is deleted, the claim record should remain for auditing.
**Warning signs:** Migration fails with "relation auth.users does not exist" if the Supabase project doesn't have Auth enabled.

## Code Examples

### Migration 1: client_requests Table with RLS
```sql
-- supabase/migrations/20260325000001_create_client_requests.sql
-- Source: CONTEXT.md locked decisions (5 types, 3 statuses, JSONB content)

-- Create the client_requests table
CREATE TABLE public.client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN (
    'logo_upload',
    'text_change',
    'domain_setup',
    'agent_call',
    'booking_setup'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_client_requests_claim_id ON public.client_requests(claim_id);
CREATE INDEX idx_client_requests_project_id ON public.client_requests(project_id);
CREATE INDEX idx_client_requests_auth_user_id ON public.client_requests(auth_user_id);
CREATE INDEX idx_client_requests_status ON public.client_requests(status);
CREATE INDEX idx_client_requests_created_at ON public.client_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

-- Clients can read their own requests
CREATE POLICY "clients_select_own" ON public.client_requests
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

-- Clients can insert their own requests
CREATE POLICY "clients_insert_own" ON public.client_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

-- No client UPDATE or DELETE policies (admin handles status changes via service role)

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_requests_updated_at
  BEFORE UPDATE ON public.client_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Migration 2: claims.auth_user_id Column
```sql
-- supabase/migrations/20260325000002_add_claims_auth_user_id.sql

ALTER TABLE public.claims
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_claims_auth_user_id ON public.claims(auth_user_id);
```

### Migration 3: projects.cal_embed_slug Column
```sql
-- supabase/migrations/20260325000003_add_projects_cal_embed_slug.sql

ALTER TABLE public.projects
  ADD COLUMN cal_embed_slug TEXT;
```

### TypeScript Types Addition (client_requests)
```typescript
// Addition to types/database.ts -- inside public.Tables
client_requests: {
  Row: {
    id: string
    claim_id: string
    project_id: string
    auth_user_id: string
    type: 'logo_upload' | 'text_change' | 'domain_setup' | 'agent_call' | 'booking_setup'
    status: 'pending' | 'in_progress' | 'completed'
    content: Json
    admin_notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    claim_id: string
    project_id: string
    auth_user_id: string
    type: 'logo_upload' | 'text_change' | 'domain_setup' | 'agent_call' | 'booking_setup'
    status?: 'pending' | 'in_progress' | 'completed'
    content?: Json
    admin_notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    claim_id?: string
    project_id?: string
    auth_user_id?: string
    type?: 'logo_upload' | 'text_change' | 'domain_setup' | 'agent_call' | 'booking_setup'
    status?: 'pending' | 'in_progress' | 'completed'
    content?: Json
    admin_notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "client_requests_claim_id_fkey"
      columns: ["claim_id"]
      isOneToOne: false
      referencedRelation: "claims"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "client_requests_project_id_fkey"
      columns: ["project_id"]
      isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
  ]
}
```

### TypeScript Types Updates (claims + projects)
```typescript
// claims.Row -- add:
auth_user_id: string | null

// claims.Insert -- add:
auth_user_id?: string | null

// claims.Update -- add:
auth_user_id?: string | null

// projects.Row -- add:
cal_embed_slug: string | null

// projects.Insert -- add:
cal_embed_slug?: string | null

// projects.Update -- add:
cal_embed_slug?: string | null
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16.0.0 (2025) | File and function must both use "proxy" name |
| Edge Runtime for middleware | Node.js runtime by default for proxy | Next.js 15.5 (stable) | `@supabase/ssr` works natively -- no Edge compatibility issues |
| `supabase.auth.getSession()` in server code | `supabase.auth.getUser()` or `getClaims()` | @supabase/ssr guidance update | `getSession()` doesn't validate tokens server-side; `getUser()` contacts auth server; `getClaims()` validates JWT locally |
| Deprecated `get`/`set`/`remove` cookie methods | `getAll`/`setAll` cookie bridge | @supabase/ssr 0.5+ | Old methods are deprecated; `getAll`/`setAll` is the current standard |

**Deprecated/outdated:**
- `middleware.ts`: Deprecated in Next.js 16, renamed to `proxy.ts`. A codemod exists: `npx @next/codemod@canary middleware-to-proxy .`
- `supabase.auth.getSession()` in server code: Supabase warns against this -- it doesn't revalidate the auth token
- Individual `get`/`set`/`remove` cookie methods in `@supabase/ssr`: Replaced by `getAll`/`setAll`

## Open Questions

1. **Cookie path scoping for Supabase auth cookies**
   - What we know: Supabase auth cookies (~4KB) will be sent on every request to the domain. The proxy matcher limits processing to portal routes, but cookies still travel with all requests.
   - What's unclear: Whether `@supabase/ssr@0.8.0` supports custom `path` in cookie options to scope cookies to `/portal` only. The `setAll` callback receives `options` per cookie -- unclear if setting `path: '/portal'` there works or if Supabase overrides it.
   - Recommendation: Accept the ~4KB cookie overhead on all requests for now. It's negligible for this traffic volume (low-volume internal tool). Optimize later if needed.

2. **`getClaims()` vs `getUser()` in proxy**
   - What we know: `getClaims()` is faster (local JWT validation, no server round-trip for asymmetric key projects). Supabase docs now recommend it for proxy/middleware. `getUser()` contacts the auth server every time.
   - What's unclear: Whether the project uses asymmetric or symmetric JWT signing. If symmetric, `getClaims()` also makes a server request, negating the performance benefit.
   - Recommendation: Use `getUser()` for Phase 11 -- it matches the established pattern and is safe. Portal traffic is low-volume. Optimize to `getClaims()` in a future pass if latency becomes a concern.

3. **`set_updated_at()` trigger function -- may already exist**
   - What we know: The migration creates a `set_updated_at()` function. The existing codebase may already have this function from a prior migration.
   - What's unclear: Whether a `set_updated_at()` or similar trigger function already exists in the Supabase project.
   - Recommendation: Use `CREATE OR REPLACE FUNCTION` to be idempotent. If the function already exists, it gets replaced with the same definition.

4. **Auth callback route handler**
   - What we know: The proxy matcher includes `/auth/callback` for handling Supabase auth email confirmations and password reset links. This route needs a server-side handler to exchange the auth code for a session.
   - What's unclear: Whether to implement the `/auth/callback` route handler in this phase or defer it to Phase 13 (Portal Shell) when login/password-reset is built.
   - Recommendation: Create a minimal `/auth/callback` route handler in this phase as a stub. It needs to exist so the proxy matcher doesn't 404. Full implementation in Phase 13.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 proxy.ts API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- Verified export function name `proxy`, matcher syntax, Node.js runtime default, migration from middleware.ts
- [Supabase Auth Server-Side Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Session refresh pattern, `getClaims()` recommendation, cookie bridge requirements
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS policy syntax with `auth.uid()`, `to authenticated` role targeting, `USING` vs `WITH CHECK`
- [Supabase getClaims() API Reference](https://supabase.com/docs/reference/javascript/auth-getclaims) -- Local JWT validation, performance vs getUser(), asymmetric vs symmetric key behavior
- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- getAll/setAll cookie pattern, framework-agnostic approach

### Secondary (MEDIUM confidence)
- [Supabase Auth Middleware Gist](https://gist.github.com/joshcoolman-smc/be4de3c3896fe8d4a0e5559c82f915fb) -- Complete updateSession implementation with cookie reassignment pattern, verified against official docs
- [GitHub Issue #39947: SSR auth guides use getUser instead of getClaims](https://github.com/supabase/supabase/issues/39947) -- Community discussion on getClaims vs getUser in middleware/proxy
- [GitHub Issue #40985: Clarify getClaims vs getUser](https://github.com/supabase/supabase/issues/40985) -- Supabase team clarification on when to use each method

### Tertiary (LOW confidence)
- Cookie path scoping in `@supabase/ssr@0.8.0` -- Not verified against source code; recommendation is to skip scoping for now

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions confirmed from package.json
- Architecture: HIGH -- proxy.ts convention verified against Next.js 16.1.6 official docs; updateSession pattern verified against Supabase gist and docs; existing server.ts already implements the cookie bridge
- Pitfalls: HIGH -- proxy matcher risk verified against current webhook handler (line 9 reads request.text()); function naming verified against Next.js 16 docs; cookie reassignment pattern verified from multiple sources
- Schema: HIGH -- migration SQL uses standard Postgres DDL; RLS policy syntax verified against Supabase docs; type ENUM values locked by user decisions

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- Supabase SSR and Next.js 16 proxy convention are settled APIs)

---
*Phase: 11-auth-infrastructure-schema*
*Research completed: 2026-03-25*
