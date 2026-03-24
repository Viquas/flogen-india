# Phase 13: Portal Shell - Research

**Researched:** 2026-03-25
**Domain:** Authenticated client portal shell -- login page, auth-guarded layout, navigation, dashboard with site preview
**Confidence:** HIGH

## Summary

Phase 13 builds the first client-facing authenticated experience: a login page at `/portal/login`, an auth-guarded layout wrapping all `/portal/*` routes, navigation with disabled future items, and a dashboard showing the client's site preview iframe, live URL with copy-to-clipboard, plan badge, and status indicator. All infrastructure required for this phase already exists -- `proxy.ts` with session refresh and portal redirect logic, `lib/supabase/proxy.ts` with the `updateSession` utility, `lib/supabase/server.ts` with the cookie-bridge server client, `app/auth/callback/route.ts` for PKCE code exchange, and the `confirmed-actions.ts` server actions for account creation and login. The `(portal)/` route group does NOT yet exist -- it needs to be created from scratch.

The portal must match the existing `(client)/` route group aesthetic: warm cream background `#f5f0ea`, Inter + Signifier fonts, rounded cards, dark text `#0F172A`. The client layout at `app/(client)/layout.tsx` already loads Inter and Signifier fonts with CSS variables `--font-inter` and `--font-signifier` -- the portal layout can duplicate this pattern (route groups provide layout isolation, so font imports must be repeated). The preview iframe pattern already exists in two places: `app/(client)/preview/[slug]/page.tsx` (uses `srcDoc` with `constructHtmlBoilerplate`) and `app/(admin)/editor/page.tsx` (uses `LivePreview` component). The portal dashboard will use the simpler `srcDoc` approach from the preview page, without the CTA bar injection.

