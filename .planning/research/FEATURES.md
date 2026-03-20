# Feature Landscape: Client Claim Flow (v2.0)

**Domain:** AI-generated website claim/conversion pipeline
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH (patterns well-established in ecommerce/SaaS; Razorpay-specific details verified against official docs)

## Executive Summary

The claim flow converts a generated website from a showcase into revenue. It is a 6-step funnel: CTA injection on generated sites --> claim landing page --> payment via Razorpay --> post-payment customization form --> strategy call upsell --> confirmation/onboarding page. Each step has distinct table-stakes features that must work or the funnel breaks, differentiators that improve conversion, and anti-features that waste time or erode trust.

The flow splits into two fundamentally different audiences with different technical requirements:

1. **Admin-facing** (operator): CTA injection settings, funnel analytics dashboard, claim management. Extends existing admin dashboard.
2. **Client-facing** (prospect): Claim page, payment, customization form, upsell, confirmation. New public pages, mobile-first, zero auth required.

Critical dependencies on the existing system: generated_code stored in `projects` table, `constructHtmlBoilerplate` for preview rendering, existing Supabase infrastructure, existing `project-assets` Storage bucket. New tables needed: `claims`, `customizations`, `payments`. New Storage bucket: `client-uploads`.

---

## Step 1: Sticky CTA Bar on Generated Sites

**What it is:** A persistent bar injected at the top or bottom of every generated website that says "This website was made for [Business Name]. Claim it before [date]." with a countdown timer and a CTA button.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Sticky bar injection into static export** | Without a CTA, the generated site is a dead-end -- no conversion path exists. The bar must be injected into the HTML output when the site is served/exported for client preview. | M | Modify `buildStaticExport` in `lib/export/static-export.ts` to inject a fixed-position bar. Bar HTML/CSS must be self-contained, not dependent on the generated site's styles. |
| **Countdown to claim expiry** | Urgency drives action. Research shows countdown timers improve conversion 9-40% when tied to real deadlines. The 5-day window from PROJECT.md is the deadline. | S | Client-side JS countdown using `claim_expires_at` timestamp from the `claims` table. Show days + hours remaining. |
| **Business name personalization** | The CTA must reference the specific business ("Made for Dr. Patel's Dental Clinic") to feel personal, not generic. Personalized CTAs convert 202% better than generic ones. | S | Pull `business_name` from `projects.business_data` JSON. Already available in the generation pipeline. |
| **Mobile-responsive bar** | Prospects arrive via WhatsApp/email on phones (PROJECT.md constraint). A bar that breaks on mobile kills conversion immediately. | S | Fixed-position bottom bar on mobile (avoids Safari address bar overlap at top). Max height 60px. Large tap target (48px min). |
| **CTA links to claim page** | Button must link to `/claim/[projectId]` or similar unique URL. Without a link, the bar is decorative. | S | URL constructed from project ID. No auth required -- public page. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated attention pulse** | Subtle animation on the CTA button after 10s of inactivity draws eye without being annoying. | S | CSS animation, no JS needed. `@keyframes pulse` on the button. |
| **Dismissible but re-appearing** | Let user close the bar (reduces annoyance) but re-show on scroll or after 60s. Respects user while maintaining conversion pressure. | S | CSS transition + `sessionStorage` flag. Re-show on scroll past 50%. |
| **Bar position preference** | Top bar on desktop, bottom bar on mobile. Desktop users are accustomed to notification bars at top; mobile users expect bottom sheets. | S | CSS media query. No logic change. |
| **Custom bar color matching** | Bar color derived from the generated site's primary brand color (from `business_data.design_system`). Feels native, not jarring. | M | Read color from enriched business data. Fallback to brand default. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Fake countdown that resets on refresh** | Dark pattern. Destroys trust immediately. Research explicitly calls this out as the fastest way to erode credibility. | Use real `claim_expires_at` timestamp from database. When expired, show "Offer expired" state, not a reset timer. |
| **Full-page interstitial before showing site** | Blocking the site preview defeats the purpose -- the prospect needs to see the site quality to want to claim it. | Non-blocking sticky bar that floats over content. |
| **Multiple CTAs/popups on the generated site** | One CTA is enough. Multiple popups feel spammy and desperate. The generated site should speak for itself. | Single sticky bar. No modals, no popups, no exit-intent overlays. |
| **Countdown showing seconds ticking** | Creates anxiety, not urgency. Days and hours are sufficient granularity for a 5-day window. Seconds feel manipulative. | Show "4 days, 12 hours left" format. |

