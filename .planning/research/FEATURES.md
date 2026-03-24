# Feature Landscape: Client Portal & Updated Funnel (v3.0)

**Domain:** Client portal, payment-first funnel, domain management, AI logo processing, admin fulfillment
**Researched:** 2026-03-25
**Confidence:** MEDIUM-HIGH (Supabase Auth and Razorpay verified against official docs; domain management and AI bg removal verified via official APIs; client portal patterns synthesized from industry standards)

## Executive Summary

v3.0 transforms Flogen from a one-shot claim flow into a persistent client relationship platform. The core shift: payment happens first (Razorpay collects contact info), then post-payment account creation gives clients an authenticated portal where they can preview their site, manage domains, upload logos with AI background removal, and submit change requests. The admin side gets a fulfillment queue to process client requests and redeploy updated sites.

Six feature areas, in dependency order:

1. **Payment-first funnel update** -- Remove pre-payment forms, simplify claim page, extract contact info from Razorpay webhook. Lowest risk, modifies existing code.
2. **Post-payment account creation** -- Supabase Auth `admin.createUser()` triggered from confirmation page. Depends on webhook having email.
3. **Client portal** -- Authenticated dashboard with site preview, live URL, domain status, change requests. Depends on auth.
4. **Domain management** -- Free subdomain (auto), connect existing (DNS TXT verification), buy new (Domainr search + external purchase). Depends on portal.
5. **AI logo background removal** -- Gemini image editing API to remove logo backgrounds on upload. Independent, can be built in parallel.
6. **Admin fulfillment workflow** -- Client request queue, redeploy button, purchased clients view. Depends on client_requests table.

The audience split from v2.0 continues: client-facing pages are mobile-first (prospects on WhatsApp/email), admin pages are desktop-optimized. Non-technical business owners are the client audience -- every client-facing feature must work without technical knowledge.

---

## Category 1: Payment-First Funnel Update

**What changes:** Remove the domain selection section and all pre-payment form fields from the claim page. Razorpay collects email/phone during checkout. The webhook payload already includes `email` and `contact` fields. Move domain selection to the client portal (post-payment). Switch to USD-only pricing. Add Razorpay test/live key toggling.