**Primary recommendation:** Create a new `app/(portal)/portal/` route group with a server-component layout that validates auth via `getUser()`, fetches claim + project data, and passes them to a nav component and child pages. The login page lives at `app/(portal)/portal/login/page.tsx` and is excluded from the auth redirect in `proxy.ts` (already handled -- see line 35-41 of `lib/supabase/proxy.ts`). Use server actions for login and password reset, matching the existing `confirmed-actions.ts` pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Balanced split: preview takes ~50% of viewport on desktop, info cards alongside or below
- Mobile (375px): preview iframe on top (~40% height), info cards below -- scroll to see all
- URL card has both copy-to-clipboard icon AND a "Visit Site" button (new tab)
- Plan badge shows Standard or Pro with visual differentiation
- Same warm cream background (#f5f0ea) and Inter + Signifier fonts as claim pages -- consistent client experience
- Matches the existing (client)/ route group aesthetic
- Split login layout: left side = Flogen logo + 2-3 feature highlights (preview site, request changes, manage domain); right side = email/password form
- Stacks on mobile (brand section collapses or moves above form)
- No "Don't have an account?" signup link -- accounts only created via purchase flow
- Forgot password link present, using Supabase Auth built-in reset
- Full nav built now with ALL items: Dashboard, Domain, Customize, Support -- Phase 14 features show as disabled/"coming soon"
- Business name prominently displayed in header: "Welcome, [Business Name]" or similar personalization
- Logout button hidden in a profile/settings dropdown -- not prominently displayed
- Status refreshes on page load only -- no real-time Supabase subscription
- Status derived from claim + client_requests state

### Claude's Discretion
- Nav style (top header vs bottom tabs) -- optimize for mobile-first business owners
- Status set (3 or 4 states) and their labels/colors
- Password reset page structure (inline mode on login page vs separate route)
- Exact mobile breakpoint behavior for split login layout
- How "coming soon" nav items appear (grayed out, badge, tooltip)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-02 | Confirmation page presents password field for first-time portal access -- creates account linked to claim and project | ALREADY IMPLEMENTED in Phase 12. `confirmed/account-setup.tsx` and `confirmed/confirmed-actions.ts` handle account creation + auto-login. This phase builds on it -- the portal login page is the complementary returning-user flow. |
| AUTH-04 | Portal login page with email + password for returning clients | Login page at `/portal/login` with split layout. Server action using `signInWithPassword` via SSR cookie bridge -- pattern already proven in `confirmed-actions.ts:loginExistingAccount()`. Password reset via `resetPasswordForEmail`. |
| PORTAL-01 | Authenticated portal dashboard at /portal with full-width iframe preview of client's live site | Dashboard page using `constructHtmlBoilerplate()` + `srcDoc` iframe pattern from `preview/[slug]/page.tsx`. Auth guard in layout via `getUser()`. Preview shows generated site without CTA bar. |
| PORTAL-02 | Live site URL display (subdomain or custom domain) with copy-to-clipboard button | URL card with `navigator.clipboard.writeText()` + success toast (sonner). Also "Visit Site" button opening preview URL in new tab. URL derived from project slug -- subdomain provisioning is Phase 14, so display the preview URL for now. |
| PORTAL-03 | Plan badge and site status indicator (Active, Customization Pending, Update in Progress) | Plan badge from `claim.plan` (Standard/Pro). Status derived from claim status + client_requests pending count. Refreshed on page load only (server component). |
| PORTAL-06 | Mobile-responsive portal layout (works at 375px, mobile-first) | All portal layouts designed mobile-first. Preview iframe at ~40% height on mobile with cards below. Login form stacks vertically. Nav uses bottom tab bar for mobile. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | 0.8.0 (existing) | Server-side auth client with cookie bridge | Already installed, used in proxy.ts and confirmed-actions.ts |
| `@supabase/supabase-js` | 2.95.3 (existing) | Admin client for data queries scoped by auth_user_id | Already installed, used throughout codebase |
| `next` | 16.1.6 (existing) | App router, server components, server actions, proxy.ts | Already installed, proxy.ts already configured |
| `react` | 19.2.3 (existing) | UI rendering | Already installed |
| `tailwindcss` | 4.x (existing) | Styling | Already installed, used throughout |
| `lucide-react` | existing | Icons | Already installed, used in claim pages and dashboard |
| `sonner` | 2.0.7 (existing) | Toast notifications | Already installed in admin layout, will use for clipboard copy feedback |
| `zod` | 4.3.6 (existing) | Input validation for server actions | Already installed, used in claim-actions.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/font/google` | built-in | Inter font loading | Portal layout needs same fonts as client layout |
| `next/font/local` | built-in | Signifier font loading | Portal layout needs same serif font |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bottom tab nav | Top header nav | Bottom tabs are more natural for mobile-first business owners (thumb-reachable). Top header is standard desktop pattern. Recommend bottom tabs on mobile, horizontal header on desktop. |
| Separate /portal/reset route | Inline reset state on login page | Separate route is cleaner for deep-linking from reset emails. Supabase `resetPasswordForEmail` redirects to a URL -- a separate `/portal/reset` route handles this cleanly. |
| Server actions for login | API route POST /api/auth/login | Server actions are simpler (no separate route file), already proven in `confirmed-actions.ts`. No reason to change pattern. |

**Installation:**
```bash
# No new packages needed. Everything is already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
app/(portal)/
  portal/
    layout.tsx           # Auth guard layout: getUser() + claim/project fetch + nav wrapper
    page.tsx             # Dashboard: iframe preview + info cards + status
    login/
      page.tsx           # Split login page (public, excluded from auth redirect)
      login-actions.ts   # Server actions: login, resetPassword
    reset/
      page.tsx           # Password reset page (handle token from email)
      reset-actions.ts   # Server action: updatePassword
components/portal/
  portal-nav.tsx         # Navigation bar (responsive: bottom tabs mobile, header desktop)
  portal-header.tsx      # Business name header + profile dropdown with logout
  site-preview.tsx       # Iframe preview wrapper with loading state
  url-card.tsx           # Live URL display with copy + visit buttons
  plan-badge.tsx         # Standard/Pro badge component
  status-indicator.tsx   # Status dot + label component
  nav-item.tsx           # Individual nav item (active, disabled, coming-soon states)
```

### Pattern 1: Auth-Guarded Layout with Data Fetching
**What:** The portal layout is a server component that validates auth and fetches claim + project data on every page navigation. Data flows down to children via props or a shared context.
**When to use:** Every portal page needs the same user identity and claim/project context.
**Example:**
```typescript
// app/(portal)/portal/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalNav } from '@/components/portal/portal-nav'
import { PortalHeader } from '@/components/portal/portal-header'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: proxy.ts handles redirect, but layout double-checks
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal/login')
  }

  // Fetch claim + project with admin client (scoped by auth_user_id)
  const admin = createAdminClient()
  const { data: claim } = await admin
    .from('claims')
    .select('id, project_id, plan, status, client_name, client_email')
    .eq('auth_user_id', user.id)
    .in('status', ['paid', 'customizing', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!claim) {
    redirect('/portal/login') // No valid claim found
  }

  const { data: project } = await admin
    .from('projects')
    .select('id, business_data, generated_code, slug, version')
    .eq('id', claim.project_id)
    .single()

  const businessData = project?.business_data as Record<string, unknown>
  const businessName = (businessData?.businessName as string) || 'Your Business'

  // Count pending requests for status derivation
  const { count: pendingRequests } = await admin
    .from('client_requests')
    .select('id', { count: 'exact', head: true })
    .eq('auth_user_id', user.id)
    .eq('status', 'pending')

  return (
    <div className={`${inter.variable} ${signifier.variable} min-h-screen bg-[#f5f0ea] font-[family-name:var(--font-inter)]`}>
      <PortalHeader businessName={businessName} userEmail={user.email || ''} />
      <PortalNav currentPlan={claim.plan} />
      <main className="pb-20 md:pb-0"> {/* Bottom padding for mobile tab bar */}
        {children}
      </main>
    </div>
  )
}
```

### Pattern 2: Server Action Login with Cookie Bridge
**What:** Login server action creates SSR client with cookie bridge and calls `signInWithPassword`.
**When to use:** Portal login form submission.
**Example:**
```typescript
// app/(portal)/portal/login/login-actions.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginWithPassword(input: {
  email: string
  password: string
}): Promise<{ success: false; error: string } | never> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    return { success: false, error: 'Invalid email or password' }
  }

  redirect('/portal')
}
```

### Pattern 3: Iframe Preview with srcDoc
**What:** Render the client's generated site in an iframe using `srcDoc` with preprocessed HTML.
**When to use:** Portal dashboard site preview.
**Example:**
```typescript
// Reuse existing pattern from preview/[slug]/page.tsx
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'

