---
phase: 13-portal-shell
verified: 2026-03-25T00:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Log in at /portal/login with valid credentials"
    expected: "Form submits, session cookie set, browser redirects to /portal dashboard"
    why_human: "SSR cookie bridge flow requires live Supabase session — cannot verify redirect chain programmatically"
  - test: "Visit /portal unauthenticated"
    expected: "Immediately redirected to /portal/login"
    why_human: "Middleware redirect chain requires running Next.js server with real request"
  - test: "Use 'Forgot password?' flow"
    expected: "Sends Supabase reset email; /portal/reset form accepts new password and redirects to /portal"
    why_human: "Requires live Supabase email delivery and PKCE callback round-trip"
  - test: "Copy URL button on dashboard"
    expected: "navigator.clipboard.writeText called, sonner toast 'URL copied to clipboard' appears"
    why_human: "Clipboard API and toast notification require browser environment"
  - test: "Mobile at 375px"
    expected: "Login page shows form only (brand panel hidden), dashboard shows preview on top with bottom tab bar"
    why_human: "Responsive layout requires visual browser verification"
---

# Phase 13: Portal Shell Verification Report

**Phase Goal:** Paying clients can log in to an authenticated portal at /portal and see their site preview, live URL, and plan details — the minimum viable portal proves the auth flow end-to-end

**Verified:** 2026-03-25T00:00:00Z
**Status:** passed
**Re-verification:** No — initial verification
**Note on AUTH-02:** Confirmed shipped in Phase 12 (confirmed-actions.ts + account-setup.tsx). Not re-verified here. Remaining 5 requirements (AUTH-04, PORTAL-01 through PORTAL-03, PORTAL-06) fully verified below.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Returning clients can log in at /portal/login with email and password and are redirected to /portal | VERIFIED | `login-actions.ts`: `signInWithPassword` via SSR cookie bridge, `redirect('/portal')` on success |
| 2 | Logged-in users visiting /portal/login are redirected to /portal (no double-login) | VERIFIED | `proxy.ts` line 45: `if (request.nextUrl.pathname === '/portal/login' && user) { redirect('/portal') }` |
| 3 | Forgot password link sends a Supabase password reset email | VERIFIED | `login-actions.ts`: `sendPasswordReset` calls `resetPasswordForEmail` with `redirectTo: .../auth/callback?next=/portal/reset` |
| 4 | Password reset link from email lands on /portal/reset where user sets a new password | VERIFIED | `reset-actions.ts`: `updatePassword` via `createClient().auth.updateUser({ password })`, then `redirect('/portal')` |
| 5 | /portal/login and /portal/reset render without auth redirect loops | VERIFIED | `proxy.ts` line 35: `isPublicPortalPage = ['/portal/login', '/portal/reset'].includes(pathname)` — both excluded from auth redirect |
| 6 | Authenticated client sees iframe preview of generated site at /portal | VERIFIED | `page.tsx`: `constructHtmlBoilerplate(project.generated_code)` → `DashboardClient` → `SitePreview` renders `<iframe srcDoc={html}>` |
| 7 | Client sees live URL with copy-to-clipboard and Visit Site button | VERIFIED | `url-card.tsx`: `navigator.clipboard.writeText(url)` + sonner toast + `<a href={previewUrl} target="_blank">` |
| 8 | Client sees plan badge (Standard/Pro) and status indicator (3 states) | VERIFIED | `plan-badge.tsx`: Standard (gray) / Pro (purple). `status.ts`: `deriveSiteStatus` returns Active/Customization Pending/Update in Progress with Tailwind color classes. Both rendered in `dashboard-client.tsx` |
| 9 | Unauthenticated users are redirected to /portal/login; portal is mobile-responsive | VERIFIED | `layout.tsx` (dashboard): `getUser()` + `redirect('/portal/login')`. `portal-nav.tsx`: fixed bottom tabs on mobile / horizontal bar on desktop. `SitePreview`: `h-[40vh] md:h-[50vh]`. `DashboardClient`: `grid-cols-1 md:grid-cols-[1fr_340px]` |

**Score:** 9/9 truths verified

---

## Required Artifacts

