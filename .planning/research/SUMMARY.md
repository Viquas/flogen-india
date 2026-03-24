# Project Research Summary

**Project:** Flogen v3.0 — Client Portal & Updated Funnel
**Domain:** AI website generator with payment-first funnel, authenticated client portal, and admin fulfillment workflow
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

v3.0 transforms Flogen from a one-shot claim-to-site pipeline into a persistent client relationship platform. The core architectural shift is payment-first: Razorpay collects contact info during checkout (eliminating all pre-payment forms), then a Supabase Auth account is created server-side in the webhook handler after payment is confirmed. Clients access an authenticated portal to preview their site, manage domains, upload logos, and submit change requests — replacing the old `/customize` flow with a persistent queue that feeds an admin fulfillment dashboard. The entire new capability surface is achievable with zero new npm packages by extending existing dependencies (`@supabase/supabase-js`, `@supabase/ssr`, `@ai-sdk/google`, and Node.js built-ins).

The recommended implementation order follows a strict dependency chain: auth infrastructure must land first (proxy.ts + session middleware, DB schema), then the payment-first claim flow update (which depends on auth for post-payment account creation), then the portal shell (depends on auth), then portal features (domain, logo, requests), and finally admin fulfillment (depends on `client_requests` table being populated). This order is non-negotiable — attempting to build the portal before auth infrastructure is wired up produces throwaway code.

The two dominant risk areas are auth integration and webhook reliability. Adding auth middleware to an app that currently has none touches every HTTP route — the matcher must be a whitelist targeting `/portal/*` only, or it will break the Razorpay webhook (body consumed by middleware), the admin dashboard (unnecessary auth overhead), and public claim pages. Simultaneously, the payment-first flow removes the pre-payment contact-collection buffer that currently masks a webhook race condition on the confirmation page — dual verification (webhook push + Razorpay API pull) is required before removing pre-payment forms.

## Key Findings

### Recommended Stack

No new npm packages are needed for v3.0. All five new capabilities are covered by existing dependencies plus Node.js built-ins. Supabase Auth is already bundled in `@supabase/supabase-js` and `@supabase/ssr`. Domain availability checking uses `fetch()` against the Domainr/RapidAPI endpoint (free tier: 10,000 calls/month). DNS verification uses `node:dns` with Google DNS-over-HTTPS as a more reliable alternative to the OS resolver. Logo background removal uses the existing `@ai-sdk/google` provider with `gemini-3.1-flash-image-preview`, with a green screen + server-side pixel processing fallback. Cal.com booking embeds via CDN script (the npm package has a React 19 peer dep conflict, already documented in PROJECT.md).

The critical new infrastructure file is `proxy.ts` at the project root — Next.js 16 renamed `middleware.ts` to `proxy.ts`. This handles Supabase session cookie refresh and portal route protection. Two new utility files are also required: `lib/supabase/proxy.ts` (updateSession function) and `lib/supabase/portal.ts` (anon-key server client for portal data access, distinct from the service-role admin client). The existing `lib/supabase/server.ts` already implements the `getAll`/`setAll` cookie bridge pattern — the proxy utility adapts this for the proxy context where `cookies()` from `next/headers` is not available.

**Core technologies:**
- `@supabase/ssr` v0.8.0 (existing): Auth session management via cookie bridge — already present in `lib/supabase/server.ts`, needs proxy adaptation
- `@supabase/supabase-js` v2.95.3 (existing): `auth.admin.createUser()` for server-side account creation post-payment
- `@ai-sdk/google` v3.0.30 (existing): Gemini image editing for logo background removal via green screen approach
- `node:dns` (built-in): DNS TXT/CNAME/A record verification for domain connection workflow
- Domainr via RapidAPI (`fetch`, no npm package): Domain availability search — deprecated but functional, free tier sufficient; monitor for shutdown

**New env variables required:**
- `RAPIDAPI_KEY` — Domainr domain availability API
- `RAZORPAY_TEST_KEY_ID`, `RAZORPAY_TEST_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID`, `RAZORPAY_MODE` — test/live key switching
- `REMOVEBG_API_KEY` — conditional fallback only if Gemini bg removal proves unreliable in testing

### Expected Features