// In server component:
const html = constructHtmlBoilerplate(project.generated_code)

// In JSX:
<iframe
  srcDoc={html}
  className="w-full rounded-xl border border-gray-200"
  style={{ height: '50vh' }} // ~50% viewport on desktop
  sandbox="allow-scripts allow-same-origin"
  title={`Website preview for ${businessName}`}
/>
```

### Pattern 4: Password Reset via Supabase Built-in
**What:** Forgot password sends reset email via `resetPasswordForEmail()`. Reset link redirects to `/portal/reset` where user sets new password via `updateUser()`.
**When to use:** Login page "Forgot password?" link.
**Example:**
```typescript
// Send reset email (server action)
export async function sendPasswordReset(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/portal/reset`,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Handle reset (on /portal/reset page, after auth callback sets session)
export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { success: false, error: error.message }
  redirect('/portal')
}
```

### Anti-Patterns to Avoid
- **Importing `createAdminClient` in client components:** Admin client uses service role key. Never expose in browser. All data queries go through server components or server actions.
- **Using `getSession()` for auth checks:** Always use `getUser()` which validates with Supabase's auth server. `getSession()` only checks local JWT without server validation.
- **Putting portal pages directly under `(portal)/` without the `portal/` subdirectory:** This creates URL conflicts with `(admin)/dashboard`. The `portal/` directory inside the route group creates the `/portal` URL prefix.
- **Adding real-time subscriptions for status:** CONTEXT.md explicitly says "Status refreshes on page load only." No Supabase subscriptions needed.
- **Sharing layout between (client) and (portal):** They have different auth requirements. Duplicate the font imports -- trivial cost, clean separation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session refresh on navigation | Custom token refresh logic | `proxy.ts` + `updateSession()` (already built) | Handles cookie refresh, redirect for unauthenticated users, already tested in Phase 11 |
| Password reset flow | Custom email-sending + token generation | `supabase.auth.resetPasswordForEmail()` + `updateUser()` | Built-in email templates, token expiry, PKCE flow handled by Supabase |
| Login with cookie-based sessions | Custom JWT + cookie management | `signInWithPassword()` via `createServerClient` with cookie bridge | Proven pattern from `confirmed-actions.ts`, handles httpOnly cookies correctly |
| Copy-to-clipboard feedback | Custom tooltip/notification | `sonner` toast (already installed in project) | Consistent with admin dashboard notifications |
| HTML boilerplate for preview iframe | Custom HTML wrapper | `constructHtmlBoilerplate()` from `lib/utils/html-boilerplate.ts` | Already handles Tailwind CDN, React standalone, Babel transpilation for generated code |

**Key insight:** Every piece of infrastructure this phase needs already exists. The auth flow (proxy.ts, server client, admin client, auth callback), the preview rendering (constructHtmlBoilerplate, srcDoc iframe), the UI patterns (Inter/Signifier fonts, warm cream bg, rounded cards), and the data model (claims with auth_user_id, projects with generated_code) are all in place. This phase is purely assembly and UI -- no new infrastructure.

## Common Pitfalls

### Pitfall 1: Login Page Gets Redirect-Looped by proxy.ts
**What goes wrong:** If the login page is inside the portal layout (which checks auth), unauthenticated users get redirected to login, which redirects to login, infinitely.
**Why it happens:** The proxy.ts matcher applies to all `/portal/*` routes.
**How to avoid:** The proxy.ts already handles this correctly (lines 35-41 of `lib/supabase/proxy.ts`): it checks `isLoginPage` and skips the redirect. However, the login page must NOT use the auth-guarded portal layout. Either: (a) put login under a separate layout that doesn't check auth, or (b) use a `login/layout.tsx` that overrides the parent layout. Simplest approach: the portal `layout.tsx` checks `pathname` and skips auth for `/portal/login` and `/portal/reset`, OR the login page uses its own non-auth layout. Recommended: keep the login page under `(portal)/portal/login/` but have the layout conditionally skip auth for login routes. Alternatively, move login to a separate route group.
**Warning signs:** Infinite redirect loop or blank page on `/portal/login`.

### Pitfall 2: Layout Auth Check Blocks Login Page Rendering
**What goes wrong:** The `layout.tsx` calls `getUser()` and redirects if no user. This happens for ALL child routes including `/portal/login`.
**Why it happens:** Next.js layouts wrap all children, including the login page.
**How to avoid:** Use a conditional in layout -- or better, restructure so login has its own layout:
```
app/(portal)/portal/
  (auth)/                    # Sub-group for auth pages (no auth check)
    login/page.tsx
    reset/page.tsx
    layout.tsx               # Minimal layout: fonts + background, no auth guard
  (dashboard)/               # Sub-group for authenticated pages
    layout.tsx               # Auth guard + nav + data fetching
    page.tsx                 # Dashboard
    domain/page.tsx
    ...
```
This pattern uses nested route groups to separate public portal pages (login, reset) from authenticated portal pages (dashboard, domain, etc.).

### Pitfall 3: Preview Iframe Inherits Portal Styles
**What goes wrong:** The iframe content inherits CSS from the portal page, causing style conflicts.
**Why it happens:** When using `src` attribute, this doesn't happen (separate document). With `srcDoc`, the iframe creates a new document context that is isolated.
**How to avoid:** `srcDoc` creates an isolated document -- no style leakage. The `constructHtmlBoilerplate` function wraps the generated code in a complete HTML document with its own Tailwind CDN. This is safe. But ensure the iframe has `sandbox="allow-scripts allow-same-origin"` for Tailwind and React to work.

### Pitfall 4: Signifier Font Files Missing or Wrong Path
**What goes wrong:** The Signifier font fails to load in the portal layout with 404 errors.
**Why it happens:** The `localFont` `src` paths in the client layout are relative: `../../public/fonts/Signifier-Light.otf`. The portal layout has a different file depth.
**How to avoid:** Use paths relative to the layout file's location. The portal layout at `app/(portal)/portal/layout.tsx` would need `../../../public/fonts/Signifier-Light.otf` (3 levels up to reach project root). Alternatively, since Next.js resolves font paths from the file location, count directory levels carefully.

### Pitfall 5: Claim Not Found for New Users
**What goes wrong:** A user created via the confirmation flow visits `/portal` but the layout query returns no claim because `auth_user_id` hasn't been backfilled yet.
**Why it happens:** Race condition between account creation and claim linkage.
**How to avoid:** The `confirmed-actions.ts` already backfills `auth_user_id` on the claim (line 82-84) before redirecting to portal. Verified: `createAccountAndLogin` updates `claim.auth_user_id` BEFORE returning success. If the backfill fails silently, add error handling. Also handle the edge case where a user has auth but no claim -- redirect to a "contact support" page instead of login (to avoid login loop).

### Pitfall 6: Logout Doesn't Clear Session Properly
**What goes wrong:** User clicks logout but remains authenticated, or gets stuck in a state where proxy.ts still sees a valid session.
**Why it happens:** `signOut()` must be called on a server client with the cookie bridge to clear httpOnly cookies.
**How to avoid:** Logout via server action that calls `supabase.auth.signOut()` on the SSR client (same pattern as login), then redirect to `/portal/login`.

## Code Examples

### Logout Server Action
```typescript
// app/(portal)/portal/logout-action.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/portal/login')
}
```

### Copy to Clipboard with Toast
```typescript
// components/portal/url-card.tsx
'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'

interface UrlCardProps {
  url: string
  previewUrl: string
}

export function UrlCard({ url, previewUrl }: UrlCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('URL copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">Your website</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#0F172A] truncate flex-1">{url}</span>
        <button onClick={handleCopy} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Copy URL">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1 px-3 py-1.5 bg-[#050304] text-white text-xs font-medium rounded-lg hover:bg-[#1a1a1a] transition-colors">
          Visit Site <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
```

### Plan Badge Component
```typescript
// components/portal/plan-badge.tsx
interface PlanBadgeProps {
  plan: 'standard' | 'pro'
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#AF92FF]/10 text-[#7C5AE2]">
        Pro
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      Standard
    </span>
  )
}
```

### Status Derivation Logic
```typescript
// lib/portal/status.ts
type SiteStatus = 'active' | 'customization_pending' | 'update_in_progress'

interface StatusInput {
  claimStatus: string
  pendingRequestCount: number
  inProgressRequestCount: number
}

export function deriveSiteStatus(input: StatusInput): {
  status: SiteStatus
  label: string
  color: string // Tailwind color class
} {
  if (input.inProgressRequestCount > 0) {
    return { status: 'update_in_progress', label: 'Update in Progress', color: 'text-amber-600 bg-amber-50' }
  }
  if (input.pendingRequestCount > 0) {
    return { status: 'customization_pending', label: 'Customization Pending', color: 'text-blue-600 bg-blue-50' }
  }
  return { status: 'active', label: 'Active', color: 'text-green-600 bg-green-50' }
}
```

### Navigation with Disabled Items
```typescript
// components/portal/portal-nav.tsx -- mobile bottom tab bar pattern
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Globe, Palette, HeadphonesIcon } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/portal', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { href: '/portal/domain', label: 'Domain', icon: Globe, enabled: false },
  { href: '/portal/customize', label: 'Customize', icon: Palette, enabled: false },
  { href: '/portal/support', label: 'Support', icon: HeadphonesIcon, enabled: false },
]

export function PortalNav({ currentPlan }: { currentPlan: string }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:static md:border-t-0 md:border-b md:border-gray-200">
      <div className="flex items-center justify-around md:justify-start md:gap-1 md:max-w-4xl md:mx-auto md:px-4 py-1 md:py-0">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (!item.enabled) {
            return (
              <div key={item.href} className="flex flex-col items-center gap-0.5 px-3 py-2 opacity-40 cursor-not-allowed relative">
                <Icon className="w-5 h-5" />
                <span className="text-[10px] md:text-xs">{item.label}</span>
                <span className="absolute -top-1 right-0 text-[8px] bg-gray-200 text-gray-500 px-1 rounded-full hidden md:inline">Soon</span>
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors md:flex-row md:gap-2 md:py-3 md:border-b-2 ${
                isActive ? 'text-[#0F172A] md:border-[#0F172A]' : 'text-gray-400 hover:text-gray-600 md:border-transparent'
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

## Discretion Recommendations

### Nav Style: Bottom Tabs (Mobile) + Horizontal Header (Desktop)
**Recommendation:** Use a fixed bottom tab bar on mobile (< 768px) that transitions to a horizontal nav bar below the header on desktop. Business owners access the portal via phone (WhatsApp/email links). Bottom tabs are thumb-reachable on mobile -- the dominant mobile navigation pattern. On desktop, the nav moves to a standard horizontal header bar.
**Confidence:** HIGH -- mobile-first requirement from CONTEXT.md. Bottom tabs are the universal mobile nav pattern (iOS tab bar, Google Material bottom nav).

### Status Set: 3 States
**Recommendation:** Three states are sufficient for the claim lifecycle:
1. **Active** (green dot) -- site is live, no pending changes
2. **Customization Pending** (blue dot) -- client has submitted requests that haven't been started
3. **Update in Progress** (amber dot) -- admin is actively working on requests

A fourth state ("Under Review") adds confusion without utility -- the business owner doesn't distinguish between "admin hasn't looked at it" and "admin is reviewing." Keep it simple.
**Confidence:** HIGH -- covers the complete lifecycle without ambiguity.

### Password Reset: Separate /portal/reset Route
**Recommendation:** Use a separate `/portal/reset` page rather than inline state on the login page. Reason: Supabase `resetPasswordForEmail` sends an email with a link that goes through `/auth/callback` and redirects to a URL. The callback already exists and redirects to `next` parameter. A dedicated reset page handles the "enter new password" form cleanly without polluting login state.
**Confidence:** HIGH -- this matches the Supabase PKCE flow and the existing `/auth/callback` route handler.

### Coming Soon Items: Grayed Out + "Soon" Badge on Desktop
**Recommendation:** Disabled nav items are grayed out (40% opacity) with `cursor-not-allowed`. On desktop where there's more space, show a small "Soon" badge. On mobile bottom tabs, the gray opacity is sufficient -- no tooltip (tooltips don't work on touch). Clicking a disabled item does nothing (no navigation, no toast). This sets expectations without being annoying.
**Confidence:** MEDIUM -- reasonable UX pattern, but real user feedback may suggest different approach.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `middleware()` export | `proxy.ts` with `proxy()` export | Next.js 16 (Feb 2026) | Already migrated in Phase 11. No action needed. |
| `getSession()` for auth checks | `getUser()` for auth checks | Supabase SSR best practice | getUser() validates with auth server, getSession() only checks local JWT. Already using getUser() in proxy.ts. |
| Custom form handling | Server actions with `'use server'` | React 19 / Next.js 14+ | Already the standard pattern in this codebase. |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Project already uses `@supabase/ssr`.
- `middleware.ts`: Renamed to `proxy.ts` in Next.js 16. Already migrated.

## Open Questions

1. **Preview URL before subdomain provisioning**
   - What we know: DOMAIN-01 (free subdomain auto-provisioned on payment) is Phase 14. In Phase 13, there is no live subdomain URL.
   - What's unclear: What URL to display in the URL card. Options: (a) the Flogen preview URL `/preview/{slug}`, (b) a placeholder "Subdomain coming soon", (c) construct the expected subdomain URL even though DNS isn't set up yet.
   - Recommendation: Display the full preview URL (`{SITE_URL}/preview/{slug}`) with "Preview URL" label. Add a note "Custom domain available in settings" below. This gives clients a working link to share immediately, and the domain setup in Phase 14 upgrades this card.

2. **Multiple claims per user**
   - What we know: A user could theoretically have multiple paid claims (multiple sites). The layout query uses `limit(1)` ordered by `created_at DESC`.
   - What's unclear: Whether to support multi-site in the portal shell.
   - Recommendation: Show the most recent paid claim only. Multi-site support is explicitly deferred to v4.0 (ADV-04). If it becomes an issue, the query is easy to extend later.

3. **Sonner Toaster placement in portal layout**
   - What we know: The admin layout has `<Toaster position="bottom-right" />`. The portal needs it too for clipboard copy feedback.
   - What's unclear: Whether to put Toaster in the root layout (shared) or portal layout.
   - Recommendation: Add `<Toaster />` to the portal layout. Don't modify root layout to avoid side effects on admin/client routes.

## Sources

### Primary (HIGH confidence)
- Codebase: `proxy.ts` -- existing Next.js 16 proxy with Supabase session refresh and portal redirect
- Codebase: `lib/supabase/proxy.ts` -- updateSession utility with login page exclusion logic
- Codebase: `lib/supabase/server.ts` -- cookie-bridge server client for server components
- Codebase: `confirmed-actions.ts` -- proven signInWithPassword + cookie bridge pattern
- Codebase: `app/auth/callback/route.ts` -- PKCE code exchange handler, redirects to `/portal` by default
- Codebase: `app/(client)/layout.tsx` -- Inter + Signifier font loading, warm cream bg pattern
- Codebase: `app/(client)/preview/[slug]/page.tsx` -- srcDoc iframe preview pattern
- Codebase: `lib/utils/html-boilerplate.ts` -- constructHtmlBoilerplate for preview rendering
- Codebase: `types/database.ts` -- claims.auth_user_id, client_requests table, project.generated_code
- [Supabase Auth Server-Side Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- updateSession pattern, server component auth
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) -- signInWithPassword, resetPasswordForEmail
- [Supabase resetPasswordForEmail reference](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) -- redirect URL, PKCE flow
- [Next.js 16 proxy.ts convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- file naming, export, matcher config

### Secondary (MEDIUM confidence)
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- middleware to proxy rename
- [Supabase SSR creating a client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- cookie bridge pattern

### Tertiary (LOW confidence)
- None -- all findings are verified against codebase or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new packages, all patterns already proven in codebase
- Architecture: HIGH -- route group pattern documented in ARCHITECTURE.md and verified against Next.js 16 docs. Portal route structure follows same pattern as existing (admin)/ and (client)/ groups.
- Pitfalls: HIGH -- all pitfalls identified from codebase analysis and existing patterns. The auth redirect loop pitfall is the most critical and has a clear structural solution.
- Code examples: HIGH -- all examples adapted from existing codebase patterns (confirmed-actions.ts for login, preview page for iframe, export-button for clipboard)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable patterns, no fast-moving dependencies)