| Artifact | Expected | Lines | Status | Notes |
|----------|----------|-------|--------|-------|
| `app/(portal)/portal/(auth)/layout.tsx` | Non-auth layout with fonts | 32 | VERIFIED | Inter + Signifier loaded, no auth check |
| `app/(portal)/portal/(auth)/login/page.tsx` | Split-layout login page | 79 | VERIFIED | Brand panel left, LoginForm right, mobile-only logo |
| `app/(portal)/portal/(auth)/login/login-form.tsx` | Login/reset form client component | 219 | VERIFIED | login + reset modes, show/hide password, loading states, server action calls |
| `app/(portal)/portal/(auth)/login/login-actions.ts` | loginWithPassword + sendPasswordReset | 109 | VERIFIED | Both actions with SSR cookie bridge, Zod validation, security-safe error messages |
| `app/(portal)/portal/(auth)/reset/page.tsx` | Centered reset page | 38 | VERIFIED | Logo, heading, ResetForm, back-to-login link |
| `app/(portal)/portal/(auth)/reset/reset-form.tsx` | Reset form with confirm | 110 | VERIFIED | Password + confirm fields, client-side match validation, calls updatePassword |
| `app/(portal)/portal/(auth)/reset/reset-actions.ts` | updatePassword server action | 33 | VERIFIED | Zod validation, createClient session, updateUser, redirect('/portal') |
| `lib/supabase/proxy.ts` | isPublicPortalPage pattern | 51 | VERIFIED | Array `['/portal/login', '/portal/reset']` excludes both from auth redirect |
| `app/(portal)/portal/(dashboard)/layout.tsx` | Auth-guarded layout with data fetching | 68 | VERIFIED | getUser(), createAdminClient queries for claim/project, PortalHeader + PortalNav rendered |
| `app/(portal)/portal/(dashboard)/page.tsx` | Dashboard server component | 80 | VERIFIED | Fetches claim, project, request counts; derives status; passes all to DashboardClient |
| `app/(portal)/portal/(dashboard)/dashboard-client.tsx` | Responsive grid client component | 61 | VERIFIED | SitePreview + UrlCard + PlanBadge + StatusIndicator, 2-col desktop / 1-col mobile |
| `app/(portal)/portal/logout-action.ts` | signOut + redirect server action | 10 | VERIFIED | `supabase.auth.signOut()` then `redirect('/portal/login')` |
| `components/portal/portal-nav.tsx` | Responsive nav bottom/top | 65 | VERIFIED | Fixed bottom tabs mobile, horizontal bar desktop, 3 disabled items with "Soon" badge |
| `components/portal/portal-header.tsx` | Welcome header with logout dropdown | 64 | VERIFIED | "Welcome, {businessName}", avatar dropdown, `<form action={logout}>` |
| `components/portal/site-preview.tsx` | Iframe srcDoc wrapper | 27 | VERIFIED | `srcDoc={html}`, sandbox, loading skeleton, `h-[40vh] md:h-[50vh]` |
| `components/portal/url-card.tsx` | URL copy + visit | 52 | VERIFIED | `navigator.clipboard.writeText`, Check icon, sonner toast, Visit Site link |
| `components/portal/plan-badge.tsx` | Standard/Pro badge | 21 | VERIFIED | Pro: purple; Standard: gray; both rounded-full |
| `components/portal/status-indicator.tsx` | Status dot + label | 14 | VERIFIED | Uses StatusResult colors, dot + label pill |
| `lib/portal/status.ts` | deriveSiteStatus utility | 42 | VERIFIED | Exports `deriveSiteStatus`, correct logic for all 3 states with Tailwind color classes |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|-----|-----|--------|---------|
| `login-form.tsx` | `login-actions.ts` | `loginWithPassword`, `sendPasswordReset` imports | WIRED | Line 5: `import { loginWithPassword, sendPasswordReset } from './login-actions'`; called in `handleLogin` and `handleReset` |
| `login-actions.ts` | `lib/supabase/server.ts` (indirect: createServerClient) | `signInWithPassword` | WIRED | Direct `createServerClient` with cookie bridge; `supabase.auth.signInWithPassword(...)` line 51 |
| `reset-actions.ts` | `lib/supabase/server.ts` | `updateUser.*password` | WIRED | `createClient()` from `@/lib/supabase/server`; `supabase.auth.updateUser({ password })` line 24 |
| `proxy.ts` | `/portal/login` AND `/portal/reset` | `isPublicPortalPage` array | WIRED | Line 35: `const isPublicPortalPage = ['/portal/login', '/portal/reset'].includes(...)` |
| `layout.tsx` (dashboard) | `lib/supabase/server.ts` | `getUser()` auth guard | WIRED | `createClient()` + `supabase.auth.getUser()` + `redirect('/portal/login')` on no user |
| `layout.tsx` (dashboard) | `lib/supabase/admin.ts` | `createAdminClient` for claim/project queries | WIRED | `createAdminClient()` for claims and projects queries |
| `page.tsx` (dashboard) | `lib/utils/html-boilerplate.ts` | `constructHtmlBoilerplate` for iframe srcDoc | WIRED | `import { constructHtmlBoilerplate }` line 5; called line 46 with `project.generated_code` |
| `url-card.tsx` | `navigator.clipboard` | copy-to-clipboard with sonner toast | WIRED | `navigator.clipboard.writeText(url)` line 16; `toast.success('URL copied to clipboard')` line 18 |
| `portal-header.tsx` | `logout-action.ts` | logout server action in profile dropdown | WIRED | `import { logout } from '@/app/(portal)/portal/logout-action'`; `<form action={logout}>` line 50 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|-------------|-------------|--------|---------|
| AUTH-02 | Phase 12 (pre-shipped) | Confirmation page password field creates account linked to claim | SATISFIED (pre-shipped) | Shipped in Phase 12; assigned to Phase 13 in ROADMAP but confirmed complete |
| AUTH-04 | 13-01-PLAN.md | Portal login page with email + password for returning clients | SATISFIED | `/portal/login` renders split layout with working SSR cookie bridge login; REQUIREMENTS.md shows `[x]` |
| PORTAL-01 | 13-02-PLAN.md | Authenticated portal at /portal with full-width iframe preview | SATISFIED | `SitePreview` renders `<iframe srcDoc={constructHtmlBoilerplate(generated_code)}>` in auth-guarded layout |
| PORTAL-02 | 13-02-PLAN.md | Live site URL display with copy-to-clipboard button | SATISFIED | `UrlCard` shows URL, clipboard copy button, Visit Site link to `/preview/{project.id}` |
| PORTAL-03 | 13-02-PLAN.md | Plan badge and site status indicator (3 states) | SATISFIED | `PlanBadge` (Standard/Pro) + `StatusIndicator` (Active/Customization Pending/Update in Progress) rendered in dashboard |
| PORTAL-06 | 13-02-PLAN.md | Mobile-responsive portal layout at 375px | SATISFIED | Bottom tab nav on mobile, single-column preview grid, `h-[40vh]` on mobile, login brand panel hidden on mobile |

