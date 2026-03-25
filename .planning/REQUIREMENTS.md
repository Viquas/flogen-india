# Requirements: Flogen -- Somosite Agency Landing Page

**Defined:** 2026-03-25
**Core Value:** Convince cold email recipients that Somosite is a real, professional agency worth paying $499-$1,299 for a website. Satisfy Razorpay verification requirements.

## v4.0 Requirements

### Routing & Layout

- [ ] **ROUTE-01**: Root route (/) serves agency landing page instead of /dashboard redirect
- [ ] **ROUTE-02**: (marketing) route group with isolated layout, own font stack, own styles
- [ ] **ROUTE-03**: All existing routes (/dashboard, /claim/*, /preview/*, /portal/*) continue working unchanged

### Design System

- [ ] **DLS-01**: Linear-inspired dark design: #0A0A0A primary bg, #FAFAFA alternating sections, #AF92FF accent
- [ ] **DLS-02**: Premium serif heading font (DM Serif Display or Outfit) + Inter 16px body via next/font
- [ ] **DLS-03**: Scroll-triggered fade-in/slide-up animations via IntersectionObserver (CSS only, 600-800ms ease-out)
- [ ] **DLS-04**: Hand-coded components -- no shadcn/ui, Radix, or new UI library imports
- [ ] **DLS-05**: All marketing copy centralized in lib/marketing-constants.ts

### Page Sections

- [ ] **PAGE-01**: Navigation bar -- sticky, transparent-to-solid on scroll, smooth anchor links, mobile hamburger
- [ ] **PAGE-02**: Hero section -- headline, subheadline, dual CTAs, browser mockup visual with float effect
- [ ] **PAGE-03**: Trust bar -- 4 credibility signals with Lucide icons
- [ ] **PAGE-04**: Problem section -- empathetic copy, centered, generous whitespace
- [ ] **PAGE-05**: How It Works -- 3-step cards with icons, connecting lines, vertical timeline on mobile
- [ ] **PAGE-06**: Portfolio -- 6 demo site placeholder screenshots in browser mockup frames with "View Demo" links
- [ ] **PAGE-07**: Benefits -- outcome-focused differentiators, alternating left-right or 2-column grid
- [ ] **PAGE-08**: Pricing -- 3-tier cards (Standard $499, Pro $1,299, Premium custom), Pro highlighted as "Most Popular"
- [ ] **PAGE-09**: FAQ -- accordion with 7 objection-handling questions
- [ ] **PAGE-10**: Final CTA -- dark background, urgency copy, primary + secondary CTAs
- [ ] **PAGE-11**: Contact form -- name, email, business name (optional), message; POST /api/contact sends email
- [ ] **PAGE-12**: Footer -- 4 columns (Company, Product, Legal, Trust), payment badges, copyright

### Legal & Compliance

- [ ] **LEGAL-01**: Privacy policy page at /privacy with data collection, GDPR, cookies
- [ ] **LEGAL-02**: Terms of service page at /terms
- [ ] **LEGAL-03**: Refund policy page at /refund with 30-day guarantee terms
- [ ] **LEGAL-04**: Cookie consent banner with Accept/Decline, localStorage persistence

### Infrastructure

- [ ] **INFRA-01**: POST /api/contact route using existing nodemailer/Gmail SMTP setup
- [ ] **INFRA-02**: SEO metadata: title, description, OG image, canonical URL in (marketing) layout
- [ ] **INFRA-03**: PageSpeed 95+ on mobile and desktop (optimized images, minimal JS, next/image)
- [ ] **INFRA-04**: Mobile-first responsive at 375px, 640px, 1024px breakpoints

## Future Requirements

### Outreach Integration
- **OUT-01**: Demo portfolio sites generated from Flogen (6 fictional businesses with real screenshots)
- **OUT-02**: Mobile sticky CTA bar after scrolling past hero
- **OUT-03**: Blog/resource center
- **OUT-04**: Chat widget

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing on landing page | Payments happen on /claim/[slug], not agency page |
| CMS for landing page content | Copy lives in marketing-constants.ts, operator edits code |
| Dark mode toggle | Single dark theme, no toggle needed |
| New UI component library (shadcn/Radix) | Hand-coded for minimal bundle; landing page is isolated |
| Modifications to existing Flogen components | Landing page is isolated in (marketing) route group |
| Real client testimonials | No clients at launch; demo portfolio serves as proof |
| Animation libraries (GSAP/Framer Motion/Lottie) | CSS transitions only for performance |
| Saying "AI" anywhere on the page | 44% negative brand perception -- premium positioning collapses |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROUTE-01 | Phase 16 | Pending |
| ROUTE-02 | Phase 16 | Pending |
| ROUTE-03 | Phase 16 | Pending |
| DLS-01 | Phase 16 | Pending |
| DLS-02 | Phase 16 | Pending |
| DLS-03 | Phase 17 | Pending |
| DLS-04 | Phase 16 | Pending |
| DLS-05 | Phase 16 | Pending |
| PAGE-01 | Phase 17 | Pending |
| PAGE-02 | Phase 17 | Pending |
| PAGE-03 | Phase 17 | Pending |
| PAGE-04 | Phase 17 | Pending |
| PAGE-05 | Phase 18 | Pending |
| PAGE-06 | Phase 18 | Pending |
| PAGE-07 | Phase 18 | Pending |
| PAGE-08 | Phase 19 | Pending |
| PAGE-09 | Phase 19 | Pending |
| PAGE-10 | Phase 19 | Pending |
| PAGE-11 | Phase 20 | Pending |
| PAGE-12 | Phase 20 | Pending |
| LEGAL-01 | Phase 20 | Pending |
| LEGAL-02 | Phase 20 | Pending |
| LEGAL-03 | Phase 20 | Pending |
| LEGAL-04 | Phase 20 | Pending |
| INFRA-01 | Phase 20 | Pending |
| INFRA-02 | Phase 20 | Pending |
| INFRA-03 | Phase 20 | Pending |
| INFRA-04 | Phase 16 | Pending |

**Coverage:**
- v4.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation -- all 28 requirements mapped to phases 16-20*