### Dependencies on Existing System

- **`lib/export/static-export.ts`**: CTA bar HTML injected here. New function `injectClaimBar(html, claimData)` that wraps the existing `buildStaticExport` output.
- **`constructHtmlBoilerplate`**: The preview iframe rendering. CTA bar must also work in the preview context (admin sees what client sees).
- **`projects` table**: `business_data` JSON provides business name, design colors.
- **New `claims` table**: Provides `claim_expires_at`, `claim_status`, `project_id`.

---

## Step 2: Claim Landing Page

**What it is:** A dedicated page at `/claim/[projectId]` that shows the generated website preview, pricing, domain options, trust elements, and a primary "Claim This Website" CTA leading to payment.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Full-site preview embed** | The prospect must see what they are buying. An iframe or screenshot of the generated site is the hero element. Without seeing the site, there is nothing to sell. | M | Render `generated_code` via `constructHtmlBoilerplate` in a responsive iframe. Add device-frame chrome (phone/desktop mockup) for visual appeal. |
| **Pricing display (Standard/Pro)** | Transparent pricing is table stakes. 83% of B2B buyers complete research before contacting sales (Gartner). Two tiers: Standard ₹4,999 / Pro ₹9,999. | M | Pricing cards with feature comparison. Highlight Pro as "recommended". Show INR by default, USD for non-Indian geo. |
| **Feature comparison between tiers** | Prospects need to understand what they get at each tier. Without comparison, the price is just a number with no context. | S | Two-column comparison table. Standard: website + basic customization. Pro: website + customization + booking system + strategy call. |
| **Business-specific content** | The page must reference the specific business: name, industry, location. Generic pages feel like spam. | S | Pull from `projects.business_data`. Dynamic server-rendered page with business name in title, h1, and meta tags. |
| **Trust elements near CTA** | Testimonials, guarantee badges, and security indicators near the payment button reduce hesitation. 98% of consumers read reviews before purchasing. | M | "30-day money-back guarantee" badge, "Secure payment via Razorpay" badge with Razorpay logo, "100+ businesses served" counter (or similar social proof). |
| **Mobile-first responsive layout** | Prospects arrive via WhatsApp/email on phones. The claim page MUST be mobile-optimized. | M | Server-rendered Next.js page. Stacked layout on mobile: preview at top, pricing below, CTA sticky at bottom. |
| **SEO meta tags and OG images** | When the claim link is shared on WhatsApp, it should show a rich preview (title, description, screenshot thumbnail). | S | `generateMetadata` in the page component. OG image from site screenshot (generated during creation or on-demand). |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Interactive site preview** | Let the prospect scroll and interact with the generated site in the iframe, not just see a static screenshot. Shows the site is real and functional. | S | Already possible with iframe embed. Add "Click to interact" overlay that removes pointer-events: none on tap. |
| **Video walkthrough of site** | Landing pages with video convert up to 86% more. A short auto-generated video tour of the site sections. | L | Requires screen recording tooling. Defer -- high complexity for marginal gain. |
| **"See it on your phone" QR code** | Desktop viewers can scan QR to view site on their phone. Demonstrates mobile responsiveness. | S | QR code library generating URL to same claim page. |
| **Comparison to competitor sites** | "Sites like yours cost $2,000-5,000 elsewhere" price anchoring. | S | Static copy block. No dynamic data needed. |
| **FAQ accordion** | Addresses common objections: "Can I customize it?", "What about hosting?", "Do I own the code?" | S | Collapsible FAQ section. Static content. |
| **Live chat / WhatsApp button** | Prospects with questions should be able to reach the operator instantly. | S | WhatsApp link with pre-filled message. No chat infrastructure needed. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Gated preview (email required to see site)** | Adding friction before showing value kills conversion. The site preview IS the sales pitch. | Show site preview immediately. Collect contact info during payment. |
| **Complex multi-page claim flow** | Every additional page in the funnel loses 20-40% of visitors. Claim page should lead directly to payment, not through 3 intermediate pages. | Single-page claim with anchor sections. Preview -> Pricing -> Payment CTA, all on one page. |
| **Pricing calculator/configurator** | Over-engineering. Two fixed tiers are clear and simple. A configurator implies negotiation. | Fixed Standard/Pro pricing. No customization of price. |
| **Auto-playing audio/video** | Annoying, especially on mobile with data costs. Always muted or click-to-play. | No auto-play media. |

### Dependencies on Existing System

