# Phase 19: Pricing, FAQ & Final CTA - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (somosite-prd-v1.1.docx)

<domain>
## Phase Boundary

This phase builds the 3 conversion sections of the landing page:
- Pricing (3-tier cards)
- FAQ (7-question accordion)
- Final CTA (urgency-driven)

All components go in `components/marketing/`. Copy reads from `lib/marketing-constants.ts`. Page shell updated to replace inline placeholders. All sections use useScrollAnimation.

</domain>

<decisions>
## Implementation Decisions

### Pricing Section (LOCKED from PRD §3.8)
- Anchoring statement above cards: "Traditional web design agencies charge $3,000-$10,000 and take 8-12 weeks. We eliminated the overhead — not the quality."
- Three-tier cards:

**Standard — $499**
- Custom website built from your business data
- Mobile-responsive design
- SEO-ready structure
- Free subdomain (yourname.somosite.com)
- Custom domain setup support
- 30-day satisfaction guarantee
- CTA: "Get Started"

**Pro — $1,299 ("Most Popular" badge)**
- Everything in Standard
- Online booking system integration
- Priority delivery
- Onboarding call with our team
- Advanced customization support
- CTA: "Get Started"

**Premium — Custom**
- Enterprise-level websites
- Custom integrations
- Dedicated support
- CTA: "Contact Us" (scrolls to contact form)

- Pro card visually elevated: larger, different background, "Most Popular" badge, subtle shadow
- "30-Day Satisfaction Guarantee" badge below all cards
- "No hidden fees. One-time payment. You own everything." below the cards
- These are ONE-TIME payments. Do NOT show monthly pricing
- Payment badges (Visa, Mastercard) near pricing
- "Get Started" buttons on Standard and Pro scroll to contact form (NOT payment)
- "Contact Us" on Premium scrolls to contact form
- On mobile: single column, Pro card first (most popular)

### FAQ Section (LOCKED from PRD §3.9)
- Accordion-style, 7 questions
- Only one open at a time

| Question | Answer Direction |
|----------|-----------------|
| How is this different from Wix or Squarespace? | DIY tools where you build from templates. We research your business and build a custom site for you. The result looks like a $5,000 agency site, not a template. |
| What if I don't like the design? | Request changes before going live. 30-day satisfaction guarantee. |
| Do I own my website? | Yes. 100% ownership. Your code, your domain, your content. No lock-in. |
| Are there recurring costs? | One-time purchase. Only recurring cost is domain registration (~$10-15/year) if you want a custom domain. |
| How do you know about my business? | We research using publicly available info — services, location, reviews, photos. Your website reflects your actual business, not generic content. |
| How long does it take? | Preview ready in a few days. Live within 48 hours after approval. |
| Can I upgrade later? | Yes. Standard clients can upgrade to Pro anytime. We apply the difference. |

### Final CTA Section (LOCKED from PRD §3.10)
- Dark background section, centered text
- Headline: "Ready to see what we can build for your business?"
- Subheadline: "Join hundreds of businesses that went from invisible to professional in days."
- Primary CTA: "Get Your Website" — large, high-contrast (#AF92FF)
- Secondary: "Or contact us to discuss your project"
- Scarcity: "We take on a limited number of clients each month."

### Design Rules
- All components use --mkt-* CSS custom properties
- Pricing section on light/alt background for contrast
- FAQ on dark background
- Final CTA on dark background with distinct treatment
- Accordion animation: smooth CSS transition for height, 300ms ease-out
- Card hover: scale(1.02) + shadow increase
- All sections use useScrollAnimation
- No shadcn/ui, no Radix — hand-coded accordion

### Claude's Discretion
- Accordion implementation approach (CSS max-height transition vs JS height measurement)
- Whether Pro card uses a different background color or border treatment
- Payment badge visual treatment (SVG icons vs text)
- Exact responsive breakpoint behavior for pricing cards
- FAQ chevron/arrow animation on open/close

</decisions>

<specifics>
## Specific Ideas

### Pricing Card Design
- Pro card should stand out: slightly larger, #AF92FF border or glow, "Most Popular" badge top-right
- Standard and Premium have subtle borders (rgba(255,255,255,0.06))
- Feature list with checkmark icons per item

### FAQ Accordion
- Chevron rotates 180° on open (CSS transform)
- Answer text fades in while expanding
- Only one question open at a time (close others when opening new)

### Final CTA
- Could use a subtle gradient or pattern background to differentiate from other dark sections
- Larger text treatment than other sections for the headline

</specifics>

<deferred>
## Deferred Ideas

- Contact form and email handler (Phase 20)
- Footer (Phase 20)
- Legal pages (Phase 20)
- Cookie consent (Phase 20)
- SEO optimization (Phase 20)

</deferred>

---

*Phase: 19-pricing-faq-final-cta*
*Context gathered: 2026-03-26 via PRD Express Path*
