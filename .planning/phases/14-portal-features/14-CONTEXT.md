# Phase 14: Portal Features - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

All client-facing portal feature pages: change requests (textarea + file upload + history), domain management (subdomain, connect existing with DNS verification, buy new with AI suggestions), logo upload with Gemini Vision background removal, and $49 agent support payment. Cal.com booking setup is handled manually by admin — no in-portal UI needed. One page per nav item: Dashboard (Phase 13), Domain, Customize, Support.

</domain>

<decisions>
## Implementation Decisions

### Change Request UX
- After submit, redirect to request history showing new request at top with "pending" badge
- File attachments: images (PNG/JPG/WebP) + PDFs allowed
- 5MB per file, max 3 files per request
- Unlimited concurrent requests until site goes completely live
- Request history: expandable cards — type + date + status visible, click/tap to expand full content + file previews

### Domain Management Flow
- 3-column grid with icon cards: "Free Subdomain" | "Connect Existing Domain" | "Buy New Domain"
- Stacks to single column on mobile
- DNS verification instructions: registrar-aware steps (detect or ask which registrar, show specific step-by-step for GoDaddy, Namecheap, Cloudflare, Google Domains, Hostinger)
- AI domain suggestions: show ALL available (up to 15) from the batch check, not capped at 5-8. Second AI round if <3 available.
- $49 agent domain setup appears on "Connect existing" and "Buy new" paths (not on free subdomain)

### Logo Background Removal
- Side-by-side before/after preview (original left, processed right)
- If Gemini fails: show message "Background removal failed. Our agents will do this manually." — auto-creates agent request
- Client always has "Use original" button to skip background removal entirely
- Background removal prompt only when background is detected (transparent PNGs skip)

### Payments & Booking
- $49 agent support: floating "Need help?" button persistent across all portal sections, PLUS inline CTAs in logo, domain connect, and domain buy sections
- After $49 payment: confirmation + contact info + auto-created client_request of type 'agent_call' (Claude's discretion on exact flow)
- Cal.com booking: NO in-portal UI — admin sets up Cal.com manually during onboarding call, updates cal_embed_slug via admin dashboard. LOGO-04 requirement is fulfilled by the admin manually updating the column, not a client-facing form.

### Portal Page Structure
- One page per nav item: Dashboard (Phase 13, done), Domain (/portal/domain), Customize (/portal/customize), Support (/portal/support)
- Customize page contains: logo upload section + change request form + request history
- Domain page contains: 3-card grid + active domain status + DNS verification flow
- Support page contains: agent payment CTA + contact info (WhatsApp + email) + FAQ or help text

### Claude's Discretion
- Registrar detection method (WHOIS lookup vs manual dropdown vs common registrar buttons)
- $49 agent payment post-success flow details
- Floating "Need help?" button style and position
- Domain availability search debounce timing
- DNS polling interval and max attempts
- How expandable request cards animate

</decisions>

<specifics>
## Specific Ideas

- "Background removal failed. Our agents will do this manually." — specific failure message, auto-creates agent_call request so admin sees it
- Registrar-aware DNS steps are important — these are business owners who've never touched DNS. "In GoDaddy: DNS Management → Add Record → TXT" is the level of detail needed.
- Unlimited requests until live — no artificial gating. The admin fulfills requests as they come.
- Floating "Need help?" button makes agent support discoverable from anywhere without cluttering each section's UI

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-portal-features*
*Context gathered: 2026-03-25*