- **`projects` table**: Provides `business_data`, `generated_code`, `status`.
- **`constructHtmlBoilerplate`**: Renders the site preview in an iframe.
- **New `claims` table**: Tracks claim status, expiry, selected plan, payment status.
- **New Next.js route**: `app/claim/[projectId]/page.tsx` -- server-rendered, public, no auth.
- **Geo-detection**: For INR/USD pricing. Use request headers (`Accept-Language`, Cloudflare/Vercel geo headers) or IP geolocation API.

---

## Step 3: Payment Flow with Razorpay

**What it is:** Razorpay Standard Checkout integration for accepting payment (Standard ₹4,999 / Pro ₹9,999, or USD $499 / $1,299 for international). Server-side order creation, client-side checkout modal, webhook verification.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Server-side order creation** | Razorpay requires creating an order on the server before opening checkout. Amount in paise (499900 for ₹4,999). Never trust client-side amount. | M | New API route `POST /api/payments/create-order`. Uses `razorpay` Node.js SDK. Stores order in `payments` table with `razorpay_order_id`. |
| **Razorpay Standard Checkout modal** | The embedded checkout.js modal is the standard pattern. Loads payment methods (UPI, cards, netbanking, wallets) without leaving the page. | M | Load `checkout.js` script dynamically. Open with order_id, amount, currency, prefill (name, email, phone from form). Handler callback on success. |
| **Prefill customer contact info** | Prefilling name, email, phone in checkout reduces friction. Payment method pre-selection only works if contact and email are prefilled. | S | Collect name, email, phone BEFORE opening checkout (on claim page form). Pass to Razorpay `prefill` option. |
| **Webhook payment verification** | Never rely on client callback alone. Razorpay webhooks (`payment.captured`, `payment.failed`) are the authoritative source. HMAC SHA256 signature verification with webhook secret. | M | New API route `POST /api/webhooks/razorpay`. Verify `x-razorpay-signature` header. Update `claims` and `payments` tables on capture. |
| **Client-side payment verification** | After checkout callback, verify `razorpay_payment_id` + `razorpay_order_id` + `razorpay_signature` server-side as an immediate check (webhook is the safety net). | S | New API route `POST /api/payments/verify`. Compute HMAC, compare with signature, update payment status. Redirect to post-payment page on success. |
| **INR/USD currency handling** | INR is primary market. USD for international. Currency detected from geo or user selection. Amount in smallest unit (paise/cents). | M | Geo-detect currency, allow manual toggle. Store selected currency on order. Razorpay handles conversion to INR for settlement. |
| **Payment failure handling** | Show clear error message on failure. Allow retry without re-entering info. Razorpay sends `payment.failed` webhook; handle it. | S | On failure callback: show error message, keep form state, offer "Try Again" button that reopens checkout with same order. |
| **Idempotent payment processing** | Prevent double-charging. Use `razorpay_order_id` as idempotency key. Check if payment already captured before processing webhook. | S | Check `payments.status = 'captured'` before processing. Use `x-razorpay-event-id` header to detect duplicate webhooks. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **UPI intent flow on mobile** | On Android, Razorpay can trigger UPI app directly (GPay, PhonePe). Faster than typing VPA. Most popular payment method in India. | S | Razorpay handles this automatically in Standard Checkout on mobile. No extra code needed. |
| **Saved card / Magic Checkout** | Razorpay Magic Checkout remembers customer details for repeat purchases. Reduces checkout time. | S | Enable in Razorpay Dashboard settings. No code change. |
| **Payment link fallback** | If checkout.js fails to load (ad blockers, corporate firewalls), provide a Razorpay Payment Link as fallback. | M | Generate payment link via Razorpay API. Show as "Having trouble? Pay via this link" alternative. |
| **Partial payment / EMI** | EMI options for higher-tier purchases. Razorpay supports card EMI. | S | Enable EMI in Razorpay Dashboard. Configure minimum EMI amount. No code change. |
| **Abandoned payment recovery email** | If user starts checkout but doesn't complete, send reminder email after 1 hour. | M | Track `payment_initiated_at` in claims table. Cron or scheduled function to send reminder. Requires email integration (out of scope per constraints). Defer. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Custom payment form (card fields on page)** | PCI compliance nightmare. Razorpay's checkout modal handles all card data securely. Never touch raw card numbers. | Use Razorpay Standard Checkout modal exclusively. |
| **Multiple payment providers** | PROJECT.md explicitly states Razorpay only. Adding Stripe adds complexity, split webhook handling, and reconciliation burden for zero benefit. | Razorpay handles all payment methods including international cards. |
| **Coupon/discount codes at checkout** | Adds UI complexity, requires discount management system, and opens abuse vectors. For a two-tier product with fixed pricing, it is unnecessary. | If discounts are needed, create a separate Razorpay order with reduced amount. No UI for codes. |
| **Subscription/recurring billing** | These are one-time website purchases, not SaaS subscriptions. Recurring billing adds cancellation logic, proration, and churn management. | One-time payment only. Upsells are separate transactions. |