**Must have (table stakes):**
- Payment-first funnel: remove all pre-payment forms and domain selection; USD-only pricing; single click from plan card to Razorpay checkout
- Razorpay test/live mode toggle via environment variable
- Server-side account creation in webhook handler using `auth.admin.createUser({ email_confirm: true })`
- Magic link or password-based first login to portal (no email verification required — they proved identity by paying)
- Authenticated client portal dashboard: site preview iframe, live URL display, plan info
- Change request form: single textarea + optional file upload, feeds `client_requests` table
- Request history with status badges (pending, in-progress, completed)
- Logo upload with AI background removal (before/after approval flow, client must approve before use)
- Free subdomain auto-provisioned on payment (`{slug}.flogen.site`)
- Custom domain connection via DNS TXT verification with step-by-step copy-paste instructions
- Domain availability search (Domainr API) with external registrar links
- Admin: purchased clients list with pending request count and plan/status filters
- Admin: client detail view with request queue and status transitions
- Admin: redeploy button (save code + bump version + create revision + mark request complete)
- Cal.com booking setup field (Pro plan only, CDN embed)

**Should have (competitive differentiators):**
- Dual payment verification (webhook push + Razorpay API pull) on confirmation page to eliminate race condition
- Supabase real-time subscription in portal to update site preview automatically when admin redeploys
- DNS polling via Google/Cloudflare DoH API (not OS resolver) with multi-resolver confirmation before marking verified
- Optimistic concurrency control on project updates (version column, conflict detection on redeploy)
- $49 agent support upsell payment flow in portal
- Version query param on preview URLs for cache busting after redeploy

**Defer to v4.0:**
- WhatsApp magic link delivery
- Registrar-specific DNS instructions with deep links (requires WHOIS lookup integration)
- Site health monitoring and uptime status page
- Email notifications on request completion (Instantly AI integration)
- Batch redeploy across multiple sites
- Manual logo crop and reposition tool
- Multi-logo support (horizontal, square, icon variants)

### Architecture Approach

v3.0 adds a third route group `(portal)/` alongside the existing `(admin)/` and `(client)/` groups. Portal routes live at `/portal/*` URLs (the route group provides layout isolation without creating a URL segment, and the `portal/` directory inside it creates the real URL prefix — avoiding the `/dashboard` conflict with admin routes). A new `proxy.ts` at the project root handles Supabase session refresh and redirects unauthenticated requests from `/portal/*` to the login page, with a whitelist matcher targeting only `/portal/:path*` and `/auth/callback`. Data access in portal routes follows a two-client pattern: the cookie-aware anon-key client (`createPortalClient()`) for identity verification, then the service-role admin client for data queries scoped by `auth_user_id` in application code. RLS is enabled only on the new `client_requests` table — not on the 12 existing tables where adding RLS would be a high-risk migration.

**Major components:**
1. `proxy.ts` + `lib/supabase/proxy.ts` — session refresh and portal route protection; whitelist matcher is mandatory to avoid breaking webhooks
2. `(portal)/portal/layout.tsx` — auth-guarded layout with server-side `getUser()` as defense-in-depth, fetches claim data for nav context
3. `client_requests` table — central FIFO queue linking portal submissions to admin fulfillment; JSONB `content` field handles all request types (text_change, logo_upload, domain_connect, domain_subdomain, booking_setup, agent_support, general)
4. `app/(portal)/portal/` pages — dashboard, domain, requests, logo, booking, support
5. `app/(admin)/dashboard/clients/` pages — purchased clients list, client detail, request queue with status management
6. `api/portal/*` routes — auth-validated API routes using dual-client pattern (anon-key for identity, service-role for data)
7. Webhook handler update — account creation moves here (guaranteed email availability) rather than the confirmation page

**Database schema additions:**
- `client_requests` table (new): `id, claim_id, project_id, auth_user_id, type, status, content JSONB, admin_notes, created_at, updated_at` + 5 indexes on claim_id, project_id, status, auth_user_id, created_at
- `claims.auth_user_id` column (new, nullable): links claim to Supabase Auth user, set by webhook handler
- `projects.cal_embed_slug` column (new): Cal.com booking slug for Pro plan
- `projects.version` integer column (recommended): optimistic concurrency for redeploy conflict detection

