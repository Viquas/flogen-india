# Phase 20: Contact, Footer, Legal & Polish - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (somosite-prd-v1.1.docx)

<domain>
## Phase Boundary

This is the final phase — it completes the landing page and makes it production-ready:
- Contact form component + POST /api/contact email handler
- Footer component (4 columns)
- 3 legal pages (privacy, terms, refund)
- Cookie consent banner
- SEO metadata (title, description, OG image, canonical)
- PageSpeed optimization (95+ target)

After this phase, the landing page is launch-ready.

</domain>

<decisions>
## Implementation Decisions

### Contact Form (LOCKED from PRD §3.11)
- Fields: Name, Email, Business Name (optional), Message
- Submit button: "Send Message"
- On submit: POST /api/contact sends email to sohailminimalist@gmail.com
- Success toast: "Thanks! We'll get back to you within 24 hours."
- Microcopy below form: "No spam, ever. We typically respond within a few hours."
- Use the existing nodemailer/Gmail SMTP setup already in the codebase (used for preview emails)
- Reuse the SMTP config (SMTP_USER, SMTP_PASS env vars)
- CONTACT_EMAIL env var for destination (sohailminimalist@gmail.com)
- Error handling: show error message near form, don't lose user input
- Section heading: "Get In Touch" or "Contact Us"

### Footer (LOCKED from PRD §3.12)
- Column 1 — Company:
  - Somosite logo
  - "Custom websites built from real business data."
  - Email: hello@somosite.com
  - Location: Bangalore, India
- Column 2 — Product:
  - How It Works (anchor #how-it-works)
  - Our Work (anchor #portfolio)
  - Pricing (anchor #pricing)
  - FAQ (anchor #faq)
  - Client Portal (link to /portal)
- Column 3 — Legal:
  - Privacy Policy (/privacy)
  - Terms of Service (/terms)
  - Refund Policy (/refund)
- Column 4 — Trust:
  - Payment method logos (Visa, Mastercard) — text-based or simple SVG
  - "30-Day Satisfaction Guarantee" badge
  - SSL/Secure badge
- Bottom bar: "© 2026 Somosite. All rights reserved."

### Legal Pages (LOCKED from PRD §8)
- /privacy — Privacy Policy: data collection, GDPR rights, cookies, contact for data requests
- /terms — Terms of Service: service description, payment terms, refund policy, IP, liability
- /refund — Refund Policy: 30-day guarantee terms, process for requesting refund
- All pages under (marketing) route group, inheriting the dark layout
- Properly formatted with headings, paragraphs, last-updated date
- Real legal content (not placeholder lorem ipsum)

### Cookie Consent (LOCKED from PRD §8)
- Minimal banner at bottom of page
- "We use cookies to improve your experience." Accept/Decline buttons
- No pre-ticked boxes
- Preference stored in localStorage
- Does not reappear after choice is made

### SEO Metadata (LOCKED from PRD §6.1)
- Title: "Somosite — Custom Websites Built From Your Real Business Data"
- Description: "Professional websites for small businesses. Built from your actual business data — no templates, no stock content. Starting at $499. Ready in days."
- OG image: placeholder for now (can reference public/marketing/og.png path)
- Canonical: https://somosite.com

### Performance (LOCKED from PRD §6.2)
- PageSpeed: 95+ mobile and desktop
- LCP under 2.5s, FID under 100ms, CLS under 0.1
- All images via next/image with WebP and lazy loading
- Minimal JS — mostly-static page
- Ensure no unnecessary client-side JS bundles

### Design Rules
- Contact form on dark background section
- Footer on dark background, separated by subtle border-top
- Legal pages: dark background, readable text, max-w-3xl centered
- Cookie banner: fixed bottom, subtle, doesn't block content
- All new components use --mkt-* tokens and useScrollAnimation where appropriate

### Claude's Discretion
- Exact email template formatting for the contact form submission
- Cookie banner positioning and animation (slide-up vs fade-in)
- Legal page content structure (how to organize sections within each legal page)
- Whether to create a shared legal page layout or inline styles
- OG image: can be a simple placeholder or skip if no image asset available

</decisions>

<specifics>
## Specific Ideas

### Existing SMTP Setup
- The codebase already has nodemailer configured for preview email sending
- Check `lib/email.ts` or similar for existing transport configuration
- Reuse the same SMTP transport — don't create a new one

### Contact Form UX
- Disable submit button during send, show spinner
- Clear form on success
- Keep form data on error (don't lose user input)
- Basic validation: name and email required, email format check

### Legal Page Content
- Write real, professional legal content (not AI-sounding boilerplate)
- Keep language clear and accessible
- Include Somosite-specific terms (pricing, refund window, service description)
- Add "Last updated: March 2026" footer on each page

</specifics>

<deferred>
## Deferred Ideas

- Real OG image design (use placeholder path for now)
- Blog/resource center
- Chat widget
- Email notifications via Instantly AI

</deferred>

---

*Phase: 20-contact-footer-legal-polish*
*Context gathered: 2026-03-26 via PRD Express Path*