### Dependencies on Existing System

- **New `payments` table**: `id`, `claim_id`, `razorpay_order_id`, `razorpay_payment_id`, `amount`, `currency`, `status`, `created_at`.
- **New `claims` table**: Links to `projects.id`. Stores `plan` (standard/pro), `payment_status`, `customer_email`, `customer_phone`.
- **Environment variables**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- **npm package**: `razorpay` (Node.js SDK for server-side order creation).
- **Webhook endpoint**: Must be publicly accessible. Vercel deployments handle this automatically.

---

## Step 4: Post-Payment Customization Form

**What it is:** After successful payment, the client fills out a customization form: upload logo, choose colors, provide updated contact info, upload photos, request text changes. This form captures what the operator needs to finalize the site.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Multi-step form with progressive disclosure** | Asking for everything at once overwhelms. Progressive disclosure reduces task completion time by 20-40% (Nielsen Norman Group). Steps: (1) Logo & brand colors, (2) Contact details, (3) Photos, (4) Text change requests. | M | Multi-step form with progress indicator. 1-2 fields per screen. "Skip" option on optional sections. React state machine or simple step counter. |
| **File upload for logo** | Every client wants their logo on the site. Direct upload to Supabase Storage via signed URL. Max 5MB, image types only (PNG, SVG, JPG). | M | Extend existing `uploadProjectAsset` pattern but use signed URLs for client-side upload (bypass 1MB Next.js body limit). New bucket `client-uploads` with appropriate RLS. |
| **File upload for photos** | Clients want real photos of their business, team, products instead of stock images. Multiple file upload (up to 10 photos). | M | Batch upload with progress indicators. Use `uploadProjectAssets` pattern. Thumbnail preview after upload. Drag-and-drop zone. |
| **Pre-filled contact details** | Pull existing contact info from `business_data` (from Google Places enrichment). Client confirms or corrects. Reduces typing, shows we already know their business. | S | Pre-populate form fields from `projects.business_data.contactInfo`. Editable fields for phone, email, address, hours. |
| **Color picker or preset palette** | Let client pick brand colors or choose from presets. Generated site already has colors from enrichment; show those as defaults. | S | Preset palettes (5-6 options) plus a simple hex input. Show live preview swatch. No full color wheel needed. |
| **Text change request textarea** | Free-form "What would you like to change about the text?" field. The operator applies these manually -- no automated AI revision from client input. | S | Single textarea with placeholder examples: "Change the tagline to...", "Update the service list to include...". Max 2000 chars. |
| **Form state persistence** | If client closes the browser mid-form, their progress is saved. They can resume from where they left off. | M | Save form state to `customizations` table on each step completion. Load on page revisit. Keyed by `claim_id`. |
| **Submission confirmation** | After form submission, clear feedback: "Got it! We'll start customizing your site." Prevents re-submission anxiety. | S | Redirect to confirmation page (Step 6) with success state. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Live preview with changes** | Show a mock preview of the site with the uploaded logo overlaid. Makes the form feel impactful, not administrative. | L | Complex: would need real-time re-rendering. Defer. A static "before" screenshot is sufficient for v1. |
| **Image cropping/resizing** | Client uploads may be wrong aspect ratio. Basic crop tool saves operator time. | M | Use a library like `react-easy-crop`. Worth considering but not blocking. |
| **Template for "text changes"** | Instead of free-form text, provide structured fields: "Hero tagline", "About us paragraph", "Services list". More actionable for operator. | M | Depends on knowing the generated site's structure. Could auto-detect sections from generated code. Useful but adds complexity. |
| **Font preference selection** | Let client choose from 3-4 font pairings. The generation pipeline already supports font selection. | S | Dropdown with font name + preview text sample. Maps to existing design system data. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Client self-editing the code/design** | PROJECT.md explicitly states "CMS / client self-edit -- operator handles all changes." Clients editing HTML will break things. | Structured form that captures intent. Operator applies changes using existing editor. |
| **Unlimited file uploads** | Storage costs and processing time. 10 photos + 1 logo is generous. More than that signals scope creep. | Cap at 10 photos (5MB each) + 1 logo (5MB). Show clear limits. |
| **AI-powered auto-customization** | Tempting but risky. Automated changes based on client input could produce worse results than manual operator work. The operator is the quality gate. | Form captures client wishes. Operator applies changes manually with AI-assisted editor. |
| **Version selection** | Letting clients choose between different generated versions adds decision fatigue and implies the operator doesn't know best. | Operator selects the best version before sharing the claim link. Client sees one site. |

