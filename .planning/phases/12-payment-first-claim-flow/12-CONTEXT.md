# Phase 12: Payment-First Claim Flow - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Simplify the claim page to payment-first (remove pre-payment forms and domain section), harden the webhook with dual verification, switch to USD-only pricing, add Razorpay test/live mode toggle, and update the confirmation page with account creation. The webhook does NOT create accounts — it only updates claim status and contact info.

</domain>

<decisions>
## Implementation Decisions

### Claim Page Simplification
- Keep ALL existing sections except domain section and pre-payment forms: hero, countdown, pricing, features grid, customization process, testimonials, trust section, FAQ
- Countdown timer stays — urgency still drives conversions
- Brief confirmation step between plan selection and Razorpay: click "Get Started" → show plan name + price + "Confirm & Pay" button → then Razorpay modal opens (prevents accidental clicks)
- Premium "Contact Us" card opens a Cal.com popup modal for scheduling a 30-minute call (not WhatsApp or email link)
- Track premium_contact analytics event on Cal.com button click

### Confirmation Page Changes
- Password setup is the PROMINENT primary CTA after payment confirmation
- Email field pre-filled from Razorpay payment data and READ-ONLY (not editable)
- During webhook gap: spinner with status text ("Confirming your payment...") — switches to success when verified via dual verification
- After password set + account created → auto-login and instant redirect to /portal (no intermediate success message)
- If email matches existing Supabase Auth account: skip signup flow, show "Welcome back! Log in to access your new site." with password field instead
- Razorpay Payments API returns email — use this if webhook is slow (dual verification path gets email too)

### Test Mode Experience
- Prominent full-width yellow/orange banner at top: "TEST MODE — No real charges" — impossible to miss
- Test mode banner appears on ALL payment pages (claim page AND confirmation page)
- Test claims follow identical behavior to live claims (same 5-day expiry, same flow)
- Key switching approach: Claude's discretion (separate env vars recommended per research)

### Webhook & Account Creation
- **CRITICAL: Webhook does NOT create accounts.** Webhook only updates claim to 'paid' and populates client_name, client_email, client_phone from Razorpay payload
- Account creation happens ONLY on the confirmation page when the client sets their password
- If webhook hasn't arrived but Razorpay API confirms payment, use API response to get email for the password form
- Dual verification: check DB first (webhook may have arrived), fall back to Razorpay Orders/Payments API pull

### Claude's Discretion
- Test/live key env var structure (separate vars or single toggle)
- Exact confirmation step UI between plan select and Razorpay
- Cal.com popup implementation for Premium card
- Dual verification polling interval and timeout

</decisions>

<specifics>
## Specific Ideas

- The confirmation step before Razorpay prevents accidental $499-$1,299 charges on mobile tap
- Premium card Cal.com modal reuses the CDN script pattern already validated for booking (React 19 peer dep conflict with npm package)
- "Welcome back" detection for returning clients is a nice touch for the multi-site purchase edge case

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-payment-first-claim-flow*
*Context gathered: 2026-03-25*