**Depends on (existing):** `claim-page-client.tsx`, `claim-actions.ts`, `razorpay/route.ts` webhook handler, `claim-pricing.ts`

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Remove domain section from claim page** | v3.0 moves domain management to portal. Having it pre-payment adds friction and confusion -- the client doesn't own the site yet. | Low | Delete `DomainSection` import and rendering from `claim-page-client.tsx`. Remove `domainOption`/`domainValue` state. The `domain_option` and `domain_value` columns in `claims` table become nullable/deferred. |
| **Remove pre-payment customization forms** | Payment-first means zero forms before checkout. Razorpay collects contact info. Every field before payment is a conversion killer. | Low | Remove any contact/email/name fields that currently appear before the Razorpay modal. The only pre-payment interaction: select plan, click pay. |
| **Extract email/phone from Razorpay webhook** | The `payment.captured` webhook payload includes `email` and `contact` fields that the customer enters during Razorpay checkout. This is how we get client contact info without pre-payment forms. | Low | Already partially implemented -- `razorpay/route.ts` line 127-128 saves `client_email` and `client_phone` from `payment.email` and `payment.contact`. Verify this works with test mode. Confidence: HIGH (verified in existing code). |
| **USD-only pricing** | Simplifies payment flow. PROJECT.md specifies USD-only for v3.0. Removes GST logic, currency switching, and geo-detection complexity. | Low | Update `claim-pricing.ts`: remove INR pricing, GST calculations, currency toggle. Hardcode `currency: 'USD'`. Remove geo-detection from claim page. The pricing section already defaults to USD. |
| **Razorpay test/live mode toggle** | Cannot test payments without test mode. Currently hardcoded to one key set. Need separate test vs live API keys. | Low | Use `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` for live, `RAZORPAY_TEST_KEY_ID` / `RAZORPAY_TEST_KEY_SECRET` for test. Toggle via `RAZORPAY_MODE=test|live` env var. The Razorpay client in `lib/razorpay.ts` selects keys based on mode. Frontend uses `NEXT_PUBLIC_RAZORPAY_KEY_ID` (test) or `NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID`. Razorpay docs confirm test and live keys are completely separate and generated independently. Confidence: HIGH (verified against Razorpay docs). |
| **Premium plan "Contact Us" card** | Display-only pricing card with email CTA. Already exists in `pricing-section.tsx` with "From $3,000" and mailto link. Needs `premium_contact` analytics event. | Low | Add `trackClaimEvent('premium_contact')` on the mailto click. The card UI is already built. |
| **Updated claim page layout** | Simpler page without domain section and pre-payment forms. Flow becomes: hero preview + countdown + pricing cards + pay button. | Low | Remove sections, reorder remaining ones. The page gets shorter and more focused. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Instant checkout after plan select** | Single-tap from plan card to Razorpay modal. No intermediate summary screen. Fewer steps = higher conversion. | Low | Merge SummaryCTA into pricing cards. Plan card click opens Razorpay directly (after confirmation). |
| **Payment success animation** | Confetti or checkmark animation on the confirmation page before redirect. Creates a dopamine moment that reinforces the purchase decision. | Low | CSS animation on confirmation-client.tsx. Lottie or CSS keyframes. |
| **Smart plan recommendation based on business type** | If business data indicates high foot traffic (restaurant, salon), pre-select Pro plan since booking system is valuable. | Med | Read `business_data.category` to determine recommendation. Already have enriched business data from generation pipeline. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Pre-payment email/phone collection** | Duplicates what Razorpay collects. Adds friction. The whole point of payment-first is removing barriers. | Let Razorpay handle contact collection during checkout. Extract from webhook. |
| **INR pricing for v3.0** | PROJECT.md explicitly scopes v3.0 to USD-only. Adding multi-currency doubles the testing surface for marginal benefit. | USD-only. Revisit INR in v4.0 if needed. |
| **Domain selection before payment** | Client hasn't paid yet. Domain choice adds decision paralysis. Move to portal where they've already committed. | Domain management in client portal, post-payment. |
| **Cart/order summary page** | Extra step between plan selection and payment. Business owners on mobile don't want a shopping cart experience for a single purchase. | Direct plan-to-payment. Show selected plan + price inline on the pricing card. |

---

## Category 2: Post-Payment Account Creation

**What changes:** After payment confirmation, create a Supabase Auth account for the client using `auth.admin.createUser()`. The client gets portal access without a traditional signup flow. They never chose a password before paying -- the account is created on their behalf.