### Dependencies on Existing System

- **New `customizations` table**: `id`, `claim_id`, `step` (current form step), `logo_url`, `photos` (JSON array of URLs), `colors` (JSON), `contact_updates` (JSON), `text_requests` (text), `submitted_at`.
- **Supabase Storage**: New `client-uploads` bucket with signed URL upload policy. Separate from admin `project-assets` bucket for access control.
- **`projects.business_data`**: Pre-fills contact info fields.
- **New route**: `app/claim/[projectId]/customize/page.tsx` -- accessible only after payment verified.

---

## Step 5: Strategy Call Upsell

**What it is:** After customization form, offer a strategy call booking. Free for Pro plan clients (included in their package). Paid add-on for Standard plan clients. Skippable -- never block the flow.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Upsell page/section after form submission** | Present the upsell at the natural "what's next?" moment. Post-purchase, pre-confirmation is the optimal timing -- client is engaged and invested. | S | Dedicated page or section between customization form and confirmation. Clear value proposition: "Get a free 30-minute strategy call to maximize your website's impact." |
| **Clear skip option** | Upsell must NEVER block the flow. "Skip for now" must be equally prominent as "Book a call." Forced upsells generate resentment and support tickets. | S | Two equal-sized buttons: "Book Strategy Call" and "Skip, Continue to Confirmation". No dark patterns (tiny skip link, countdown to unlock skip). |
| **Pro plan: included messaging** | For Pro clients, frame as "Your plan includes a free strategy call" -- not an upsell, but a benefit they already paid for. | S | Conditional copy based on `claims.plan`. Pro: "Included in your plan." Standard: "Add for ₹999 / $99." |
| **Booking via external tool** | Use Calendly or Cal.com embed for scheduling. Building a custom booking system is not worth the effort for a single operator. | S | Calendly inline embed or Cal.com widget. Prefill client name/email from form data. Link opens in new tab or embedded. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Booking confirmation synced to claims** | When client books via Calendly/Cal.com, a webhook updates the claim record with booking datetime. Operator sees everything in one dashboard. | M | Calendly/Cal.com webhook -> update `claims.strategy_call_booked_at`. Requires webhook integration with external scheduling tool. |
| **Social proof on upsell** | "87% of our Pro clients book a strategy call" or a testimonial from a satisfied client. | S | Static copy block. No dynamic data needed initially. |
| **Reminder email if skipped** | Send a "You still have a free strategy call waiting" email 3 days after purchase if client skipped. | M | Requires email sending capability. Defer unless email integration is already planned. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Aggressive multi-upsell sequence** | One upsell offer is acceptable. A sequence of 3-4 upsell pages after payment feels predatory and increases refund requests. | Single upsell offer, easily skippable. |
| **Time-limited upsell discount** | "Book in the next 10 minutes for 50% off" creates pressure that erodes trust right after a purchase. Post-purchase goodwill is fragile. | Present value, not urgency. The strategy call sells itself if positioned as helpful. |
| **Custom booking system** | Building appointment scheduling from scratch (calendar UI, timezone handling, conflict detection, email reminders) is a massive effort for a feature that Calendly/Cal.com does better. | Embed Calendly/Cal.com. $0-12/month for the operator's use case. |
| **Mandatory call for Pro plan** | Even though the call is "included," making it mandatory adds friction. Some clients just want their site delivered fast. | Optional but encouraged. "Your plan includes this -- book whenever you're ready." |

### Dependencies on Existing System

- **`claims` table**: `plan` field determines free vs. paid call. Add `strategy_call_booked_at` column.
- **External**: Calendly or Cal.com account. Embed widget loaded via script tag.
- **Razorpay** (for Standard plan upsell payment): Reuse existing order creation flow for ₹999/$99 add-on.

---

## Step 6: Confirmation / Onboarding Page

