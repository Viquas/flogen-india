---
phase: 14-portal-features
verified: 2026-03-25T01:10:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 14: Portal Features Verification Report

**Phase Goal:** Clients can manage their domain, upload a logo with AI background removal, submit change requests, set up booking (Pro), and pay for agent support -- all from the portal
**Verified:** 2026-03-25T01:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Client can submit a change request via textarea with optional file attachments | VERIFIED | `customize-client.tsx` POSTs FormData to `/api/portal/requests`; API validates, uploads files, inserts into `client_requests` |
| 2 | Client can attach up to 3 files (PNG/JPG/WebP/PDF, 5MB each) to a request | VERIFIED | `route.ts` enforces MAX_FILES=3, MAX_FILE_SIZE=5MB, magic-byte validates PNG/JPG/WebP/PDF |
| 3 | After submit, new request appears at top of history with pending badge | VERIFIED | `customize-client.tsx` prepends returned request object optimistically; `RequestCard` renders `pending` badge with blue styling |
| 4 | Request history shows expandable cards with type, date, status | VERIFIED | `request-card.tsx` (153 lines): toggles via `useState`, shows TYPE_LABELS, STATUS_STYLES, `getRelativeTime`, file previews on expand |
| 5 | LOGO-04 fulfilled by existing `cal_embed_slug` column -- no client-facing booking UI | VERIFIED | Column exists in `supabase/migrations/20260325000003_add_projects_cal_embed_slug.sql` and `types/database.ts`; no portal UI present |
| 6 | Client sees free subdomain ({slug}.flogen.com) and can activate it | VERIFIED | `domain-client.tsx` view=subdomain calls POST `/api/portal/domain/subdomain`; route updates `claims.domain_option='subdomain'` and `domain_value` |
| 7 | Client can connect an existing domain with registrar-aware DNS TXT instructions | VERIFIED | `domain-client.tsx` view=connect shows 6 registrar instruction sets; POST `/api/portal/domain/verify` calls `verifyTxtRecord` via Google DoH; updates claim on success |
| 8 | Domain search queries Domainr and shows availability with registrar links | VERIFIED | `domain-client.tsx` debounces (500ms) to GET `/api/portal/domain/search`; `domain-search.ts` wraps Domainr RapidAPI |
| 9 | AI generates alternatives when domain is unavailable; second round if <3 available | VERIFIED | `suggest/route.ts` calls `generateDomainSuggestions` (Gemini), batch-checks with `batchCheckAvailability`, second round at line 93 when `available.length < 3` |
| 10 | Client can upload a logo via drag-and-drop (PNG/JPEG, 5MB max) | VERIFIED | `logo-upload.tsx` (413 lines): drag/drop + file input, validates type+size, POSTs to `/api/portal/logo/upload` |
| 11 | Gemini Vision detects non-transparent backgrounds; client sees before/after preview; can approve or revert | VERIFIED | `logo-bg-removal.ts` runs Gemini green-screen + sharp pixel replacement; `logo-upload.tsx` states: idle→uploading→uploaded→removing→preview→saving→saved; preview shows side-by-side with checkerboard |
| 12 | Transparent PNGs skip bg removal; Gemini failure auto-creates agent_call request | VERIFIED | Upload route returns `hasAlpha` via `pngHasAlpha()`; component auto-saves if `hasAlpha=true`; `remove-bg/route.ts` inserts `type:'agent_call'` on failure with exact message "Background removal failed. Our agents will do this manually." |
| 13 | Client can pay $49 for agent support; webhook creates agent_call/domain_setup request; floating help button on all pages | VERIFIED | `support-client.tsx` POSTs to `/api/portal/payments/agent`, opens Razorpay modal; `razorpay/route.ts` early-returns at line 152 on `notes.type=agent_support|domain_setup`, calls `handleAgentPayment`; `need-help-button.tsx` hidden on `/portal/support` via `usePathname()`, rendered in `layout.tsx` |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Lines | Min Required | Status | Notes |
|----------|-------|--------------|--------|-------|
| `app/api/portal/requests/route.ts` | 230 | — | VERIFIED | GET + POST, magic-byte validation, Supabase storage upload, auth-scoped |
| `app/(portal)/portal/(dashboard)/customize/page.tsx` | 70 | 20 | VERIFIED | Server component with auth guard, fetches claim+requests+logo |
| `app/(portal)/portal/(dashboard)/customize/customize-client.tsx` | 295 | 80 | VERIFIED | Form, drag-drop, optimistic history, LogoUpload integrated |
| `components/portal/request-card.tsx` | 153 | 40 | VERIFIED | Expandable cards, status badges, file previews |
| `components/portal/portal-nav.tsx` | 65 | — | VERIFIED | All 4 nav items `enabled: true` |
| `app/(portal)/portal/(dashboard)/domain/page.tsx` | 54 | 20 | VERIFIED | Server component, auth guard, fetches claim+business data |
| `app/(portal)/portal/(dashboard)/domain/domain-client.tsx` | 812 | 200 | VERIFIED | 4-view state machine: grid/subdomain/connect/buy |
| `lib/portal/dns-verify.ts` | 58 | — | VERIFIED | exports `verifyTxtRecord`, `generateVerificationToken` |
| `lib/portal/domain-search.ts` | 92 | — | VERIFIED | exports `checkDomainAvailability`, `searchDomains`, `getRegistrarLink` |
| `lib/portal/domain-suggest.ts` | 42 | — | VERIFIED | exports `generateDomainSuggestions` via Gemini |
| `app/api/portal/domain/subdomain/route.ts` | 93 | — | VERIFIED | POST, Zod validation, updates claims.domain_option+domain_value |
| `app/api/portal/domain/verify/route.ts` | 97 | — | VERIFIED | POST, imports dns-verify, updates claim on success, maxDuration=15 |
| `app/api/portal/domain/search/route.ts` | 41 | — | VERIFIED | GET, auth check, calls checkDomainAvailability |
| `app/api/portal/domain/suggest/route.ts` | 121 | — | VERIFIED | POST, first+second round logic, batchCheckAvailability, maxDuration=30 |
| `lib/portal/png-utils.ts` | 37 | — | VERIFIED | exports `pngHasAlpha`, byte-25 IHDR color type check |
| `lib/portal/logo-bg-removal.ts` | 119 | — | VERIFIED | exports `removeLogoBackground`, Gemini green-screen + sharp pixel replacement |
| `app/api/portal/logo/upload/route.ts` | 136 | — | VERIFIED | POST, magic bytes PNG/JPEG, pngHasAlpha detection, Supabase storage, maxDuration=30 |
| `app/api/portal/logo/remove-bg/route.ts` | 108 | — | VERIFIED | POST, imports logo-bg-removal, auto-creates agent_call on failure, maxDuration=60 |
| `components/portal/logo-upload.tsx` | 413 | 100 | VERIFIED | Full 7-state machine, drag-drop, before/after preview, inline $49 CTA |
| `app/api/portal/payments/agent/route.ts` | 83 | — | VERIFIED | POST, Zod enum agent_support/domain_setup, Razorpay order creation with notes |
| `app/api/webhooks/razorpay/route.ts` | 233 | — | VERIFIED | handlePaymentCaptured early-returns for agent payments; handleAgentPayment inserts client_request |
| `components/portal/need-help-button.tsx` | 28 | 15 | VERIFIED | usePathname hides on /portal/support; navigates to /portal/support on click |
| `app/(portal)/portal/(dashboard)/layout.tsx` | 70 | — | VERIFIED | imports NeedHelpButton, renders after `<main>` |
| `app/(portal)/portal/(dashboard)/support/page.tsx` | 43 | 15 | VERIFIED | Server component, auth guard, passes claim+Razorpay key |
| `app/(portal)/portal/(dashboard)/support/support-client.tsx` | 304 | 80 | VERIFIED | Payment CTA, Razorpay checkout modal, post-payment success state, WhatsApp/email contacts, 5 FAQ items |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `customize-client.tsx` | `/api/portal/requests` | fetch POST | WIRED | Line 110: `fetch('/api/portal/requests', ...)` |
| `app/api/portal/requests/route.ts` | `supabase.from('client_requests')` | auth-scoped query | WIRED | Lines 67, 204: `.from('client_requests')` with `.eq('auth_user_id', user.id)` |
| `components/portal/portal-nav.tsx` | `/portal/customize` | enabled nav link | WIRED | All 4 items have `enabled: true`; `domain`, `customize`, `support` are active `<Link>` elements |
| `domain-client.tsx` | `/api/portal/domain/verify` | fetch POST | WIRED | Lines 258, 288: `fetch('/api/portal/domain/verify', ...)` |
| `domain-client.tsx` | `/api/portal/domain/search` | fetch GET | WIRED | Line 201: `fetch('/api/portal/domain/search?query=...')` |
| `domain-client.tsx` | `/api/portal/domain/suggest` | fetch POST | WIRED | Line 315: `fetch('/api/portal/domain/suggest', ...)` |
| `app/api/portal/domain/verify/route.ts` | `lib/portal/dns-verify.ts` | verifyTxtRecord import | WIRED | Line 5: `import { verifyTxtRecord, generateVerificationToken }` |
| `app/api/portal/domain/suggest/route.ts` | `lib/portal/domain-suggest.ts` | generateDomainSuggestions import | WIRED | Line 4: `import { generateDomainSuggestions }` |
| `app/api/portal/domain/subdomain/route.ts` | claims table | update domain_option+domain_value | WIRED | Lines 69-72: `.update({ domain_option: 'subdomain', domain_value: subdomain })` |
| `components/portal/logo-upload.tsx` | `/api/portal/logo/upload` | fetch POST FormData | WIRED | Line 68: `fetch('/api/portal/logo/upload', ...)` |
| `components/portal/logo-upload.tsx` | `/api/portal/logo/remove-bg` | fetch POST after upload | WIRED | Line 102: `fetch('/api/portal/logo/remove-bg', ...)` |
| `app/api/portal/logo/remove-bg/route.ts` | `lib/portal/logo-bg-removal.ts` | removeLogoBackground import | WIRED | Line 4: `import { removeLogoBackground }` |
| `customize-client.tsx` | `components/portal/logo-upload.tsx` | LogoUpload import | WIRED | Line 7: `import { LogoUpload }`, rendered at line 141 |
| `support-client.tsx` | `/api/portal/payments/agent` | fetch POST | WIRED | Line 63: `fetch('/api/portal/payments/agent', ...)` |
| `support-client.tsx` | Razorpay checkout modal | `new window.Razorpay` | WIRED | Lines 18, 97: `window.Razorpay` type declared and instantiated |
| `app/api/webhooks/razorpay/route.ts` | `client_requests` table | payment.notes.type check | WIRED | Lines 151-155: early return on `agent_support|domain_setup`, `handleAgentPayment` inserts into `client_requests` |
| `app/(portal)/portal/(dashboard)/layout.tsx` | `components/portal/need-help-button.tsx` | NeedHelpButton rendered | WIRED | Line 9: import, line 67: `<NeedHelpButton />` |