**Depends on (existing):** Razorpay webhook (for email/phone), confirmation page (`confirmed/page.tsx`)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Server-side account creation via admin API** | Use `supabase.auth.admin.createUser({ email, email_confirm: true })` with the service role key. Creates a verified account without sending a confirmation email. The client's email comes from the Razorpay webhook `payment.email` field. | Med | Call in the webhook handler after `status: 'paid'` update. Set `email_confirm: true` to skip email verification (they proved identity by paying). Store the `auth.users.id` on the claim record. Confidence: HIGH (verified against Supabase docs -- `auth.admin.createUser` is the official pattern for server-side account creation). |
| **Magic link for first portal login** | Client receives a magic link (via Supabase Auth email or manual send) to access their portal. No password to remember. Non-technical users forget passwords immediately. | Med | Use `supabase.auth.admin.generateLink({ type: 'magiclink', email })` to create a one-time login URL. Display it on the confirmation page ("Access your portal") or send via email later. Magic links expire after 1 hour by default. Confidence: HIGH (Supabase docs confirm this API). |
| **Password-optional account setup** | Let clients optionally set a password from inside the portal. Some prefer passwords; most won't bother. Magic link is the primary login. | Low | Standard Supabase Auth `updateUser({ password })` from the portal settings page. Non-blocking -- portal works fine with magic-link-only. |
| **Link auth user to claim record** | The claim record needs a `user_id` column pointing to the Supabase Auth user. This enables RLS policies and portal data access. | Low | Add `user_id` column to `claims` table. Set during account creation in webhook. All portal queries filter by authenticated user's ID. |
| **Handle duplicate emails** | If the same email pays for multiple sites (unlikely but possible), `createUser` will fail on the second attempt. Must handle gracefully. | Low | Catch the "user already exists" error. Look up existing user by email, link new claim to their existing `user_id`. Do not create a second account. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Inline portal access on confirmation page** | Instead of "check your email for a link," show a "Set up your portal" button directly on the confirmation page that signs them in immediately (using a short-lived token). Zero friction to first portal visit. | Med | Generate a session token server-side on the confirmation page. Use `supabase.auth.admin.generateLink()` and redirect. The client goes from payment confirmation to portal in one click. |
| **WhatsApp magic link delivery** | For markets where email is unreliable, send the portal link via WhatsApp. The client's WhatsApp number is in the claim record. | Med | Depends on WhatsApp Business API or a messaging service. Defer to v4.0 unless email delivery proves problematic. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Signup form before payment** | Defeats the payment-first model. If they have to create an account to pay, conversion drops dramatically. | Create account silently after payment, using Razorpay-provided email. |
| **Email verification requirement** | They just paid $499-$1,299. Requiring email verification to access their portal is insulting. They proved their identity with money. | Use `email_confirm: true` in `createUser` to auto-verify. |
| **Complex onboarding wizard** | Non-technical business owners don't want a 5-step setup wizard. They want to see their site and submit changes. | Minimal portal: site preview, domain status, change request form. That's it. |
| **Social login (Google/GitHub)** | These are local business owners, not developers. Google login adds OAuth complexity for zero benefit. Most will use magic links. | Magic link + optional password. Keep it simple. |

---

## Category 3: Client Portal

**What changes:** New `(portal)/` route group with authenticated pages. Clients see their site preview, live URL, domain status, and can submit change requests. This replaces the one-shot customization form from v2.0 with a persistent relationship hub.

