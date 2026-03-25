# Phase 16: Marketing Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** PRD Express Path (somosite-prd-v1.1.docx) + Linear DLS Reference Export

<domain>
## Phase Boundary

This phase builds the infrastructure for the entire Somosite agency landing page:
- (marketing) route group with isolated layout
- Root route change (/ serves landing page, not /dashboard redirect)
- Dark design system tokens inspired by Linear's DLS
- Premium font stack (serif headings + Inter body)
- Centralized marketing copy file
- Responsive baseline (mobile-first breakpoints)

No page sections are built in this phase — only the shell/foundation that all sections plug into.

</domain>

<decisions>
## Implementation Decisions

### Route Architecture (LOCKED from PRD)
- (marketing) route group captures root route (/)
- Files: app/(marketing)/layout.tsx, app/(marketing)/page.tsx
- Legal pages: app/(marketing)/privacy/page.tsx, app/(marketing)/terms/page.tsx, app/(marketing)/refund/page.tsx
- Remove/update old root redirect in app/page.tsx that currently sends / to /dashboard
- All existing routes (/claim/*, /preview/*, /portal/*, /dashboard/*, /editor/*) unchanged
- Do NOT modify proxy.ts — marketing routes are public
- Do NOT modify any files in app/(admin)/, app/(client)/, app/(portal)/, or app/api/ (except adding api/contact later)

### Design System (LOCKED from PRD + Linear Reference)
- Primary bg: #0A0A0A (near-black, matches Linear's #08090a-#121414 range)
- Alternating section bg: #FAFAFA or #F5F5F5
- Accent: #AF92FF (brand purple — used for CTAs and highlights)
- Text: #FFFFFF on dark sections, #1A1A1A on light sections
- Borders: hairline translucent (rgba(255,255,255,0.06-0.1)) inspired by Linear's --color-border-translucent
- Surface layers: subtle translucent white overlays (rgba(255,255,255,0.02-0.05)) for cards/elements on dark bg
- Grain texture: CSS noise overlay on dark sections (Linear-style subtle grain)
- Section padding: py-24 (96px) desktop, py-16 mobile
- Max content width: 1200px centered
- Cards: 16-24px padding, subtle border, 8-12px radius, shadow-sm
- Transition timing: 0.16s ease-out for micro-interactions (Linear standard)

### Typography (LOCKED from PRD)
- Headings: DM Serif Display (premium serif) — loaded via next/font in (marketing) layout
- Body: Inter, 16px base, 1.6 line-height — loaded via next/font
- Hero headline: 48-64px desktop, 32-40px mobile
- Section headings: 32-40px desktop
- Fonts loaded ONLY in (marketing) layout — do NOT change Geist in admin or Inter in client/portal layouts
- Do NOT import from existing font configs

### Copy Architecture (LOCKED from PRD)
- All marketing copy in lib/marketing-constants.ts
- Exports: headlines, subheadlines, CTAs, feature descriptions, FAQ content, pricing data, trust signals, benefit descriptions, footer content
- Zero hardcoded strings in components — every text string reads from this file
- PRD Section 3 has all the exact copy for each section

### Component Rules (LOCKED from PRD)
- Hand-coded components in components/marketing/ — no shadcn/ui, Radix, or new UI library
- Do NOT import from components/dashboard/, components/workbench/, components/editor/, components/ui/
- Landing page components are self-contained for minimal bundle size
- CSS-only animations (no GSAP, Framer Motion, Lottie)

### Responsive (LOCKED from PRD)
- Mobile-first
- Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- All CTAs: full-width on mobile

### Claude's Discretion
- Exact Tailwind config extensions (colors, spacing) — extend don't replace
- CSS variable naming convention for design tokens
- Whether to use CSS custom properties or Tailwind theme for tokens
- Grain texture implementation approach (CSS pseudo-element with SVG noise vs background-image)
- How to structure marketing-constants.ts (flat exports vs nested object)
- Whether the page.tsx in Phase 16 shows a placeholder or empty shell

</decisions>

<specifics>
## Specific Ideas

### From Linear DLS Reference Export
- Transitions use `0.16s var(--ease-out-quad)` consistently
- Surfaces use very subtle rgba(255,255,255,0.02-0.05) on dark backgrounds
- Borders are hairline (`var(--border-hairline)`) with translucent color
- Grain texture applied via a `Grain_grain` CSS class with pseudo-element
- Color hierarchy: primary text, secondary text, tertiary text, quaternary text
- `backdrop-filter: blur(5px-24px)` for floating elements
- Layout uses Spacer components for consistent vertical rhythm

### From PRD Section 4.4 Motion
- Scroll-triggered fade-in + slide-up via IntersectionObserver
- Duration: 600-800ms, ease-out (confident and slow, not bouncy)
- CSS transitions only

### Critical Positioning Rule
- NEVER say "AI-generated," "automated," "AI builder," or "template" anywhere
- Use: "intelligently crafted," "precision-built," "custom-architected," "data-driven design"

</specifics>

<deferred>
## Deferred Ideas

- Individual page sections (Phase 17-20)
- Contact form API route (Phase 20)
- Legal page content (Phase 20)
- Cookie consent banner (Phase 20)
- SEO metadata and OG image (Phase 20)
- Demo portfolio screenshots (future — using placeholders)

</deferred>

---

*Phase: 16-marketing-foundation*
*Context gathered: 2026-03-26 via PRD Express Path*