---

## Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|---------|
| PORTAL-04 | 14-01 | Change request submission via textarea with optional file upload | SATISFIED | `customize-client.tsx` + POST `/api/portal/requests` with FormData+magic-byte validation |
| PORTAL-05 | 14-01 | Request history with status badges (pending, in-progress, completed) | SATISFIED | `request-card.tsx`: STATUS_STYLES map with all three states; history filtered and rendered in `customize-client.tsx` |
| LOGO-04 | 14-01 | Cal.com booking setup — `cal_embed_slug` column exists, admin sets via dashboard | SATISFIED | Migration `20260325000003_add_projects_cal_embed_slug.sql` confirmed; no client-facing UI per CONTEXT.md decision |
| DOMAIN-01 | 14-02 | Free subdomain auto-provisioned on payment, displayed in portal | SATISFIED | `domain-client.tsx` view=subdomain displays `{slug}.flogen.com`, POST subdomain route updates claims |
| DOMAIN-02 | 14-02 | Connect existing domain with TXT record verification | SATISFIED | `domain-client.tsx` view=connect: enter domain, show TXT token, poll DNS via POST `/api/portal/domain/verify` |
| DOMAIN-03 | 14-02 | DNS verification status display with step-by-step instructions | SATISFIED | 6 registrar instruction sets in `domain-client.tsx`; verified/pending states shown on DNS check result |
| DOMAIN-04 | 14-02 | Domain availability search via Domainr with registrar links | SATISFIED | `domain-client.tsx` view=buy: debounced search GET `/api/portal/domain/search`; `domain-search.ts` `getRegistrarLink` for GoDaddy/Namecheap/Google |
| DOMAIN-05 | 14-02 | AI domain suggestions via Gemini, batch-checked, only available shown | SATISFIED | `suggest/route.ts`: `generateDomainSuggestions` + `batchCheckAvailability` + second round if <3 available |
| LOGO-01 | 14-03 | Logo upload with drag-and-drop (PNG/JPEG, max 5MB) | SATISFIED | `logo-upload.tsx`: onDragOver/onDrop + hidden file input; validates PNG/JPEG type+size; POSTs to upload route |
| LOGO-02 | 14-03 | AI background removal via Gemini; before/after preview | SATISFIED | `logo-bg-removal.ts`: Gemini green-screen + sharp pixel replacement; `logo-upload.tsx` state=preview: side-by-side with checkerboard |
| LOGO-03 | 14-03 | Client approves or reverts background removal before saving | SATISFIED | `logo-upload.tsx` state=preview: "Use Processed" and "Use Original" buttons; choice determines saved URL |
| PORTAL-07 | 14-04 | $49 agent support payment via Razorpay; creates agent_call request | SATISFIED | `support-client.tsx` + `/api/portal/payments/agent` + webhook `handleAgentPayment` inserts `type:'agent_call'` |
| DOMAIN-06 | 14-04 | $49 agent domain setup; creates domain_setup request | SATISFIED | Same payment API with `type:'domain_setup'`; webhook branches at notes.type; inline CTAs in connect/buy views link to `/portal/support` |