**Depends on (existing):** Supabase Auth (from Category 2), `projects` table (site data), `claims` table (payment/plan info)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Authenticated dashboard** | Single page showing: site preview (iframe or screenshot), current plan, domain status, and recent requests. Protected by Supabase Auth middleware. | Med | New route: `app/(portal)/dashboard/page.tsx`. Server component fetches claim + project data for authenticated user. Use `@supabase/ssr` for auth in server components (already in stack). RLS policies on `claims` and `projects` tables scoped to `auth.uid()`. |
| **Site preview iframe** | Full-width iframe showing the client's generated website. This is the "wow factor" -- they see their actual site in the portal. | Med | Render the generated code in a sandboxed iframe. Reuse the preview pattern from `app/(client)/preview/[slug]/page.tsx` which already serves generated HTML. Add auth check to ensure only the site owner can preview. |
| **Live URL display** | Show the client their live URL (subdomain or custom domain) with a copy button and "Visit Site" link. If not yet live, show status ("Setting up..."). | Low | Read domain configuration from claim/project record. Display as a prominent link card. Status: pending, dns_verifying, live, error. |
| **Change request submission** | Single textarea where clients describe what they want changed. Text, colors, images, anything. The admin interprets and executes. This is deliberate -- no structured form, because non-technical users can't fill out structured change requests accurately. | Med | New `client_requests` table: `id, claim_id, user_id, type, content, status, created_at, resolved_at`. API route for CRUD. Client sees a textarea + optional file upload. Submit creates a request with `status: 'pending'`. |
| **Request history** | List of all submitted change requests with status (pending, in-progress, completed). Client can see what they asked for and whether it's done. | Low | Query `client_requests` for authenticated user, ordered by `created_at DESC`. Status badges: pending (yellow), in-progress (blue), completed (green). |
| **Logo upload with AI background removal** | Upload a logo image, Gemini Vision removes the background automatically, client approves the result. This solves the #1 pain point: business owners upload logos with white/colored backgrounds that look terrible on the generated site. | Med | See Category 5 for detailed breakdown. In the portal, this is a card/section with upload + preview of before/after. |
| **Booking setup (Pro plan only)** | Cal.com embed slug configuration. Client provides their Cal.com link or we set one up. | Low | Text input for Cal.com slug. Store in `projects.cal_embed_slug`. Only visible for Pro plan claims. |
| **Mobile-responsive portal** | Business owners access the portal from phones. The portal must work on 375px screens. | Med | Mobile-first design using existing Tailwind patterns. Stack layout on mobile, side-by-side on desktop. Reuse the Inter font and design language from client-facing pages. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Real-time site preview updates** | After admin redeploys, the client's portal iframe automatically updates to show the latest version without page refresh. | Med | Supabase real-time subscription on the `projects` table for the client's project. When `updated_at` changes, reload iframe. Similar pattern to admin dashboard's real-time listener. |
| **Version history visible to client** | "Your site was updated on [date]" with a list of what changed. Builds trust that work is being done. | Low | Query `revisions` table for the client's project. Display as a timeline. Admin adds a note when redeploying. |
| **Agent support payment** | $49 one-time payment for hands-on help (domain setup, logo fixes, minor edits). Shows in portal as an upsell card. | Med | Razorpay order creation for $49 via existing payment patterns. Store as a separate claim or a flag on the existing claim. Route to admin fulfillment queue. |
| **Status page for site health** | Show basic site health: uptime, last checked, SSL status. Builds confidence the site is being maintained. | High | Requires external monitoring. Defer to v4.0. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Client-side code editor** | Business owners can't edit code. A code editor in the portal would be terrifying and lead to broken sites. | Single textarea for change requests. Admin handles all code changes. |
| **Drag-and-drop page builder** | Massive engineering effort. The generated sites are static HTML -- no component system to drag and drop. | Text-based change requests. The admin edits code in the existing Monaco editor. |
| **Real-time chat with admin** | Requires always-on support infrastructure. WhatsApp already handles real-time communication. | Change request system + WhatsApp link for urgent items. |
| **Self-service domain purchase** | Integrating a registrar API (GoDaddy, Namecheap) is complex, error-prone, and adds financial liability. Out of scope per PROJECT.md. | Show domain availability via Domainr, but client buys externally and connects via DNS. |
| **PDF DNS setup guides** | PDFs are hard to maintain, can't be updated without re-downloading. | Inline text instructions in the portal, step-by-step with copy buttons for DNS values. |
| **Multi-site dashboard** | Unlikely scenario (same business owner buying multiple sites). Adds complexity for zero practical value in v3.0. | Portal shows the single site associated with their claim. If edge case arises, handle manually. |

---

## Category 4: Domain Management

**What changes:** Move domain management from pre-payment claim page to client portal. Three options: free subdomain (automatic), connect existing domain (DNS verification), buy new domain (search + external purchase). The client sees domain status and DNS verification progress in their portal.

