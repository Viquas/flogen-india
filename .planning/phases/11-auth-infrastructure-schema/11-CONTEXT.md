# Phase 11: Auth Infrastructure & Schema - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure infrastructure: proxy.ts session middleware, Supabase Auth client utilities, DB migrations for client_requests table and new columns on claims/projects. No user-facing features — this is the foundation that all subsequent v3.0 phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Auth Redirect Behavior
- Unauthenticated /portal/* requests redirect to /portal/login
- After successful login, always redirect to /portal (no redirect-back logic — portal is single-page, no deep links)
- Login page includes "forgot password" / password reset flow from day one (Supabase built-in)
- proxy.ts handles /auth/callback route for Supabase auth email confirmations and password reset links
- proxy.ts whitelist matcher: only /portal/:path* and /auth/callback — nothing else touches auth middleware

### Request Type Categories
- 5 types in the ENUM: logo_upload, text_change, domain_setup, agent_call, booking_setup
- No catch-all "general" type — every request maps to one of the 5 defined types
- domain_setup is a single type (not split into subtypes) — JSONB payload differentiates subdomain vs connect vs agent help
- Status ENUM: 3 states only — pending, in_progress, completed (no rejected state — admin marks completed with a note if unfulfillable)
- admin_notes TEXT column for operator annotations (admin-only, not visible to client)

### Migration Approach
- SQL migration files stored in supabase/migrations/ directory (version controlled)
- Supabase Auth email provider enabled manually in Supabase dashboard (documented as prerequisite, not scripted)
- TypeScript types manually updated in types/database.ts (matching existing codebase pattern, no Supabase CLI gen)

### Portal Client Separation
- Two-client pattern: anon-key client for identity verification (auth.getUser()), admin client for data queries scoped by auth_user_id
- RLS enabled on client_requests only (new table) — existing tables (claims, projects) untouched, use application-level filtering
- Dedicated lib/supabase/portal.ts file with createPortalClient() — separate from existing server.ts and admin.ts

### Claude's Discretion
- Exact proxy.ts implementation (function signature, matcher syntax for Next.js 16)
- Cookie handling strategy (scoped vs global)
- Migration file naming convention
- RLS policy specifics on client_requests (SELECT/INSERT/UPDATE/DELETE granularity)
- Index selection on client_requests columns

</decisions>

<specifics>
## Specific Ideas

- Portal is a single-page dashboard — no sub-routes worth redirecting to, so post-login always goes to /portal
- JSONB payload in client_requests handles all request-type-specific data (no extra columns per type)
- Admin notes column is admin-only — client never sees operator annotations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-auth-infrastructure-schema*
*Context gathered: 2026-03-25*