**All 13 requirements satisfied. No orphaned requirements.**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/api/portal/requests/route.ts` | 35 | `return null` | INFO | Helper function `detectFileType` returning sentinel — not a stub; fully wired |
| `app/api/portal/logo/upload/route.ts` | 42 | `return null` | INFO | Helper function `detectFileExtension` returning sentinel — not a stub; fully wired |
| `app/(portal)/portal/(dashboard)/support/support-client.tsx` | — | Placeholder contact details | WARNING | `NEXT_PUBLIC_SUPPORT_WHATSAPP` and `NEXT_PUBLIC_SUPPORT_EMAIL` likely not set; WhatsApp/email links will show fallback placeholders until env vars configured |

No blocker anti-patterns. The contact detail placeholders are an operational concern (env vars to configure before production launch), not a code defect.

---

## Human Verification Required

### 1. Gemini bg removal end-to-end

**Test:** Upload a JPEG logo with a white background on `/portal/customize`. Click "Remove Background".
**Expected:** Side-by-side before/after preview appears with checkerboard on the right. "Use Processed" and "Use Original" buttons visible.
**Why human:** Gemini API response behavior (IMAGE modality) can't be verified statically; depends on live API key and model availability.

### 2. Razorpay $49 payment modal

**Test:** Navigate to `/portal/support` (authenticated). Click "Get Domain Help" or "Get General Help".
**Expected:** Razorpay checkout modal opens with $49 amount. On test payment success, "Payment confirmed!" state replaces CTA section and contact info is shown.
**Why human:** Razorpay checkout.js integration requires live DOM + script loading; can't verify checkout modal opens programmatically.

### 3. DNS verification flow

**Test:** On `/portal/domain`, choose "Connect Existing Domain", enter a real domain, select a registrar, verify the step-by-step instructions match that registrar's actual UI.
**Expected:** Instructions are accurate for GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger, Other.
**Why human:** Step-by-step accuracy requires human comparison against current registrar UIs.

### 4. Floating "Need help?" button visibility

**Test:** Navigate between `/portal`, `/portal/domain`, `/portal/customize`. Then navigate to `/portal/support`.
**Expected:** Button visible on first three pages, hidden on support page.
**Why human:** Requires browser rendering to verify `usePathname()` conditional works correctly in the portal layout.

---

## Gaps Summary

No gaps. All 13 requirements are satisfied, all 25 artifacts exist with substantive implementations, all 17 key links are wired end-to-end, and no blocker anti-patterns were found.

The only open item is operational: `NEXT_PUBLIC_SUPPORT_WHATSAPP` and `NEXT_PUBLIC_SUPPORT_EMAIL` env vars should be set before production launch to replace placeholder contact details on the support page.

---

_Verified: 2026-03-25T01:10:00Z_
_Verifier: Claude (gsd-verifier)_