**What it is:** The final page after payment (and optional upsell). Sets expectations on delivery timeline, reduces buyer's remorse, provides next steps, and reinforces the purchase decision.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Order summary** | Show what was purchased: plan name, amount paid, business name, date. Reduces "what did I just buy?" anxiety. | S | Pull from `claims` and `payments` tables. Display plan, amount, currency, payment date. |
| **Delivery timeline** | Clear timeline: "Your customized website will be ready in 3-5 business days." Manage expectations. Any friction in post-purchase communication amplifies regret. | S | Static timeline infographic. Steps: (1) Customization received, (2) Designer review (1-2 days), (3) Revisions if needed, (4) Site delivered. |
| **Next steps checklist** | Tell the client what happens next and what they need to do (if anything). Reduces anxiety and support questions. | S | Checklist: "We've received your customization details", "You'll receive a preview link via email/WhatsApp", "Reply to request any changes." |
| **Contact info for support** | WhatsApp number or email for the operator. The client just spent money -- they need to know they can reach someone. | S | Prominent WhatsApp button and email link. Same as claim page. |
| **Purchase receipt** | Razorpay sends a receipt email automatically. But the confirmation page should also show payment ID for records. | S | Display `razorpay_payment_id` and offer "Download receipt" link to Razorpay's receipt URL. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated success state** | Confetti animation or checkmark animation on page load. Small dopamine hit reinforces purchase decision. Reduces buyer's remorse. | S | CSS animation or lightweight library (canvas-confetti, ~3KB). One-time on page load. |
| **Referral prompt** | "Know someone who needs a website? Share this link." Turns satisfied customers into lead sources. | S | Pre-filled WhatsApp share link or copy-to-clipboard referral URL. |
| **Domain setup instructions** | If client selected "connect existing domain" or "buy new domain," show DNS instructions or next steps for domain setup. | M | Conditional section based on domain selection. DNS A/CNAME record instructions. |
| **Email confirmation** | Send a copy of the confirmation details via email. Professional touch. | M | Requires email sending capability (Resend, SendGrid, or Supabase Edge Functions with email). |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Second upsell on confirmation page** | Client just completed the flow. Do NOT try to sell more on the confirmation page. It undermines the "we're taking care of you" message. | Pure confirmation and reassurance. No sales. |
| **Account creation requirement** | Do NOT require the client to create an account to see their confirmation or track their order. Zero-friction experience. | Use claim URL with unique token for revisiting status. No password, no account. |
| **Automated progress tracking** | Building a real-time "order tracker" with status updates requires workflow automation. The operator manually delivers sites. | Static timeline. Operator sends WhatsApp/email updates manually. |

### Dependencies on Existing System

- **`claims` table**: Provides order details, plan, status.
- **`payments` table**: Provides payment amount, ID, date.
- **`customizations` table**: Confirms form was submitted.
- **New route**: `app/claim/[projectId]/confirmation/page.tsx`.

---

## Step 7: Domain Selection UX

**What it is:** During the claim flow (on the claim page), the prospect chooses how they want their website addressed: use their existing domain, buy a new domain, or use a free subdomain.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Three clear options** | (1) "I have a domain" -- text input for existing domain, (2) "Help me buy a domain" -- shows recommended domain + price, (3) "Use free subdomain" -- e.g., drclinic.flogen.site. Each option must be clearly explained. | M | Radio button group with expanding detail panels. Option 1: domain input + DNS instructions. Option 2: domain suggestion + "we'll set it up" messaging. Option 3: auto-generated subdomain preview. |
| **Free subdomain as default/fallback** | Not every client has or wants a custom domain. The free subdomain removes a barrier to purchase. Must feel like a real option, not a consolation prize. | S | Auto-generate from business name: `dr-patels-dental.flogen.site`. Show it as "Your free web address." |
| **Domain input validation** | If client enters their existing domain, validate format (not availability -- that requires API). Prevent typos like "mysite.con" or "www .example.com". | S | Regex validation for domain format. Strip www prefix, lowercase, trim whitespace. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Domain availability check** | Check if a suggested domain is available using a domain registrar API (GoDaddy, Namecheap). Show pricing. | L | Requires API integration with a registrar. PROJECT.md marks "Domain registration API integration" as out of scope. Defer. |
| **Domain name suggestions** | Suggest 3-5 domain names based on business name and industry. E.g., for "Dr. Patel's Dental": drpatelsdental.com, pateldental.in, drpateldentist.com. | M | Algorithmic generation from business name. No availability check needed for suggestions -- just show them as ideas. |
| **DNS setup wizard** | Step-by-step DNS configuration guide with copy-paste record values for the client's specific registrar (GoDaddy, Namecheap, Google Domains). | M | Conditional instructions based on registrar selection dropdown. Static content per registrar. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **In-flow domain purchase** | Integrating domain registration API, payment for domain separately, and DNS automation is massive scope. PROJECT.md explicitly excludes this. | Show "we'll help you buy [domain]" and handle domain purchase manually. Charge domain cost separately or include in price. |
| **SSL certificate management** | Automated HTTPS setup requires DNS validation, certificate provisioning, and renewal. Out of scope. | Free subdomain on operator's wildcard SSL. Custom domains get manual SSL setup post-delivery. |
| **Hosting selection** | Do NOT ask the client to choose a hosting provider during claim flow. Adds confusion and decisions to a purchase flow. | Hosting is handled by operator. Client doesn't need to know or decide. |