---

## Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `dashboard-client.tsx` line 54-57 | "More features coming soon" quick links card | Info | Intentional per plan spec — placeholder for Phase 14 links. Does not block any Phase 13 requirement. |
| `login-form.tsx`, `reset-form.tsx` | `placeholder=` attributes on inputs | Info | HTML form placeholders, not stub implementations. False positive from grep. |

No blocker or warning anti-patterns found.

---

## Human Verification Required

### 1. End-to-end Login Flow

**Test:** Navigate to `/portal/login`, enter valid client credentials, submit
**Expected:** Redirect to `/portal` dashboard; client's business name in header; iframe preview loads
**Why human:** SSR cookie bridge sets `sb-*` cookies that require a live Supabase Auth server; redirect chain cannot be exercised with static file checks

### 2. Unauthenticated Portal Access

**Test:** Clear cookies, visit `/portal`
**Expected:** Immediate redirect to `/portal/login` via middleware
**Why human:** Next.js middleware execution requires a running server processing real HTTP requests

### 3. Password Reset Round-Trip

**Test:** Click "Forgot password?", enter email, submit; click link in received email; enter new password on `/portal/reset`
**Expected:** Supabase sends email; PKCE code exchanged at `/auth/callback`; `/portal/reset` accepts new password; redirects to `/portal`
**Why human:** Requires live Supabase email delivery and callback code exchange

### 4. Copy URL Button

**Test:** On dashboard, click the copy button next to the preview URL
**Expected:** Clipboard receives the URL; sonner toast "URL copied to clipboard" appears for ~2s
**Why human:** `navigator.clipboard.writeText` and sonner toast require a browser environment with clipboard permissions

### 5. Mobile Layout at 375px

**Test:** Open `/portal/login` and `/portal` at 375px viewport width
**Expected:** Login: form only visible, brand panel hidden, Flogen logo above form. Dashboard: preview stacked on top at 40vh, cards below, bottom tab bar fixed at screen bottom
**Why human:** Responsive breakpoint rendering requires visual browser verification

---

## Gaps Summary

No gaps found. All 9 observable truths verified, all 19 artifacts pass all three levels (exists, substantive, wired), all 9 key links confirmed wired, all 5 phase requirements (AUTH-04, PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-06) satisfied.

TypeScript errors found during compilation are pre-existing in unrelated files (`app/(admin)/editor/page.tsx`, `app/(client)/claim/` — Phase 13 portal files are clean.

All four documented commits (8caaf1a, 223bd58, e62adec, 32ce3fa) verified in git log.

---

_Verified: 2026-03-25T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
