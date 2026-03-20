---
phase: 09-customization-and-upsell
verified: 2026-03-19T00:00:00Z
status: gaps_found
score: 12/13 must-haves verified
re_verification: false
gaps:
  - truth: "Submitting the form creates a customization record, updates claim status to customizing, and notifies the operator"
    status: partial
    reason: "CUST-08 explicitly requires 'sends admin notification'. The submitCustomization action creates the record and updates claim status correctly, but admin notification is absent — only a console.log is present. The research doc acknowledged deferring this (no email service), but the requirement was not updated to reflect the deferral."
    artifacts:
      - path: "webgen/app/(client)/claim/[slug]/claim-actions.ts"
        issue: "submitCustomization server action has no admin notification — console.log('[ClaimActions] Customization submitted...') is the only operator signal. No email, webhook, or queue notification implemented."
    missing:
      - "Admin notification when customization is submitted (email, webhook to Slack/email, or operator queue notification per CUST-08)"
human_verification:
  - test: "Complete end-to-end flow: pay for a Standard plan, submit the customization form, and navigate through upsell to confirmation"
    expected: "Claim page -> customize (with progress indicator at step 2) -> form pre-filled with Google Maps data -> submit -> upsell page -> skip link -> confirmed page"
    why_human: "Full redirect chain involves multiple server components with Supabase state; cannot verify in-order state transitions programmatically without a live environment"
  - test: "Upload a logo file via drag-and-drop"
    expected: "Thumbnail preview appears immediately, storage path saved on success, error shown for files over 5MB or non-PNG/JPG/WebP"
    why_human: "objectURL preview and upload spinner require live browser interaction"
  - test: "Verify Cal.com iframe renders when NEXT_PUBLIC_CAL_LINK is configured"
    expected: "iframe loads with client name and email pre-filled in query params; fallback message appears when env var is absent"
    why_human: "Requires live environment with Cal.com env var set; iframe rendering cannot be verified statically"
  - test: "Pro plan upsell: verify Cal.com iframe appears immediately with no payment wall"
    expected: "Pro clients see 'Included free with your Pro plan' badge and the calendar immediately; no Razorpay checkout.js script loaded"
    why_human: "Conditional plan-based rendering depends on runtime claim.plan value from database"
---

# Phase 9: Customization and Upsell Verification Report

**Phase Goal:** After paying, clients submit their customization details (logo, colors, contacts, photos, text changes) and optionally book a strategy call -- the operator has everything needed to deliver the final site