### Dependencies on Existing System

- **`claims` table**: Add `domain_option` (enum: 'existing', 'new', 'subdomain'), `domain_value` (the actual domain or subdomain).
- **Claim page UI**: Domain selection is a section of the claim landing page, not a separate page.

---

## Step 8: Conversion Funnel Analytics

**What it is:** Track every step of the claim funnel to identify where prospects drop off: site view -> claim page visit -> plan selected -> payment initiated -> payment completed -> form submitted -> upsell converted.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Funnel step tracking** | Record when each prospect hits each funnel step. Without this, you cannot optimize. Track: `cta_clicked`, `claim_page_viewed`, `plan_selected`, `payment_initiated`, `payment_completed`, `form_started`, `form_submitted`, `upsell_shown`, `upsell_converted`, `confirmation_viewed`. | M | New `claim_events` table: `id`, `claim_id`, `event_type`, `metadata` (JSON), `created_at`. Log events from both client-side (page views) and server-side (payment captured). |
| **Funnel visualization** | Show the funnel as a bar chart or step diagram in the admin dashboard. Each step shows count and drop-off percentage. Without visualization, raw data in a table is useless. | M | New dashboard section or page. Bar chart with step labels and percentages. Use existing Recharts from v1.0 analytics dashboard. |
| **Conversion rate by time period** | Daily/weekly/monthly conversion rates. See trends over time. | S | Date filter on funnel data. Reuse existing date filtering from admin dashboard. |
| **Revenue tracking** | Total revenue, revenue by plan, average revenue per claim. The business metric that matters most. | S | Aggregate from `payments` table where status = 'captured'. Sum by plan, by date range. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Drop-off alerts** | Notify operator when conversion rate drops below threshold or when a specific step has unusual abandonment. | M | Threshold check on funnel query. Could be a dashboard warning banner rather than email/notification. |
| **Funnel segmentation** | Break down funnel by industry, location, plan type. See if dentists convert better than restaurants. | M | Add dimensions to `claim_events`. Filter UI on analytics page. |
| **Attribution tracking** | Track how the prospect found the site: direct link, WhatsApp share, email campaign. UTM parameter capture. | S | Parse UTM params on claim page load. Store in `claim_events.metadata`. |
| **A/B testing claim page variants** | Test different pricing, copy, or layouts on the claim page. | L | Requires variant assignment, consistent serving, and statistical analysis. Defer -- optimize manually first based on funnel data. |
| **Google Analytics integration** | Send funnel events to GA4 for cross-site analytics. | S | `gtag('event', ...)` calls on each funnel step. Requires GA4 property setup. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Third-party analytics platform** | Mixpanel, Amplitude, or Segment add cost, complexity, and data duplication. The funnel is simple enough for custom tracking. | Custom tracking in Supabase `claim_events` table. Full control, zero cost beyond Supabase. |
| **Session recording (Hotjar/FullStory)** | Overkill for a single-page claim flow with 3-4 steps. The funnel metrics tell you enough. | Focus on step-level drop-off rates. If a step has high drop-off, inspect the page manually. |
| **Real-time analytics dashboard** | The claim flow processes dozens of claims, not millions. Real-time is unnecessary overhead. | Refresh on page load. Optionally add a "Refresh" button. |

### Dependencies on Existing System

- **New `claim_events` table**: Event log with claim_id foreign key.
- **Existing analytics infrastructure**: v1.0 built an analytics dashboard with Recharts. Extend with new claim funnel section.
- **Client-side event logging**: New API route `POST /api/analytics/claim-event` for logging from client-facing pages.
- **Server-side event logging**: Log payment events from webhook handler.

---

## Feature Dependencies Map