**Depends on (existing):** Client portal (Category 3), `claims` table (`domain_option`, `domain_value` columns)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Free subdomain (auto-provisioned)** | Every client gets `{business-slug}.flogen.site` by default. No configuration needed. This is the "zero friction" option. | Low | Generate subdomain from business name slug (existing `slugify()` function in `domain-section.tsx`). Store in claim record. Display in portal immediately after payment. No DNS configuration needed -- admin sets up a wildcard DNS for `*.flogen.site`. |
| **Connect existing domain (DNS TXT verification)** | Client enters their domain, gets a TXT record to add at their registrar. Portal checks verification status. This is the standard SaaS pattern -- TXT records are preferred over CNAME because they don't interfere with existing services and multiple TXT records can coexist. | High | Generate a unique verification token: `flogen-verify={random_string}`. Client adds TXT record at `_flogen.theirdomain.com`. Portal polls DNS to check for the record. Status flow: `pending -> verifying -> verified -> live / failed`. Use `dns.resolveTxt()` in Node.js to check. Confidence: MEDIUM (DNS verification is well-established, but the UX for non-technical users requires careful step-by-step instructions). |
| **DNS verification instructions** | Step-by-step text instructions tailored to common registrars (GoDaddy, Namecheap, Google Domains, Cloudflare). Must be copy-paste friendly with actual values pre-filled. | Med | Static text content with dynamic values (the TXT record name and value). Copy-to-clipboard buttons for each value. Registrar-specific screenshots or links to their DNS management pages. |
| **Domain status display** | Show current domain state in the portal: "Using free subdomain", "DNS verification pending -- add this TXT record", "Domain verified -- going live", "Domain active". | Low | Read domain status from claim/project record. Render as a status card with color-coded badge. Include the subdomain as a fallback ("Your site is also available at {slug}.flogen.site"). |
| **Domain availability search (Domainr API)** | Client can search for available domains before buying externally. Domainr API (now Fastly) provides instant availability checks. Free tier: 10,000 lookups/month via RapidAPI. | Med | API route: `POST /api/domains/search` that proxies to Domainr `/v2/search` and `/v2/status`. Client-side debounced input. Show availability status and register URL (links to external registrar). Confidence: MEDIUM (Domainr API is deprecated in favor of Fastly API, but still functional via RapidAPI. Free tier is 10,000/month which is more than enough). |
| **AI domain suggestions** | Given the business name, suggest relevant domain names. "Patel Dental Clinic" -> `pateldental.com`, `pateldentalclinic.com`, `drpatel.dental`. | Low | Generate 5-10 suggestions from business name permutations (no AI needed -- string manipulation). Check availability via Domainr. Display as a list with status badges. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-detection of DNS propagation** | Instead of making the client click "Verify" repeatedly, poll DNS every 5 minutes and notify when verification succeeds. | Med | Background job (or cron via Vercel) that checks pending verifications. Update status in DB. Client portal shows real-time status via Supabase subscription. |
| **Registrar-specific instructions with deep links** | Instead of generic "go to your DNS settings," detect the registrar from WHOIS data and show specific instructions with direct links to their DNS management page. | High | Requires WHOIS lookup integration. Defer to v4.0. For v3.0, show generic instructions with the top 4-5 registrars as tabs. |
| **Domain health check post-connection** | After domain is connected, verify SSL, A record, and CNAME are all correct. Show a green checkmark when everything is healthy. | Med | After DNS verification passes, check A/CNAME records point to the right IP/hostname. Report any misconfiguration. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **In-app domain purchase** | Registrar API integration adds financial liability, error handling for failed purchases, refund logic, and support burden. Explicitly out of scope per PROJECT.md. | Show availability + link to external registrar. Client buys themselves, then connects in portal. |
| **Automated DNS configuration** | Setting DNS records on behalf of clients requires registrar API access. Too many registrars to support. Out of scope. | Provide copy-paste TXT record values and step-by-step instructions. Admin handles final hosting setup manually. |
| **CNAME verification** | CNAME records can only have one value per hostname, which means they can conflict with existing records. TXT records are non-destructive and the industry standard for domain verification. | Use TXT record verification only. |
| **Email-based domain verification** | Requires sending email to `admin@theirdomain.com` and hoping someone checks it. Business owners often don't have domain email set up. | DNS TXT verification is more reliable and doesn't depend on email infrastructure. |

---

## Category 5: AI Logo Background Removal

**What changes:** When a client uploads their logo in the portal (or during post-payment customization), Gemini Vision API automatically removes the background. Client sees before/after and approves the result. This solves the universal pain point: business logos photographed on colored backgrounds, scanned from business cards, or exported with white backgrounds that clash with the generated site.