**Verified:** 2026-03-19
**Status:** gaps_found (1 partial gap — CUST-08 admin notification deferred)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Uploading a PNG/JPG/WebP file under 5MB to /api/uploads returns a storage path | VERIFIED | `route.ts`: magic byte validation chain -> supabase.storage.from('claim-uploads').upload() -> returns `{ path, bucket }` |
| 2 | Uploading an invalid file type (SVG, EXE) to /api/uploads returns 400 error | VERIFIED | `detectFileType()` returns null for non-PNG/JPG/WebP; handler returns `{ error: 'Invalid file type. Only PNG, JPG, and WebP allowed.' }` with status 400 |
| 3 | Uploading without a paid claim returns 403 | VERIFIED | Claim status checked with `.in('status', ['paid', 'customizing'])` — returns 403 `Unauthorized` if not found |
| 4 | Visiting /claim/{slug}/customize after payment shows the customize page with progress indicator | VERIFIED | `customize/page.tsx`: payment gate queries claims with `.in('status', ['paid', 'customizing'])`, renders `<ProgressSteps currentStep={2} />` + full `<CustomizeClient />` |
| 5 | Visiting /claim/{slug}/customize without payment redirects to /claim/{slug} | VERIFIED | `customize/page.tsx` line 44-46: `if (!claim) { redirect('/claim/${slug}') }` |
| 6 | Visiting /claim/{slug} after payment redirects to /claim/{slug}/customize | VERIFIED | `claim/[slug]/page.tsx` lines 86-103: paid+no-customization -> `redirect('/claim/${slug}/customize')` |
| 7 | Progress indicator shows Payment (complete), Customize (active), Go Live (upcoming) | VERIFIED | `progress-steps.tsx`: `isComplete = step.number < currentStep`, `isActive = step.number === currentStep`; step 1 green, step 2 blue, step 3 gray — correct at `currentStep=2` |
| 8 | Client can drag-and-drop or click to upload a logo and see thumbnail preview | VERIFIED | `logo-upload.tsx`: `onDrop`, `onDragOver`, `handleFile` with `URL.createObjectURL(file)` preview, spinner overlay during upload, "Change logo" button when value set |
| 9 | Client can upload up to 10 photos with thumbnail previews and remove buttons | VERIFIED | `photo-upload.tsx`: grid of photos with X remove button, `maxPhotos=10`, `atLimit` disables further uploads, `URL.revokeObjectURL` on removal |
| 10 | Client can set primary and secondary brand colors via color picker or hex input | VERIFIED | `color-picker.tsx`: toggle, native `<input type="color">` + text hex input, 6 preset swatches, blur validation, 2 rows (primary + secondary) |
| 11 | Contact fields pre-filled from Google Maps data and editable | VERIFIED | `contact-form.tsx`: `useEffect([], ...)` pre-fills from `prefill` prop; server component in `customize/page.tsx` extracts phone/email/address from `project.business_data.contactInfo` |
| 12 | Client can write text change requests with 1000-character limit and counter | VERIFIED | `text-changes.tsx`: `maxLength={1000}`, character counter with amber at 800+, red at 950+ |
| 13 | Pro plan clients see booking system setup; Standard clients do not | VERIFIED | `customize-client.tsx` line 168: `{plan === 'pro' && (<BookingSetup .../>)}` — conditional render based on plan prop |
| 14 | Submitting the form creates a customization record and updates claim status to customizing | VERIFIED | `submitCustomization` action: upsert into `customizations`, `.update({ status: 'customizing' })` on claims |
| 15 | After submission, client is redirected to the upsell page | VERIFIED | `customize-client.tsx` line 88: `router.push('/claim/${slug}/upsell')` on successful server action |
| 16 | Admin is notified when customization is submitted (CUST-08) | PARTIAL | Only `console.log('[ClaimActions] Customization submitted for claim:', claimId)` — no email/webhook/queue notification |
| 17 | After customization submission, upsell page appears at /claim/{slug}/upsell | VERIFIED | `upsell/page.tsx`: payment-gated server component; customization-existence guard redirects to `/customize` if no record |
| 18 | Pro plan clients see Cal.com iframe immediately (free call) | VERIFIED | `upsell-client.tsx`: `isPro = plan === 'pro'`, `showCalendar = isPro` initial state; Cal.com iframe renders when `showCalendar=true`; Pro badge displayed |
| 19 | Standard plan clients see upsell pricing and pay before seeing calendar | VERIFIED | `upsell-client.tsx`: price display `CURRENCY_SYMBOL[currency] + UPSELL_DISPLAY.strategy_call[currency]` with "+ GST"; "Book Strategy Call" button triggers `createUpsellOrder` + Razorpay checkout |
| 20 | Skip link is clearly visible and navigates to /claim/{slug}/confirmed | VERIFIED | `upsell-client.tsx` lines 246-263: full-width outlined button, always rendered in DOM, calls `updateStrategyCallPreference(claimId, false)` + `router.push('/claim/${slug}/confirmed')` |
| 21 | Cal.com iframe loads with client name and email pre-filled | VERIFIED | `upsell-client.tsx` line 215: `?embed=true&layout=month_view&name=${encodeURIComponent(clientName)}&email=${encodeURIComponent(clientEmail)}` |
| 22 | Standard plan upsell payment uses Razorpay checkout | VERIFIED | `upsell-client.tsx`: `createUpsellOrder` -> Razorpay modal pattern with `window.Razorpay`; `checkout.js` loaded via `<Script>` for Standard only |
| 23 | Navigating directly to /claim/{slug}/upsell without completing customization redirects to /customize | VERIFIED | `upsell/page.tsx` lines 51-59: `.from('customizations').select('id').eq('claim_id', claim.id).maybeSingle()` -> `redirect('/claim/${slug}/customize')` if null |