```
                    +-----------------+
                    |   CTA Bar (1)   |
                    +--------+--------+
                             |
                             v
                    +--------+--------+
                    | Claim Page (2)  |
                    +--------+--------+
                             |
                    +--------+--------+
                    |  Domain UX (7)  |  (section within Claim Page)
                    +--------+--------+
                             |
                             v
                    +--------+--------+
                    | Payment (3)     |
                    +--------+--------+
                             |
                             v
                    +--------+--------+
                    | Custom Form (4) |
                    +--------+--------+
                             |
                             v
                    +--------+--------+
                    | Upsell (5)      |
                    +--------+--------+
                             |
                             v
                    +--------+--------+
                    | Confirmation (6)|
                    +--------+--------+

    Analytics (8) tracks ALL steps above (cross-cutting)

    Existing system dependencies:
    - CTA Bar (1) depends on: static-export.ts, constructHtmlBoilerplate
    - Claim Page (2) depends on: projects table, business_data
    - Payment (3) depends on: new Razorpay integration, new tables
    - Custom Form (4) depends on: Supabase Storage (signed URLs)
    - Upsell (5) depends on: external Calendly/Cal.com
    - Confirmation (6) depends on: claims + payments tables
    - Analytics (8) depends on: new claim_events table
```

---

## MVP Recommendation

### Prioritize (must ship together for a working funnel):

1. **CTA Bar injection** (Step 1) -- Without it, no entry point to funnel.
2. **Claim Landing Page** (Step 2 + Step 7 domain selection) -- Without it, CTA has nowhere to go.
3. **Razorpay Payment** (Step 3) -- Without it, no revenue.
4. **Post-Payment Customization Form** (Step 4) -- Without it, operator can't deliver what client wants.
5. **Confirmation Page** (Step 6) -- Without it, client feels abandoned after payment.

### Defer to fast-follow:

6. **Strategy Call Upsell** (Step 5) -- Nice but not blocking revenue. Can be added post-launch as a page between form and confirmation.
7. **Funnel Analytics** (Step 8) -- Can track manually via database queries initially. Dashboard visualization comes after the funnel is live and producing data.

### Rationale:

Steps 1-4 + 6 form a minimum viable funnel. A prospect sees a CTA, visits the claim page, pays, submits their customization requests, and sees a confirmation. Revenue flows. The upsell and analytics are optimization layers on top of a working funnel.

---

## Complexity Summary

| Step | Feature | Complexity | Blocking? |
|------|---------|-----------|-----------|
| 1 | Sticky CTA Bar | **M** | Yes -- funnel entry point |
| 2 | Claim Landing Page | **L** | Yes -- conversion hub |
| 3 | Razorpay Payment | **L** | Yes -- revenue enabler |
| 4 | Customization Form | **M** | Yes -- delivery enabler |
| 5 | Strategy Call Upsell | **S** | No -- optimization layer |
| 6 | Confirmation Page | **S** | Yes -- purchase closure |
| 7 | Domain Selection UX | **M** | No -- section within claim page, can start with subdomain-only |
| 8 | Funnel Analytics | **M** | No -- optimization layer |

**Total estimated complexity: L-XL** (6-8 plans across 3-4 phases)

---

## New Database Tables Required

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `claims` | Tracks claim lifecycle | `id`, `project_id` (FK), `plan`, `status`, `customer_name`, `customer_email`, `customer_phone`, `domain_option`, `domain_value`, `claim_expires_at`, `payment_status`, `strategy_call_booked_at`, `created_at` |
| `payments` | Razorpay payment records | `id`, `claim_id` (FK), `razorpay_order_id`, `razorpay_payment_id`, `amount`, `currency`, `status`, `webhook_verified`, `created_at` |
| `customizations` | Post-payment form data | `id`, `claim_id` (FK), `current_step`, `logo_url`, `photos` (JSONB), `colors` (JSONB), `contact_updates` (JSONB), `text_requests`, `font_preference`, `submitted_at`, `created_at` |
| `claim_events` | Funnel analytics | `id`, `claim_id` (FK), `event_type`, `metadata` (JSONB), `created_at` |

---

## New Environment Variables Required

| Variable | Purpose | When Needed |
|----------|---------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay API key (public) | Payment flow |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key for client-side checkout.js | Payment flow |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret (server-only) | Order creation, verification |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | Webhook handler |
| `CALENDLY_URL` or `CAL_URL` | Booking widget URL | Upsell step |

---

*Research completed: 2026-03-18*
*Sources: Razorpay official docs, Microsoft Clarity blog, OptimizePress, Contentsquare, Wisepops, Nielsen Norman Group research on progressive disclosure, Shopify conversion funnel analysis, GrowthSuite countdown timer research, Supabase Storage signed URL docs*