**Depends on (existing):** Logo upload component (`logo-upload.tsx`), Supabase Storage upload API (`/api/uploads`), Google Gemini API key (already in stack)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Upload logo and auto-process** | Client uploads PNG/JPG/WebP logo. Server sends to Gemini API with prompt "Remove the background from this logo, make it transparent, keep the logo subject exactly as is." Returns processed PNG with transparent background. | Med | API route: `POST /api/logos/process`. Accepts uploaded image, converts to base64, sends to Gemini 2.5 Flash Image (or 3.1 Flash Image Preview) with `responseModalities: ['IMAGE']`. Gemini returns base64 PNG. Save both original and processed to Supabase Storage. Confidence: MEDIUM (Gemini image editing works for bg removal per multiple sources, but quality varies -- need fallback). Model: `gemini-2.5-flash-image` or newer. |
| **Before/after preview** | Side-by-side or toggle view showing original upload vs. background-removed version. Client must approve before the processed version is used. | Low | Two `<img>` tags with a toggle or slider. Checkerboard background behind the processed image to show transparency. Approval button saves the selection to the request record. |
| **Fallback for failed processing** | Gemini may fail (safety filters, complex logos, API errors). Must handle gracefully -- use the original upload and flag for admin manual processing. | Low | Catch API errors. If processing fails, save the original and create a `client_request` with type `logo_processing_failed`. Admin processes manually in Photoshop/Figma. Notify client: "We'll process your logo manually." |
| **File size and format validation** | Same as existing: PNG/JPG/WebP, max 5MB. Reject SVG (XSS risk, already a project convention). | Low | Already implemented in `logo-upload.tsx` lines 24-30. Reuse the same validation. |
| **Transparent PNG output** | The processed logo must be a PNG with alpha channel (transparent background). Other formats don't support transparency. | Low | Ensure Gemini response is saved as PNG regardless of input format. The API returns base64 image data that can be decoded and saved as PNG. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Color-aware background detection** | If the logo background is a solid color (white, light gray), use simpler processing. If complex (photographed on a desk, scanned), use more aggressive prompting. | Med | Analyze the image histogram before sending to Gemini. Adjust the prompt based on detected background complexity. Or just use a good universal prompt -- Gemini handles most cases. |
| **Manual crop/reposition** | Let the client crop or reposition the logo after background removal. Sometimes the AI trims too aggressively. | Med | Canvas-based crop tool. Increases engineering effort. Defer to v4.0 unless demand is high. |
| **Multi-logo support** | Client can upload multiple logo variants (horizontal, square, icon-only) and select which to use where. | Low | Array of logo URLs instead of single URL. UI shows thumbnails with "use for header" / "use for favicon" labels. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time background removal in browser** | Client-side AI processing is slow, unreliable, and eats mobile battery. Server-side is faster and more consistent. | Server-side Gemini API processing. Show a loading spinner for 3-5 seconds. |
| **SVG output** | SVG conversion from raster logos is unreliable and creates vector artifacts. SVGs are also an XSS vector (project convention: reject SVGs). | PNG with transparency. Always. |
| **Automatic logo placement without approval** | The AI result may be imperfect (edge artifacts, partial removal). Using it without client approval leads to complaints. | Always show before/after and require explicit approval. |
| **Complex editing tools (levels, curves, color adjustment)** | Business owners don't know what levels and curves are. This is not Photoshop. | Simple: upload, auto-process, approve or reject. If rejected, admin handles manually. |

---

## Category 6: Admin Fulfillment Workflow

**What changes:** Admin dashboard gets a new section for managing purchased clients: viewing their requests, processing changes, and redeploying updated sites. This is the operator's workflow for delivering on paid orders.