### Critical Pitfalls

1. **Auth middleware breaks Razorpay webhook and admin routes** — The middleware matcher defaults to all routes. The Razorpay webhook uses `request.text()` for HMAC verification, which fails if middleware has already touched the body or added response cookies. Use a whitelist matcher: `'/portal/:path*'` and `'/auth/callback'` only. Immediately after adding proxy.ts, test webhook returns 200, admin dashboard loads, and claim pages load without auth redirects.

2. **Webhook race condition breaks the confirmation page** — Razorpay's `handler` callback fires client-side before the webhook arrives (60+ seconds in test mode). In v3.0, removing pre-payment forms eliminates the buffer that currently masks this. Add a `/api/claims/[id]/verify` endpoint that checks the DB first, then falls back to Razorpay's `orders.fetch()` API directly. The confirmation page uses this dual verification instead of polling alone.

3. **Auth account creation on the confirmation page creates orphan accounts** — The confirmation page loads before the webhook fires, so `client_email` is NULL when account creation is attempted. Move account creation entirely into the webhook handler (guaranteed email availability). Handle duplicate emails by looking up existing users before calling `createUser`. Use `email_confirm: true` — clients proved identity by paying, requiring email verification is friction with no benefit.

4. **Admin client imported in portal routes exposes all client data** — Every existing server component uses `createAdminClient()` (service role, bypasses RLS). Portal routes must use a dedicated `createPortalClient()` with the anon key, and all data queries must be scoped by `auth_user_id`. Add a warning comment in `lib/supabase/admin.ts` flagging that portal routes must not import it.

5. **Gemini does not produce transparent PNGs** — This is a documented fundamental limitation confirmed as of March 2026, not a bug or version issue. Use the green screen approach: prompt Gemini to place the logo on `#00FF00` background, then replace green pixels with alpha via server-side processing. For logos with green elements, detect dominant colors first and use magenta (`#FF00FF`) instead. If quality remains unacceptable in testing, pivot to remove.bg API (~$0.20/image, reliable, no npm package needed).

## Implications for Roadmap

The dependency graph from FEATURES.md and the build order from ARCHITECTURE.md converge on the same five-phase sequence. The ordering is driven by hard technical dependencies, not arbitrary preference.

### Phase 1: Auth Infrastructure and Schema
**Rationale:** Every subsequent phase depends on auth cookies working and the DB schema existing. This phase has no user-visible output — it is pure foundation. Do not start Phase 2 until proxy.ts is verified working correctly on all three route types (webhook, admin, public claim page, portal route).
**Delivers:** proxy.ts with whitelist matcher, `lib/supabase/proxy.ts` updateSession utility, `lib/supabase/portal.ts` anon-key client, DB migration for `client_requests` table + `claims.auth_user_id` + `projects.cal_embed_slug` + `projects.version`, TypeScript types updated, RLS policy on `client_requests`.
**Avoids:** Pitfall 1 (middleware breaks routes), Pitfall 8 (admin client in portal), Pitfall 5 (cookie bloat — scope or accept overhead early)
**Research flag:** Standard patterns. Supabase SSR is well-documented. Follow the official `@supabase/ssr` Next.js guide. No phase research needed.

### Phase 2: Payment-First Claim Flow
**Rationale:** Depends on Phase 1 for account creation server action. Hardens the webhook BEFORE simplifying the claim page — this sequence is critical. Removing pre-payment forms with a fragile webhook is a production incident waiting to happen.
**Delivers:** Webhook hardened with dual verification endpoint + comprehensive error logging, simplified claim page (no domain section, no pre-payment forms), USD-only pricing, Razorpay test/live key switching, server-side account creation in webhook handler, `confirmed/` page updated with portal login link.
**Avoids:** Pitfall 2 (webhook race condition), Pitfall 3 (orphan accounts), Pitfall 9 (webhook failure loses contact info), Pitfall 12 (test/live key mismatch)
**Research flag:** Standard patterns. Razorpay webhook and Supabase admin API are both well-documented. The dual verification pattern is known. No phase research needed.

