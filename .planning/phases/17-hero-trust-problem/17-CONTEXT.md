# Phase 17: Hero, Trust & Problem - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (somosite-prd-v1.1.docx) + Linear DLS Reference Export

<domain>
## Phase Boundary

This phase builds the top 4 visible sections of the landing page plus the scroll animation system:
- Navigation bar (sticky, transparent-to-solid, hamburger mobile)
- Hero section (headline, subheadline, CTAs, browser mockup)
- Trust bar (4 credibility signals)
- Problem section (empathetic copy)
- Scroll-triggered animations (IntersectionObserver, CSS only)

All components go in `components/marketing/`. All copy reads from `lib/marketing-constants.ts` (created in Phase 16). Page shell in `app/(marketing)/page.tsx` gets updated to import and render these components.

</domain>

<decisions>
## Implementation Decisions

### Navigation Bar (LOCKED from PRD §3.1)
- Fixed/sticky top nav
- Transparent over hero, becomes solid with backdrop-blur on scroll (backdrop-filter: blur(16px) per Linear DLS)
- Left: Somosite logo (clean sans-serif wordmark — text-based, not image)
- Center/Right: How It Works, Our Work, Pricing, FAQ (smooth scroll anchor links)
- Far right: "Contact Us" button (primary CTA style, scrolls to contact form)
- On scroll past hero: solid background (#0A0A0A with 95% opacity) with subtle box-shadow
- Mobile: hamburger menu with slide-out panel. Logo + hamburger only
- Active section highlighting via IntersectionObserver
- All nav items read from MARKETING constants

### Hero Section (LOCKED from PRD §3.2)
- Headline: "A professional website built from your real business data" — large display font (DM Serif Display), 48-64px desktop, 32-40px mobile
- Subheadline: "We research your actual business — your services, reviews, and market — then build a custom website designed to convert visitors into customers. No templates. No stock content. Ready in days."
- Primary CTA: "See Our Work" (scrolls to portfolio section) — large, high-contrast, #AF92FF bg
- Secondary: "View Pricing" (text link style, scrolls to pricing)
- Trust signal below CTAs: "30-Day Satisfaction Guarantee" or "500+ Websites Delivered"
- Visual: High-fidelity browser mockup showing a generated website. Desktop + mobile frames
- Subtle float/parallax animation on the mockup (CSS transform, not JS)
- Single column on mobile: headline, subheadline, CTA, then mockup below

### Trust Bar (LOCKED from PRD §3.3)
- Horizontal strip immediately below hero
- 4 items max with lucide-react icons:
  - "500+ Websites Delivered"
  - "30-Day Satisfaction Guarantee" (shield icon)
  - "Built From Real Business Data" (data icon)
  - "Live in 48 Hours" (clock icon)
- 2x2 grid on mobile

### Problem Section (LOCKED from PRD §3.4)
- Short, empathetic. 2-3 sentences, centered text, generous whitespace
- No images, no icons — pure typography
- Content direction: "Every day without a website, potential customers find your competitors instead. The problem isn't that building a website is hard — it's that most options either cost thousands or look like every other template on the internet. Your business is unique. Your website should be too."

### Scroll Animations (LOCKED from PRD §4.4 + DLS-03)
- Scroll-triggered fade-in + slide-up via IntersectionObserver
- CSS transitions only. NO GSAP, no Framer Motion, no Lottie
- Duration: 600-800ms, ease-out (confident and slow, not bouncy)
- Hero visual: gentle float effect (CSS keyframe animation)
- Implementation: reusable hook or utility that any section component can use
- IntersectionObserver with threshold for triggering (e.g., 0.1-0.2)
- prefers-reduced-motion: respect user preference, disable animations

### Design Token Usage (from Phase 16 foundation)
- All components use --mkt-* CSS custom properties from layout
- Backgrounds: --mkt-bg-primary (#0A0A0A), --mkt-bg-secondary (#FAFAFA)
- Accent: --mkt-accent (#AF92FF)
- Text: --mkt-text-primary (#FFFFFF on dark), --mkt-text-secondary (muted)
- Borders: hairline translucent (rgba(255,255,255,0.06))
- Transitions: 0.16s ease-out for micro-interactions (hover states)
- Spacing: py-24 desktop, py-16 mobile per section

### Component Rules (LOCKED from PRD §2.3)
- Hand-coded in components/marketing/ — NO imports from components/ui/, components/dashboard/, etc.
- Use lucide-react for icons (already a project dependency)
- No shadcn/ui, no Radix
- Mobile-first responsive classes

### Claude's Discretion
- Browser mockup implementation (CSS-drawn frame vs SVG vs image placeholder)
- Exact IntersectionObserver hook API design (custom hook vs utility function)
- How to handle the mobile hamburger menu state (useState vs CSS-only)
- Nav scroll detection approach (scroll event listener vs IntersectionObserver on hero)
- Whether to use CSS `scroll-behavior: smooth` or JS `scrollIntoView({ behavior: 'smooth' })`
- Exact animation keyframes for hero float effect

</decisions>

<specifics>
## Specific Ideas

### From Linear DLS Reference
- Nav uses `backdrop-filter: blur(16px)` when solid (Linear pattern)
- Transitions are `0.16s var(--ease-out-quad)` for all hover/focus states
- Mobile hamburger uses two animated rects (SVG bars) that transform on open
- Hero text uses staggered reveal animation (each line appears with slight delay)
- Spacer components control vertical rhythm between sections

### Critical Copy Rule
- NEVER use "AI-generated", "automated", "AI builder", "template" anywhere
- Hero headline alternatives from PRD:
  - "Your business deserves a website that actually looks like your business"
  - "Custom websites for businesses ready to grow online"
  - "We already built your website. Come see it."

### Browser Mockup
- Should show a realistic-looking website with real business data (placeholder image for now)
- Desktop frame + floating mobile frame offset to the right
- Subtle shadow and border-radius on the frame

</specifics>

<deferred>
## Deferred Ideas

- How It Works section (Phase 18)
- Portfolio section (Phase 18)
- Benefits section (Phase 18)
- All pricing, FAQ, CTA sections (Phase 19)
- Contact form, footer, legal pages (Phase 20)

</deferred>

---

*Phase: 17-hero-trust-problem*
*Context gathered: 2026-03-26 via PRD Express Path*