**Depends on (existing):** Admin dashboard (`app/(admin)/dashboard/`), editor (`app/(admin)/editor/`), `projects` table, `revisions` table, existing redeploy/revision system

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **Purchased clients list** | Admin view showing all paid claims with client name, email, plan, payment date, site status, and pending request count. Sortable/filterable. | Med | New admin page: `app/(admin)/dashboard/clients/page.tsx`. Server component querying `claims` joined with `projects` and `client_requests`. Filter by status (all, pending requests, in-progress, completed). |
| **Client request queue** | List of all pending `client_requests` across all clients. Admin can claim, process, and resolve requests. Shows request content, attached files, and client info. | Med | New admin page: `app/(admin)/dashboard/requests/page.tsx`. Query `client_requests` with `status: 'pending'` ordered by `created_at ASC` (FIFO). Each request card shows client name, request text, attached images, and action buttons. |
| **Request status management** | Admin marks requests as in-progress when working on them, and completed when done. Client sees status updates in their portal. | Low | Status enum: `pending -> in_progress -> completed -> rejected`. Server action to update status. Optional admin note when completing ("Changed headline text, updated contact phone"). |
| **Redeploy button** | After editing a client's site in the Monaco editor, admin clicks "Redeploy" to publish the latest code. This saves a new revision, increments the version, and makes the updated code live. | Med | Server action: `redeployProject(projectId)`. Steps: save current editor code as new revision in `revisions` table, update `projects.generated_code` and `projects.updated_at`, invalidate any CDN cache. The existing revision system already handles versioning -- this is a one-click wrapper. |
| **Client detail view** | Admin clicks a client in the list to see their full profile: claim details, payment info, all requests, site preview, domain status, and an "Open in Editor" button. | Med | New admin page: `app/(admin)/dashboard/clients/[claimId]/page.tsx`. Server component fetching all related data. Links to editor with the project pre-loaded. |
| **CRUD API for client requests** | REST endpoints for creating, reading, updating, and listing client requests. Used by both portal (create/read) and admin (read/update). | Med | API routes: `POST /api/client-requests` (create), `GET /api/client-requests` (list, filtered by user or admin), `PATCH /api/client-requests/[id]` (update status/notes). Zod validation on all inputs. RLS: clients see only their own requests, admin sees all. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Batch redeploy** | Redeploy multiple sites at once after making similar changes (e.g., updating a footer template across all sites). | Med | Select multiple projects, click "Redeploy All." Reuses the queue system from v1.0 batch pipeline. |
| **Request templates** | Pre-defined request types with guided inputs: "Change phone number" (phone input), "Update hours" (hours grid), "Add photos" (file upload). Reduces ambiguity in freeform requests. | Med | Typed request system with optional structured fields. But keep the single textarea as the primary input -- templates are shortcuts, not requirements. |
| **Time tracking per request** | Admin logs time spent on each request. Useful for pricing decisions and identifying high-maintenance clients. | Low | `time_spent_minutes` column on `client_requests`. Admin enters manually when completing a request. |
| **Client notification on completion** | When admin completes a request, send a notification (email or WhatsApp) to the client. | Med | Depends on email service (deferred per PROJECT.md). For v3.0, the client sees status updates in portal. Email notifications in v4.0 via Instantly AI. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-deployment to custom domains** | Deploying to arbitrary domains requires DNS management, SSL provisioning, and hosting orchestration. Explicitly out of scope. | Admin manually configures hosting after domain verification. Redeploy updates the code in the database; deployment to hosting is a separate manual step. |
| **Client-facing real-time chat** | Requires WebSocket infrastructure, always-on support, and response time commitments. | Client submits requests; admin processes asynchronously. WhatsApp for urgent matters. |
| **Automated change application** | Using AI to interpret freeform requests and automatically edit code is unreliable and risks breaking sites. | Admin reads the request, manually edits in Monaco editor, and redeploys. The human in the loop ensures quality. |
| **SLA timers / escalation** | Single operator doesn't need SLA management. Adds complexity for no benefit. | Simple FIFO queue with manual prioritization. |

---

## Feature Dependencies

```
Payment-first funnel (Cat 1) ---> independent, modify existing code
                                     |
Post-payment auth (Cat 2) ----------+ depends on webhook having email
                                     |
Client portal (Cat 3) --------------+ depends on Supabase Auth
     |                               |
     +-- Domain management (Cat 4)   |
     +-- Logo bg removal (Cat 5) ----+ independent, can parallel with Cat 3
     +-- Change requests             |
                                     |
Admin fulfillment (Cat 6) ----------+ depends on client_requests table
     +-- Redeploy button             + depends on existing editor/revision system
```

Key dependency chain: Payment-first -> Auth -> Portal -> Domain/Logo/Requests -> Admin fulfillment

AI logo background removal (Cat 5) is the most independent feature -- it can be built and tested in isolation since it only needs an image input and Gemini API access.

---

## MVP Recommendation

**Build in this order:**

1. **Payment-first funnel update** (Cat 1) -- Lowest risk. Simplifies existing code. Immediately testable.
2. **Post-payment account creation** (Cat 2) -- Foundation for everything else. Small surface area.
3. **AI logo background removal** (Cat 5) -- Independent. High-impact UX improvement. Can be built in parallel with portal.
4. **Client portal with change requests** (Cat 3) -- Core new feature. Depends on auth.
5. **Domain management** (Cat 4) -- Complex DNS verification UX. Needs careful testing with real domains.
6. **Admin fulfillment workflow** (Cat 6) -- Builds on all the above. The admin queue only has value once clients are submitting requests.