### Phase 3: Portal Shell
**Rationale:** Depends on Phase 1 (auth) and Phase 2 (user accounts exist to test with). The shell with auth-guarded layout must exist before any portal feature pages can be added. This phase delivers the minimum viable portal — enough to prove the auth flow end-to-end.
**Delivers:** `(portal)/portal/` route group with auth-guarded layout, portal dashboard (site preview iframe, live URL card, plan badge), portal navigation, login page with password input and magic link fallback.
**Avoids:** Pitfall 10 (session expiry — middleware handles page navigations automatically; add client-side refresh interval in Phase 4 if needed)
**Research flag:** Standard patterns. Next.js route groups and Supabase SSR server components. No phase research needed.

### Phase 4: Portal Features
**Rationale:** Depends on Phase 3 (portal shell). Individual features within this phase are largely independent and can be sequenced or parallelized. Build logo background removal first within this phase — it is the highest technical risk and needs early validation to determine whether to use the Gemini green screen approach or pivot to remove.bg.
**Delivers:** Change request form + `/api/portal/requests` CRUD API, logo upload with Gemini green-screen bg removal + before/after approval flow, domain management (subdomain auto, DNS TXT verification via DoH API, Domainr availability search), Cal.com booking setup (Pro only), $49 agent support payment.
**Avoids:** Pitfall 6 (DNS false negatives — use DoH API not OS resolver), Pitfall 7 (Gemini transparent PNG — use green screen), Pitfall 11 (logo edge cases — adaptive screen color for green-heavy logos)
**Research flag:** Logo background removal requires early prototyping. Test Gemini green screen approach on a range of real business logo types before committing to the approval UI. If quality is unacceptable, pivot to remove.bg as primary path (no npm package needed, simple REST call). Domain DNS verification requires testing with real domains at a registrar — propagation behavior cannot be fully validated in local dev.

### Phase 5: Admin Fulfillment
**Rationale:** Depends on Phase 4 — the admin queue only has value once `client_requests` are being populated by real portal usage. Building it last also ensures the data model is stable and all request types are defined.
**Delivers:** "Clients" tab in admin sidebar, purchased clients list with filters (status, plan, date), client detail view (request queue, site preview, actions), request status transitions (pending → in_progress → completed → rejected with admin notes), redeploy button (code save + version bump + revision record + request completion), version query param on preview URLs for cache busting.
**Avoids:** Pitfall 4 (redeploy version conflicts — optimistic locking with `projects.version` column added in Phase 1), Pitfall 13 (stale preview cache — version param + `revalidatePath`)
**Research flag:** Standard patterns. Extends existing admin dashboard and Monaco editor. Redeploy concurrency control is straightforward SQL optimistic locking. No phase research needed.

### Phase Ordering Rationale

- Auth infrastructure cannot be deferred — no portal routes function without it; wrong middleware config breaks existing production flows
- Webhook hardening precedes claim simplification — removing pre-payment forms with a fragile webhook is a revenue risk
- Portal shell before portal features — prevents building auth-dependent feature code on an untested auth foundation
- Admin fulfillment last — it is a consumer of the `client_requests` queue, which is empty until portal features ship
- Logo background removal is the highest technical risk within Phase 4 — prototype it first, have remove.bg as a validated fallback before building the approval UI

### Research Flags

