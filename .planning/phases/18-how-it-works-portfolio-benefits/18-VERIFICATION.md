---
phase: 18-how-it-works-portfolio-benefits
verified: 2026-03-26T00:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 18: How It Works, Portfolio, Benefits — Verification Report

**Phase Goal:** The middle sections of the landing page demonstrate competence — visitors see a clear 3-step process, browse 6 demo site screenshots in polished browser mockups, and read outcome-focused differentiators that build purchase intent
**Verified:** 2026-03-26
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | How It Works section shows 3 numbered step cards with icons, connecting lines on desktop, vertical timeline on mobile | VERIFIED | `how-it-works.tsx` lines 27-61: `hidden sm:grid sm:grid-cols-3` desktop layout with dashed connector divs at `i > 0`; lines 64-96: `sm:hidden` mobile block with vertical left-border line and absolute-positioned numbered circles |
| 2 | Benefits section shows 5 outcome-focused differentiators with icons, heading, and description | VERIFIED | `benefits.tsx` renders `BENEFITS.items` (confirmed 5 items) in a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid, each with icon circle, `h3` heading, and description paragraph |
| 3 | All copy matches PRD-locked content exactly | VERIFIED | `marketing-constants.ts` HOW_IT_WORKS steps: "We Research Your Business", "We Build Your Custom Website", "You Review and Go Live" with exact PRD descriptions; BENEFITS has exactly 5 PRD-specified items |
| 4 | Portfolio section displays 6 demo site screenshots in browser mockup frames | VERIFIED | `portfolio.tsx` lines 37-103: iterates `PORTFOLIO.items` (6 items confirmed) with inline browser mockup frame (title bar + traffic lights + aspect-video gradient per card) |
| 5 | Each portfolio card shows business name, industry tag, and View Demo link | VERIFIED | `portfolio.tsx` lines 90-101: `h3` for name, `p` for category, `<a href={item.demoUrl}>View Demo</a>` per card |
| 6 | Quality badges appear below the portfolio grid | VERIFIED | `portfolio.tsx` lines 106-120: `mt-12 flex flex-wrap justify-center gap-6` renders 3 pill badges from `PORTFOLIO.qualityBadges` (PageSpeed 95+, Mobile Responsive, Built From Real Data) |
| 7 | All 3 new sections render on the landing page in correct order | VERIFIED | `app/(marketing)/page.tsx` lines 5-7: imports all three; lines 24-26: `<HowItWorks />`, `<Portfolio />`, `<Benefits />` in sequence after `<Problem />`, before Pricing |
| 8 | Existing sections (Hero, Trust, Problem, Pricing, FAQ, etc.) still render correctly | VERIFIED | `page.tsx` retains Navbar, Hero, TrustBar, Problem, Pricing, FAQ, FinalCTA, Contact, Footer — all inline sections untouched; HOW_IT_WORKS/PORTFOLIO/BENEFITS no longer imported at page level (removed as planned) |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/marketing-constants.ts` | Updated HOW_IT_WORKS and BENEFITS copy matching PRD; contains "We Research Your Business" | VERIFIED | File exists, contains PRD-locked copy, exports HOW_IT_WORKS, BENEFITS, PORTFOLIO with qualityBadges |
| `components/marketing/how-it-works.tsx` | 3-step process section; default export; min 60 lines | VERIFIED | 100 lines, default export confirmed, substantive dual-layout implementation |
| `components/marketing/benefits.tsx` | 5-benefit section with icons; default export; min 50 lines | VERIFIED | 52 lines, default export confirmed, substantive grid implementation |
| `components/marketing/portfolio.tsx` | 6-card portfolio grid with browser mockup frames; default export; min 80 lines | VERIFIED | 124 lines, default export confirmed, browser mockup + quality badges fully implemented |
| `app/(marketing)/page.tsx` | Updated page importing HowItWorks, Portfolio, Benefits; contains "import HowItWorks" | VERIFIED | All three imports present at lines 5-7; components rendered at lines 24-26 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/marketing/how-it-works.tsx` | `lib/marketing-constants.ts` | `import HOW_IT_WORKS` | WIRED | Line 3: `import { HOW_IT_WORKS } from "@/lib/marketing-constants"` — used in JSX to render steps |
| `components/marketing/benefits.tsx` | `lib/marketing-constants.ts` | `import BENEFITS` | WIRED | Line 3: `import { BENEFITS } from "@/lib/marketing-constants"` — used in JSX to render items |
| `components/marketing/how-it-works.tsx` | `hooks/use-scroll-animation` | `useScrollAnimation` | WIRED | Line 4: import present; line 10: `const sectionRef = useScrollAnimation()` assigned to section ref |
| `components/marketing/portfolio.tsx` | `lib/marketing-constants.ts` | `import PORTFOLIO` | WIRED | Line 3: `import { PORTFOLIO } from "@/lib/marketing-constants"` — used for items and qualityBadges |
| `components/marketing/portfolio.tsx` | `hooks/use-scroll-animation` | `useScrollAnimation` | WIRED | Line 4: import present; used for section ref |
| `app/(marketing)/page.tsx` | `components/marketing/how-it-works.tsx` | component import | WIRED | Line 5: `import HowItWorks from "@/components/marketing/how-it-works"` — rendered at line 24 |
| `app/(marketing)/page.tsx` | `components/marketing/portfolio.tsx` | component import | WIRED | Line 6: `import Portfolio from "@/components/marketing/portfolio"` — rendered at line 25 |
| `app/(marketing)/page.tsx` | `components/marketing/benefits.tsx` | component import | WIRED | Line 7: `import Benefits from "@/components/marketing/benefits"` — rendered at line 26 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PAGE-05 | 18-01-PLAN.md | How It Works — 3-step cards with icons, connecting lines, vertical timeline on mobile | SATISFIED | `how-it-works.tsx` implements dual-layout: desktop 3-col grid with dashed connector lines, mobile vertical timeline with absolute-positioned circles |
| PAGE-06 | 18-02-PLAN.md | Portfolio — 6 demo site placeholder screenshots in browser mockup frames with "View Demo" links | SATISFIED | `portfolio.tsx` renders 6 cards each with browser title bar, traffic light dots, aspect-video gradient body, and `View Demo` href pointing to `/preview/[slug]` |
| PAGE-07 | 18-01-PLAN.md | Benefits — outcome-focused differentiators, alternating left-right or 2-column grid | SATISFIED | `benefits.tsx` renders 5 PRD-specified differentiators in responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid |

No orphaned requirements found — all three PAGE-05/06/07 requirements are claimed and implemented.

---

### Anti-Patterns Found

None detected. No TODOs, FIXMEs, `return null`, placeholder text, or empty handlers in any Phase 18 component.

One pre-existing TypeScript error noted in unrelated files (`lib/supabase/proxy.ts`, `lib/supabase/roles.ts` — `user_roles` table not in Supabase type schema). Zero TypeScript errors in any Phase 18 file.

---

### Human Verification Required

#### 1. Desktop connecting lines visual check

**Test:** Open the landing page at `#how-it-works` on a viewport wider than 640px
**Expected:** A dashed horizontal line visually connects step 1 → step 2 → step 3 between the numbered circles
**Why human:** The connector `div` uses `right-1/2 w-full` positioning that requires visual confirmation to ensure it spans correctly across grid columns

#### 2. Mobile timeline visual check

**Test:** Open the landing page at `#how-it-works` on a mobile viewport (375px wide)
**Expected:** A vertical left-edge line with numbered circles (01, 02, 03) connects all three steps in a stacked layout
**Why human:** The `absolute left-0` circles and `border-left` vertical line require visual confirmation of alignment across all three steps

#### 3. Portfolio browser mockup visual check

**Test:** Browse the `#portfolio` section
**Expected:** 6 cards each show a distinct colored gradient background (warm/teal/purple/gold/green/red) inside a browser frame with traffic light dots; business name, category, and "View Demo" link appear below each frame
**Why human:** Gradient values use non-standard opacity suffixes (`bg-white/8`, `bg-white/4`) that may not be in Tailwind's default safelist — visual check confirms they render

---

### Gaps Summary

No gaps. All phase 18 must-haves are satisfied:
- HOW_IT_WORKS constants match PRD copy exactly (3 steps)
- BENEFITS constants have exactly 5 PRD-specified items
- PORTFOLIO has 6 PRD-specified businesses with qualityBadges array
- All three components exist, are substantive (not stubs), and are wired into the landing page
- Section order on the landing page is correct
- No pre-existing TypeScript errors introduced by Phase 18 files

---

_Verified: 2026-03-26_
_Verifier: Claude (gsd-verifier)_