**Score:** 12/13 truths verified (1 partial — CUST-08 admin notification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `webgen/app/api/uploads/route.ts` | Server-proxy file upload with magic byte validation | VERIFIED | 137 lines; full validation chain + supabase admin upload |
| `webgen/app/(client)/claim/[slug]/customize/page.tsx` | Payment-gated customize page server component | VERIFIED | 97 lines; admin client, payment gate, customization guard, pre-fill extraction |
| `webgen/app/(client)/claim/[slug]/customize/components/progress-steps.tsx` | 3-step progress indicator | VERIFIED | 82 lines; correct hex colors, Check icon for completed, line connectors |
| `webgen/app/(client)/claim/[slug]/customize/customize-client.tsx` | Multi-step form orchestrator (min 80 lines) | VERIFIED | 206 lines; all 6 sections, logo required validation, submit handler, router.push to upsell |
| `webgen/app/(client)/claim/[slug]/customize/components/logo-upload.tsx` | Drag-and-drop logo upload with preview (min 40 lines) | VERIFIED | 173 lines; drag-drop, objectURL preview, /api/uploads fetch, spinner overlay |
| `webgen/app/(client)/claim/[slug]/customize/components/photo-upload.tsx` | Multi-photo upload with thumbnails and remove (min 50 lines) | VERIFIED | 236 lines; grid, X remove, max 10 limit, sequential upload |
| `webgen/app/(client)/claim/[slug]/customize/components/color-picker.tsx` | Primary/secondary hex color inputs with swatches (min 30 lines) | VERIFIED | 175 lines; toggle, native color input, hex text input, 6 preset swatches |
| `webgen/app/(client)/claim/[slug]/customize/components/contact-form.tsx` | Pre-filled contact info fields (min 30 lines) | VERIFIED | 168 lines; phone/email/address/WhatsApp, useEffect pre-fill, "same as phone" checkbox |
| `webgen/app/(client)/claim/[slug]/customize/components/text-changes.tsx` | Textarea with character counter (min 20 lines) | VERIFIED | 40 lines; maxLength=1000, amber at 800+, red at 950+ |
| `webgen/app/(client)/claim/[slug]/customize/components/booking-setup.tsx` | Pro-only booking system preferences form (min 40 lines) | VERIFIED | 225 lines; service types as chips, day checkboxes, time inputs, buffer select |
| `webgen/app/(client)/claim/[slug]/claim-actions.ts` | submitCustomization server action | VERIFIED | zod schema, claim verify, upsert logic, status update — but no admin notification |
| `webgen/lib/claim-pricing.ts` | Upsell pricing constants (UPSELL_PRICING) | VERIFIED | Lines 72-91: UPSELL_PRICING (199900 paise INR / 4900 cents USD), UPSELL_DISPLAY, calculateUpsellTotal |
| `webgen/app/(client)/claim/[slug]/upsell/page.tsx` | Payment-gated + customization-gated upsell server component | VERIFIED | 92 lines; claim gate, customization-existence guard, currency from claim, Cal.com prefill data passed |
| `webgen/app/(client)/claim/[slug]/upsell/upsell-client.tsx` | Cal.com iframe, skip link, conditional Razorpay payment (min 60 lines) | VERIFIED | 274 lines; Pro/Standard conditional logic, Cal.com iframe with fallback, Razorpay flow, always-visible skip button |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `uploads/route.ts` | `supabase.storage.from('claim-uploads').upload()` | service role key admin client | WIRED | Line 114: `supabase.storage.from('claim-uploads').upload(path, Buffer.from(arrayBuffer), ...)` |
| `claim/[slug]/page.tsx` | `/claim/{slug}/customize` | redirect when paid, no customization | WIRED | Line 102: `redirect('/claim/${slug}/customize')` — only after checking `!customization` |
| `customize/page.tsx` | claims table | payment gate query | WIRED | Lines 35-42: `.from('claims').select(...).in('status', ['paid', 'customizing'])` |
| `logo-upload.tsx` | `/api/uploads` | fetch POST with FormData | WIRED | Line 46: `fetch('/api/uploads', { method: 'POST', body: formData })` where formData has file+claimId+type='logo' |
| `photo-upload.tsx` | `/api/uploads` | fetch POST with FormData | WIRED | Line 63: `fetch('/api/uploads', { method: 'POST', body: formData })` where type='photo' |
| `customize-client.tsx` | `submitCustomization` server action | form submission handler | WIRED | Line 67: `await submitCustomization({ claimId, logoUrl: logoPath, ... })` |
| `claim-actions.ts` | `customizations` table + claims table | supabase insert + update | WIRED | Lines 284-298: `supabase.from('customizations').insert(...)` + `supabase.from('claims').update({ status: 'customizing' })` |
| `upsell-client.tsx` | Cal.com iframe | iframe src with prefill query params | WIRED | Line 215: `https://cal.com/${calLink}?embed=true&layout=month_view&name=...&email=...` |
| `upsell-client.tsx` | `/claim/{slug}/confirmed` | skip link navigation | WIRED | Line 117: `router.push('/claim/${slug}/confirmed')` in `handleSkip` |
| `claim-actions.ts` | `razorpay.orders.create` with upsell receipt | `createUpsellOrder` | WIRED | Lines 356-364: `razorpay.orders.create({ amount, currency, receipt: 'upsell-${claimId}', notes: { claimId, type: 'strategy_call' } })` |
| `upsell/page.tsx` | `customizations` table | existence guard query before rendering | WIRED | Lines 51-59: `.from('customizations').select('id').eq('claim_id', claim.id)` -> redirect if null |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CUST-01 | 09-01 | Customize form accessible only after payment (server-side check) | SATISFIED | `customize/page.tsx`: admin client queries claims with `in('status', ['paid', 'customizing'])`, redirects to `/claim/{slug}` if not found |
| CUST-02 | 09-02 | Logo upload (required) with drag-and-drop, thumbnail preview, 5MB max, PNG/JPG/WebP | SATISFIED | `logo-upload.tsx`: 173 lines, drag-drop, objectURL preview, client-side + server-side magic byte validation |
| CUST-03 | 09-02 | Brand color pickers (optional) with primary/secondary hex inputs | SATISFIED | `color-picker.tsx`: toggle "keep current", native color input, hex text input, 6 preset swatches |
| CUST-04 | 09-02 | Contact info pre-filled from Google Maps data, editable | SATISFIED | `contact-form.tsx` + `customize/page.tsx`: phone/email/address extracted from `project.business_data.contactInfo`, passed as `prefill` prop, `useEffect` applies on mount |
| CUST-05 | 09-02 | Text changes textarea (1000 char limit) for content modification requests | SATISFIED | `text-changes.tsx`: `maxLength={1000}`, counter with color coding |
| CUST-06 | 09-02 | Multi-photo upload (optional, max 10 photos, 5MB each) with thumbnails and remove | SATISFIED | `photo-upload.tsx`: grid, remove button with URL revocation, limit enforced |
| CUST-07 | 09-02 | Booking system setup visible only for Pro plan | SATISFIED | `customize-client.tsx`: `{plan === 'pro' && <BookingSetup />}` conditional |
| CUST-08 | 09-02 | On submit, creates customization record, updates status to 'customizing', sends admin notification | PARTIAL | Customization record created and status updated — confirmed in `claim-actions.ts`. Admin notification absent: only `console.log` present. Research doc (line 29) explicitly deferred this due to no email service, but the requirement was never downscoped. |
| CUST-09 | 09-01 | Progress indicator: Step 1 (Payment) complete, Step 2 (Customize) current, Step 3 (Go Live) upcoming | SATISFIED | `progress-steps.tsx`: green check at step 1, blue active at step 2, gray upcoming at step 3 when `currentStep=2` |
| UPSELL-01 | 09-03 | After customization, strategy call upsell appears (free for Pro, 1,999 INR / $49 for Standard) | SATISFIED | `upsell/page.tsx` + `upsell-client.tsx`: pricing from `UPSELL_DISPLAY`, Pro badge + no payment, Standard shows price + Razorpay |
| UPSELL-02 | 09-03 | Cal.com embed (iframe) for scheduling | SATISFIED | `upsell-client.tsx` line 214: `<iframe src="https://cal.com/...?embed=true&layout=month_view&name=...&email=...">`; graceful fallback when `NEXT_PUBLIC_CAL_LINK` not configured |
| UPSELL-03 | 09-03 | "No thanks, continue to confirmation" skip link is clearly visible | SATISFIED | `upsell-client.tsx` lines 246-263: full-width outlined button, unconditionally rendered (not a tiny text link), calls `updateStrategyCallPreference(claimId, false)` + `router.push` |
| UPSELL-04 | 09-03 | Standard plan call fee collected via Razorpay before showing calendar | SATISFIED | `upsell-client.tsx`: `createUpsellOrder` -> Razorpay modal -> on payment success `setShowCalendar(true)`; `checkout.js` loaded only for Standard |

**Orphaned requirements:** None. All 13 IDs mapped to plans and verified.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/api/uploads/route.ts` | 38 | `return null` | Info | This is the intentional return value of `detectFileType()` helper when no magic bytes match — not a stub. No impact. |

No stubs, placeholder components, empty handlers, or TODO/FIXME/HACK comments found in any phase 9 files.

### Human Verification Required

#### 1. End-to-End Redirect Flow

**Test:** With a paid claim in the database, visit `/claim/{slug}` as the paid client.

**Expected:** Redirected to `/claim/{slug}/customize` -> form loads with pre-filled contact data -> submit -> redirected to `/claim/{slug}/upsell` -> click skip -> redirected to `/claim/{slug}/confirmed`

**Why human:** Multi-step server-side redirect chain with live Supabase state; each step depends on the previous step's database mutations being committed.

#### 2. Logo Drag-and-Drop Upload

**Test:** Drag a PNG onto the logo upload zone; then drag an SVG or EXE file.

**Expected:** PNG shows spinner, then thumbnail appears immediately; SVG/EXE shows error "Only PNG, JPG, and WebP files are allowed" with no upload.

**Why human:** `URL.createObjectURL()` and drag events require live browser interaction.

#### 3. Cal.com Iframe with NEXT_PUBLIC_CAL_LINK Configured

**Test:** Set `NEXT_PUBLIC_CAL_LINK=username/strategy-call` in `.env.local`, then visit `/claim/{slug}/upsell` as a Pro plan client.

**Expected:** iframe loads `https://cal.com/username/strategy-call?embed=true&layout=month_view&name=...&email=...` showing available booking slots.

**Why human:** Requires live environment with a real Cal.com account and the env var configured.

#### 4. Razorpay Upsell Payment (Standard Plan)

**Test:** Visit upsell page as a Standard plan client, click "Book Strategy Call".

**Expected:** Razorpay modal opens with "Strategy Call" description; after payment, Cal.com calendar appears.

**Why human:** Razorpay checkout.js modal interaction cannot be verified statically; requires test keys and live browser.

### Gaps Summary

One partial gap was found. The phase goal is largely achieved: clients can submit customization details (logo, colors, contacts, photos, text changes) and optionally book a strategy call. The operator receives all form data in the `customizations` table. However, CUST-08 explicitly requires the operator to be *notified* when a customization is submitted — not just for data to exist in the database. The implementation uses only a server-side `console.log` rather than an active notification (email, webhook, Slack, etc.). This was a documented research decision (no email service available), but the requirement was never formally downscoped, so the gap remains open.

The gap does not block the client-side flow — clients can complete the full journey. It only affects the operator's awareness of new submissions.

---

_Verified: 2026-03-19T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