Phases needing deeper research or validation during implementation:
- **Phase 4 (Logo background removal):** Gemini transparent PNG limitation is confirmed, but green screen quality on real business logos (varied complexity, colors, formats, scanned originals) is unknown until tested. Prototype before building approval UI. If unacceptable, add remove.bg as primary path.
- **Phase 4 (DNS verification UX):** Technical implementation is clear (DoH polling), but UX copy for non-technical business owners managing DNS at their registrar requires real-domain testing. Instructions must be tested against GoDaddy/Namecheap flows before finalizing copy.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Supabase SSR auth is covered by official Next.js guides with code examples
- **Phase 2:** Razorpay webhook handling and dual verification are well-understood
- **Phase 3:** Next.js route groups and server component auth checks are standard
- **Phase 5:** Extends existing admin dashboard patterns; no novel infrastructure

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new packages confirmed. All capabilities verified against existing installed versions. One MEDIUM exception: Domainr API is deprecated but functional via RapidAPI; monitor for shutdown. |
| Features | HIGH | Feature scope verified against Supabase Auth docs, Razorpay webhook docs, Gemini API docs. Dependency ordering confirmed by architecture analysis. |
| Architecture | HIGH | Route group pattern, dual-client data access, and RLS strategy all verified. Next.js 16 proxy.ts convention confirmed (verify exact export name against 16.1.6 before implementing). |
| Pitfalls | HIGH | All top pitfalls (middleware scope, webhook race, Gemini transparency, data leakage) are verified against the current codebase and confirmed by external sources. Phase warnings include detection and mitigation for each. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gemini background removal quality on real business logos:** Cannot validate until a prototype is built and tested against actual client logo types (scanned business cards, photographed logos, logos with green elements). Plan to prototype early in Phase 4 and have remove.bg ready as a drop-in fallback.
- **Domainr API stability:** API is deprecated (Fastly acquisition, 2023). Free tier still works as of March 2026 but has no SLA. If it shuts down, fallback is WhoisXML API ($100/yr) or DNS-based availability checks. Monitor RapidAPI status.
- **Next.js 16 `proxy.ts` convention:** ARCHITECTURE.md notes the rename from `middleware.ts` to `proxy.ts` in Next.js 16. Verify the exact export name (`proxy` vs `middleware`) against the installed version (next@16.1.6) before implementing — a wrong export name means the proxy silently does nothing.
- **Supabase `@supabase/ssr` v0.8.0 cookie path scoping:** PITFALLS.md recommends scoping auth cookies to `/portal` path to avoid sending 4KB tokens on every request. Verify that `@supabase/ssr@0.8.0` supports custom `path` in cookie options before relying on this optimization. Accepting the overhead on all requests is the safe fallback.
- **RLS coverage on existing tables:** Current approach enables RLS only on `client_requests` and uses application-level `auth_user_id` filtering for all other tables. This is pragmatic but not defense-in-depth. If portal ever needs direct client-side Supabase queries (not via API routes), RLS on `claims` and `projects` will be required.

## Sources

### Primary (HIGH confidence)
- [Supabase Auth Server-Side Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` updateSession pattern, server component auth
- [Supabase auth.admin.createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) — server-side account creation, email_confirm flag, user_metadata
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy syntax, service role bypass behavior
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) — signInWithPassword, auto-confirm configuration
- [Next.js 16 proxy.ts convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — file location, matcher config, Node.js runtime
- [Razorpay Webhook Best Practices + Payload docs](https://razorpay.com/docs/webhooks/) — email/contact fields, retry behavior, HMAC verification
- [Node.js DNS module docs](https://nodejs.org/api/dns.html) — `dns.promises.resolveTxt/resolveCname/resolve4`, Resolver class
- [Cal.com embed docs](https://cal.com/embed) — CDN script pattern, namespace config, UI customization
- [Gemini Image Generation API docs](https://ai.google.dev/gemini-api/docs/image-generation) — `generateText` with `responseModalities: ['IMAGE']`, model selection

### Secondary (MEDIUM confidence)
- [Domainr API docs (deprecated, via RapidAPI)](https://domainr.com/docs/api) — `/v2/status` and `/v2/search` endpoints, free tier: 10,000/month
- [Gemini transparent background forum threads](https://discuss.ai.google.dev/t/transparency-issue-in-image-generation-ui-gemini-2-0-flash-experimental-api/74170) — alpha channel limitation confirmed March 2026
- [Gemini background removal green screen technique](https://medium.com/google-cloud/background-removal-on-the-fly-with-gemini-and-code-execution-48621565fa9f) — production-validated workaround
- [DNS propagation delays documentation](https://domaindetails.com/kb/troubleshooting/dns-propagation-slow) — 5min to 48hr range, registrar batch behavior
- [DNS TXT vs CNAME verification for SaaS](https://www.namesilo.com/blog/en/dns/custom-domains-in-saas-txt-vs-cname-verification-and-when-to-use-each) — TXT preferred for non-destructive verification

### Tertiary (LOW confidence — informational only)
- Payment-first SaaS signup flow UX research — conversion impact of pre-payment forms
- Design agency client portal feature expectations — change request UX patterns
- remove.bg API pricing — fallback cost estimate (~$0.20/image at current plans)

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
