# Phase 18: How It Works, Portfolio & Benefits - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (somosite-prd-v1.1.docx) + Linear DLS Reference Export

<domain>
## Phase Boundary

This phase builds the middle 3 sections of the landing page that demonstrate competence and build purchase intent:
- How It Works (3-step process)
- Portfolio / Quality Proof (6 demo site showcases)
- Benefits / Differentiators (outcome-focused selling points)

All components go in `components/marketing/`. Copy reads from `lib/marketing-constants.ts`. Page shell in `app/(marketing)/page.tsx` gets updated to replace inline placeholders with these components. All sections use the `useScrollAnimation` hook from Phase 17.

</domain>

<decisions>
## Implementation Decisions

### How It Works (LOCKED from PRD §3.5)
- Three cards/columns with step numbers (01, 02, 03), icon, title, and 2-line description
- Connecting lines/arrows between steps on desktop
- Vertical timeline on mobile
- Step 1: "We Research Your Business" — We study your services, reviews, location, and market. No questionnaires. No back-and-forth. We use real data about your actual business.
- Step 2: "We Build Your Custom Website" — Our design system creates a professional, mobile-optimized website using your real business information. No templates. No stock content.
- Step 3: "You Review and Go Live" — Preview your website, request any changes, and go live on your own domain. Full support included. Ready in days, not weeks.
- Section heading: "How It Works" or similar

### Portfolio / Quality Proof (LOCKED from PRD §3.6)
- Section title: "Websites We've Built" or "See What We Create"
- 6 website screenshots in browser mockup frames (reuse BrowserMockup pattern from hero)
- Different industries for each
- Each card: browser mockup screenshot, business name, industry tag, "View Demo" button linking to /preview/[slug]
- Masonry or offset grid layout. Hover: subtle scale + shadow
- Quality metrics below the grid:
  - PageSpeed 95+ badge
  - Mobile-responsive badge
  - "Built from real business data" badge
- Demo sites (placeholder images until real screenshots are generated):
  - "The Olive Table" — Italian restaurant, Brooklyn NY
  - "Bright Smile Dental" — Family dental practice, Austin TX
  - "Morrison & Associates" — Personal injury law firm, Chicago IL
  - "Elite Auto Detailing" — Mobile car detailing, Miami FL
  - "Flow Yoga Studio" — Yoga and wellness, Portland OR
  - "The Gentleman's Cut" — Barbershop, Denver CO
- Placeholder approach: CSS gradient backgrounds or solid color blocks representing screenshot area

### Benefits / Differentiators (LOCKED from PRD §3.7)
- Outcome-focused, not feature-focused
- Alternating left-right layout or 2-column card grid
- 2-3 lines per benefit
- Benefits:
  1. "Built From Your Real Data" — We research your business using the same data your customers see. The result feels like it was written by someone who knows your business.
  2. "Looks Custom, Not Cookie-Cutter" — Every website is designed individually. Different colors, layouts, and content. No two sites look the same.
  3. "Mobile-First, SEO-Ready" — Every site loads fast, looks great on phones, and is structured for search engines.
  4. "Ready in Days, Not Weeks" — Traditional agencies take 4-8 weeks. We deliver a preview within days.
  5. "You Own Everything" — Your website, your domain, your content. No monthly subscriptions. One price, full ownership.
- Each benefit has an icon, heading, and short description

### Design Token Usage (from Phase 16 foundation)
- All components use --mkt-* CSS custom properties
- Dark sections use --mkt-bg-primary (#0A0A0A)
- Light sections use --mkt-bg-secondary (#FAFAFA) — alternating pattern
- Accent: --mkt-accent (#AF92FF) for highlights and interactive elements
- Card hover: scale(1.02) + shadow increase, 0.16s ease-out
- All sections use useScrollAnimation for fade-in/slide-up on scroll

### Component Rules (LOCKED from PRD §2.3)
- Hand-coded in components/marketing/ — NO shadcn/ui, Radix imports
- Use lucide-react for icons
- Mobile-first responsive
- No animation libraries — CSS only

### Claude's Discretion
- Portfolio grid implementation (CSS grid vs flexbox, masonry vs uniform)
- How to represent connecting lines between steps (CSS borders, SVG, pseudo-elements)
- Placeholder screenshot implementation (gradient, solid color, abstract pattern)
- Whether to use BrowserMockup as shared component or inline per portfolio card
- Benefits layout choice: alternating left-right vs 2-column grid
- Step number styling (typography treatment of 01, 02, 03)

</decisions>

<specifics>
## Specific Ideas

### From Linear DLS Reference
- Card hover uses `filter: brightness(1.1)` + `transform: translateY(-2px)` pattern
- Grid items use subtle border (rgba(255,255,255,0.06)) on dark backgrounds
- Sections alternate between dark and slightly-less-dark (not true light/dark alternation in Linear)

### Portfolio Placeholder Strategy
- Since real screenshots aren't available yet, use gradient backgrounds that suggest a website:
  - Top bar (simulated browser chrome)
  - Gradient body suggesting content blocks
  - Each placeholder has a different accent color to suggest industry variation
- The "View Demo" links should point to `/preview/[slug]` — these may or may not exist yet

### Quality Metrics Badges
- Small pills below the portfolio grid
- Icons: Gauge (PageSpeed), Smartphone (mobile), Database (real data)
- Subtle, not attention-stealing

</specifics>

<deferred>
## Deferred Ideas

- Real portfolio screenshots (future — placeholder images for now)
- Pricing section (Phase 19)
- FAQ section (Phase 19)
- Final CTA (Phase 19)
- Contact form, footer, legal pages (Phase 20)

</deferred>

---

*Phase: 18-how-it-works-portfolio-benefits*
*Context gathered: 2026-03-26 via PRD Express Path*