**Defer to v4.0:**
- WhatsApp magic link delivery
- Registrar-specific DNS instructions with deep links
- Site health monitoring / status page
- Email notifications (will use Instantly AI)
- Batch redeploy across multiple sites
- Manual logo crop/reposition tool
- Client notification on request completion (email)

---

## New Database Schema Requirements

| Table/Column | Purpose | Category |
|---|---|---|
| `client_requests` table | Central request queue for all client submissions | Cat 3, 6 |
| `claims.user_id` column | Link claim to Supabase Auth user | Cat 2 |
| `claims.domain_status` column | Track domain verification state | Cat 4 |
| `claims.domain_verification_token` column | TXT record verification token | Cat 4 |
| `projects.cal_embed_slug` column | Cal.com booking slug for Pro plan | Cat 3 |
| `projects.live_url` column | The deployed URL of the site | Cat 3 |
| `projects.deploy_version` column | Integer version counter for redeploys | Cat 6 |

---

## Complexity Summary

| Category | Table Stakes Complexity | Total Features | Risk Level |
|----------|------------------------|----------------|------------|
| 1. Payment-first funnel | Low | 7 table stakes, 3 differentiators | Low -- modifying existing code |
| 2. Post-payment auth | Med | 5 table stakes, 2 differentiators | Low -- well-documented Supabase APIs |
| 3. Client portal | Med | 8 table stakes, 3 differentiators | Med -- new route group, auth middleware, RLS |
| 4. Domain management | Med-High | 6 table stakes, 3 differentiators | High -- DNS verification UX for non-technical users |
| 5. AI logo bg removal | Med | 5 table stakes, 3 differentiators | Med -- Gemini API quality varies |
| 6. Admin fulfillment | Med | 6 table stakes, 4 differentiators | Low -- extends existing admin patterns |

---

## Sources

### Verified (HIGH confidence)
- [Supabase Auth admin.createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) -- Server-side account creation API
- [Supabase Magic Link Auth](https://supabase.com/docs/guides/auth/auth-email-passwordless) -- Passwordless login via magic links
- [Razorpay Standard Checkout Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) -- Prefill and customer data capture
- [Razorpay Test/Live Modes](https://razorpay.com/docs/payments/dashboard/test-live-modes/) -- Separate API keys for test and live
- [Razorpay Payment Webhooks](https://razorpay.com/docs/webhooks/payloads/payments/) -- Webhook payload includes email and contact fields
- [Gemini Image Generation/Editing API](https://ai.google.dev/gemini-api/docs/image-generation) -- Image editing with prompt-based approach
- [Gemini Image Editing Next.js Quickstart](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) -- Reference implementation

### Verified (MEDIUM confidence)
- [Domainr API (deprecated, via RapidAPI)](https://domainr.com/docs/api) -- Domain search and availability, 10K free lookups/month
- [DNS TXT vs CNAME Verification](https://www.namesilo.com/blog/en/dns/custom-domains-in-saas-txt-vs-cname-verification-and-when-to-use-each) -- TXT preferred for SaaS domain verification
- [Gemini Background Removal Approaches](https://blog.laozhang.ai/en/posts/gemini-image-background-change) -- 7 methods, tested March 2026
- [Client Portal Best Practices](https://www.agencyhandy.com/client-portal-for-design-agencies/) -- Design agency portal feature expectations

### Industry context (LOW confidence -- informational only)
- [SaaS Signup Flow UX](https://userpilot.com/blog/saas-signup-flow/) -- Minimal friction patterns
- [Client Portal Software Guide](https://www.weweb.io/blog/client-portal-software) -- Market landscape
- [Order Fulfillment Dashboard Patterns](https://www.blaze.tech/post/order-fulfillment-dashboard) -- Admin workflow design

---
*Features research: 2026-03-25*
*Scope: v3.0 Client Portal & Updated Funnel*
