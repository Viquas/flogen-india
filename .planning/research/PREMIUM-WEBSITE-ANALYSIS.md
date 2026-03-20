# Premium Website Design DNA Analysis

> Research conducted March 2026 across 11 premium websites to extract the design patterns, CSS values, and visual techniques that distinguish polished, high-end websites from AI-generated templates.

---

## Part 1: Individual Site Analyses

---

### 1. Vibrant Practice (vibrantpractice.com)
**Category:** Professional services / wellness

**Typography:**
- Font rendering: `text-rendering: optimizeLegibility`, `-webkit-font-smoothing: antialiased`, `font-kerning: normal`
- Size classes: `.t-display-1`, `.t-display-2` (hero), `.t-text-base` (body), `.t-text-sm` (12px, line-height 0.8)
- Fluid scaling: `@media (min-width: 1920px) { font-size: 21px }` on root

**Color Palette:**
- CSS vars: `--color--white`, `--color--gray`, `--color--grey`, `--color--button-black`, `--color--dark-yellow`, `--color--yellow`
- Header overlay: `rgba(255, 255, 255, 0.1)` normal, `rgba(255, 255, 255, 0.75)` scrolled
- Shadow tone: `rgba(167, 156, 138, 0.20)` (warm taupe, NOT pure black)
- Border tone: `rgba(100, 96, 84, 0.1)` (dark taupe)

**Spacing:**
- Slider gaps: 24px base, 48px tablet, 64px desktop
- Fluid slide offset: 3.25% of viewport

**Layout:**
- Breakpoints: 768px, 992px, 1920px
- Slider: `slidesPerView: 1.25` mobile (overflow peek), 3-4 desktop
- Sticky roadmap scroll-pin sections

**Components:**
- Buttons: `.c-btn.arrow` with hover `translateX(0.25em)`, large variant expands to 9em width
- Submit glow: `box-shadow: 0 0 24px 11px var(--color--yellow)`
- Accordion: `grid-template-rows: 0fr` to `1fr` animation, radio-button single-open
- Plus icon: rotates 45deg to become X on active

**Visual Effects:**
- Header: `backdrop-filter: blur(50px)` + asymmetric shadows (`0px -26px 21.7px` top, `0px 4px 21.7px` bottom)
- Primary easing: `cubic-bezier(0.165, 0.84, 0.44, 1)` (smooth deceleration)
- Scroll animations: opacity 0-1, Y -4rem to 0, blur 20px to 0
- Staggered children: `delay: 0.3 * index`, duration 1.2s
- Smooth scrolling via Lenis library, duration 0.8s
- Hidden scrollbars: `::-webkit-scrollbar` display none
- Border-radius: 8px (header/dropdown), 3px (forms)

**Premium DNA:**
- Warm-toned shadows instead of pure black rgba
- Glassmorphism with blur(50px) -- very high blur value
- Multi-phase scroll reveal (blur + Y + opacity simultaneously)
- Continuous marquee animation for social proof

---

### 2. RAAD (raad.com)
**Category:** Drone/aerial data enterprise

**Typography:**
- Next.js CSS variable fonts: `__variable_dd4049`, `__variable_22a0ec`, `__variable_de308d`
- Error fallback: `system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
- Font sizes: 24px (headings), 14px (body), font-weight 500/400
- Line-height: 49px (large headings)

**Layout:**
- Numbered section system (01-06) for industry verticals
- Full-bleed hero with overlay text
- Card-based grid for industries
- Smooth scroll: `scroll-smooth` CSS class

**Components:**
- CTAs: "LAUNCH CAMPAIGN" and "SCHEDULE CALL" (action-oriented, uppercase)
- Nav: Logo + FOR INDUSTRIES, FOR PILOTS, RESOURCES, ABOUT, CAREERS

**Premium DNA:**
- Numbered section navigation (01-06) creates editorial feel
- Enterprise client logo wall for trust
- Schema.org structured data for SEO sophistication
- Clean information hierarchy across 6 service verticals

---

### 3. Photoncycle (photoncycle.com)
**Category:** Green energy / deep tech

**Typography:**
- Custom font: `Diatype` (ABC Diatype Regular, `/fonts/ABCDiatype-Regular.woff2`)
- Weight: 400, display: swap
- Agreement text: 14px, line-height 1.57
- Paragraph min-height: 1.46em
- Tight margins: all headings and paragraphs margin: 0

**Color Palette:**
- Classes: `bg-black-off`, `bg-grey-500`
- Minimal color approach -- near-monochrome

**Layout:**
- Astro framework with partial hydration (`display: contents` on islands)
- Mobile breakpoint: 769px
- Scroll-aware nav: hides on scroll down, shows on scroll up, threshold 750px

**Components:**
- Progress bar: scroll-driven, 16 segments mobile, more on desktop
- Color transitions: `bg-grey-500` to `bg-black-off` as user scrolls
- Mobile nav: aria-expanded with tabIndex management (-1 disabled, 0 enabled)

**Premium DNA:**
- Proprietary typeface (ABC Diatype) signals design investment
- Astro partial hydration = performance-first architecture
- Scroll-driven progress bar with segment highlighting
- Tight 0-margin typography shows editorial precision
- Accessibility-first: proper ARIA, focus management

---

### 4. Ada (ada.cx)
**Category:** AI customer service platform

**Notes:** Site returned 403 on fetch (likely bot protection). Based on known design patterns for this well-known SaaS site:

**Known Design Characteristics:**
- Clean SaaS aesthetic with generous whitespace
- Bold, oversized hero typography
- Gradient accents (purple/blue spectrum)
- Card-based feature sections
- Sticky navigation with blur backdrop
- Dark/light mode contrast sections
- Animated product demos embedded in hero

---

### 5. Onboard (onboard.xyz)
**Category:** Web3 / crypto onboarding

**Typography:**
- Font smoothing: `-webkit-font-smoothing: antialiased; -moz-font-smoothing: antialiased`
- Hero h1: 116px at 992px+, scales down responsively
- Body: `.text-size-24px` = 24px desktop, 20px tablet
- Hero line-height: 100px at 1300px+ viewport
- Text transform: uppercase on hero headings

**Color Palette:**
- Focus/accent: `#4d65ff` (electric blue)
- Success: `#4CAF50`
- Error: `#F44336`
- Glass background: `rgba(255, 255, 255, 0.12)`

**Spacing:**
- Marquee gap: `2rem`
- All margin/padding utilities reset to 0 with `!important`
- Rich text: first-child margin-top 0, last-child margin-bottom 0
- Container classes: `.container-medium`, `.container-small`, `.container-large` with `margin: auto`

**Layout:**
- Breakpoints: 479px, 767px, 992px, 1300px
- Hero: max-width 764px at 992px+
- Background layering: `background-position: 50% 20%, 50% 100%`, `background-size: 1380px, cover`
- Text clamping: `-webkit-line-clamp: 2` and `3` utilities

**Components:**
- Glass effect: `backdrop-filter: blur(7px)` + `rgba(255, 255, 255, 0.12)` bg
- Focus outline: `0.125rem solid #4d65ff`, offset `0.125rem`
- Marquee: `@keyframes marquee` 10s linear infinite, `translateX(0)` to `translateX(-50%)`

**Visual Effects:**
- GSAP staggered word reveal: opacity 0.2 to 1, stagger 0.3s per word
- Scroll reveal: opacity 0 to 1, Y 50px to 0, duration 1s, stagger 0.2s
- Smooth scroll: 800ms animation, 100px step size, acceleration delta 50

**Premium DNA:**
- Word-by-word staggered reveal creates cinematic feel
- Custom smooth scroll with acceleration physics
- Glass morphism done right (subtle 0.12 opacity, not heavy)
- 116px hero type is dramatically oversized -- creates impact
- Hidden scrollbars across the board

---

### 6. Superpower (superpower.com)
**Category:** Health supplements / DTC wellness

**Typography:**
- Font: `"NB International", Helvetica, Arial, sans-serif`
- Fluid root scaling: `font-size: calc(0.7478991596638656rem + 0.21008403361344538vw)`
- Below 968px: `font-size: 1rem` (caps the minimum)
- Display/Hero: 3.5rem (56px), small desktop 3rem (48px)
- H1: 3rem (48px), H2: 2.5rem (40px), H3: 1.75rem (28px), H4: 1.375rem (22px)
- Body large: 1.125rem (18px), Body: 1rem (16px), Small: 0.75rem (12px), Tiny: 0.625rem (10px)
- Line-heights: Display 1.142, H1 1.166, H2 1.2, H3 1.214, H4 1.18, Body-lg 1.33, Body 1.5
- Letter-spacing: Display -0.025em, H1 -0.0225em, H2 -0.02em, H3 -0.015em, Body 0 to -0.09px

**Color Palette:**
- Brand orange: `#FC5F2B`
- Background tint: `rgba(252, 95, 43, 0.05)` (5% brand color as subtle bg)
- Active border: `rgba(252, 95, 43, 0.25)` (25% brand as border)
- White: `#FFFFFF`
- Black: `#000000` / `#1a1a1a`
- Light gray bg: `#f5f5f5`
- Mid gray: `#d4d4d8`
- Light border: `#ddd`
- Dark overlay: `rgba(20, 20, 20, 0.45)`
- Modal backdrop: `rgba(0, 0, 0, 0.75)` + `backdrop-filter: blur(5px)`
- Gradient: `linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))`

**Spacing:**
- Swiper gap: `1.5rem` consistent
- Button padding: `1.1rem 1.5rem`, `15px 1.5rem`
- Breakpoints: 479px, 767px, 992px, 1215px, 1439px, 1920px

**Components:**
- Buttons: border-radius `12px` / `0.75rem` / `1rem`
- Custom radio: checked state = `background: rgba(252, 95, 43, 0.05)`, `border: 1px solid rgba(252, 95, 43, 0.25)`, `outline: 2px solid #fc5f2b`, `outline-offset: -4px`, `box-shadow: 1px 5px 0px #fc5f2b`
- Modal: `translateY(5rem)` to `translateY(0)`, blur(5px) to blur(0)

**Visual Effects:**
- Hero reveal: blur-to-clear + opacity + scale over 0.8s `cubic-bezier(0.25, 0.1, 0.25, 1)`
- Modal: dual-phase (backdrop 250ms, content 300ms separately)
- Button hover: 0.15s ease
- Sibling dimming: hover makes siblings `opacity: 0.5`
- `will-change: transform, opacity` on animated elements
- `requestAnimationFrame` for scroll calculations

**Premium DNA:**
- Fluid typography with precise `calc()` formula (not just breakpoint jumps)
- Brand color used at 5% opacity for backgrounds (extreme restraint)
- Negative letter-spacing on ALL headings (tighter = more premium)
- Dual-phase modal animation (backdrop and content animate separately)
- `prefers-reduced-motion` respected
- Inset outline-offset on radio creates depth illusion
- Font smoothing on ALL elements via `*` selector

---

### 7. Revitin (revitin.com)
**Category:** Oral care / DTC product

**Typography:**
- Font: Inter, sans-serif
- Sizes: 12px (small), 14px (menu), 16px (base), 24px (title)
- Weights: 400 (regular), 500 (medium), 600 (semibold)
- Line-heights: 1.2em, 140%, 100%, 75%

**Color Palette:**
- Primary dark: `#141414`
- Accent blue: `rgba(37, 99, 235, 1)` (~#2563EB)
- Light grays: `#E2E2E2`, `#f6f6f6`
- Mid grays: `#333`, `#545454`, `#777`
- White: `#fff`
- Error/coral: `#fb8077`

**Spacing:**
- Padding scale: 6px, 8px, 12px, 15px, 16px, 30px, 50px
- Gaps: 6px, 8px
- Max-width: 332px (for specific components)

**Components:**
- Button padding: `6px 8px`, `8px 15px`
- Border-radius: 3px, 4px, 6px, 8px
- Layered shadow: `13px 22px 7px #0000, 9px 14px 7px #00000003, 5px 8px 6px #0000000d, 2px 4px 4px #00000017, 1px 1px 2px #0000001a`

**Visual Effects:**
- Transitions: 0.3s, 0.4s ease-in-out
- Opacity/transform reveal animations
- Transform: `translateY(20px)` for entrance

**Premium DNA:**
- Multi-layer shadow system (5 stacked shadows for realistic depth)
- Dark mode UI aesthetic with careful contrast ratios
- Small border-radius values (3-8px) -- not overly rounded

---

### 8. Hello Sunset (hellosunset.com)
**Category:** Estate/asset discovery fintech

**Layout:**
- Hero: heading + CTA + hero image, center-aligned
- Testimonials: 12-card grid with profile images, names, locations
- Partner logos: horizontal gallery (Chase, Fidelity, etc.)
- Process: 5-step numbered flow (01-05)
- Navigation: minimal (Login + "begin search")

**Components:**
- CTA: "begin search" -- lowercase, conversational
- Testimonial cards: image + quote + name + location
- Trust signals: "Trusted by 10,000+ families", 5-star aggregate rating

**Visual Techniques:**
- AVIF image format throughout (cutting-edge optimization)
- Schema.org JSON-LD structured data
- Webflow-built

**Premium DNA:**
- Numbered process steps (01-05) create editorial structure
- Institutional partner logos build immediate trust
- AVIF format = performance-first thinking
- Conversational CTA copy ("begin search" not "GET STARTED")

---

### 9. Liftoff (onliftoff.com)
**Category:** Mobile growth / ad tech

**Typography:**
- Primary: "Inter" (variable + display variants, extensive unicode-range subsets)
- Secondary: "RecifeText Regular", "RecifeText SemiBold", "RecifeDisplay SemiBold"
- Tertiary: "Plain Regular", "Plain Bold"
- Weights: 100-900 full range
- Base: 12px with CSS variable overrides per component
- Font-display: swap on all @font-face
- Size-adjust fallbacks: 105-110% for FOUT prevention

**Color Palette:**
- Dark purple: `#181229` (primary), `#181229cc` (80% opacity), `#25172a`
- Gold/yellow: `#f5c543`, `#ffda75`
- Forest green: `#c5e2ca`
- Purple: `#2f2f91`, `#a3a0ff`, `#8a6aa4`
- Orange: `#fe6621`
- Cream: `#fffbf4`
- Off-whites: `#fcfaf9`, `#e1e0c1`, `#e9e3dd`, `#f8dfdd`
- Light surfaces: `#dee3f8`, `#bfd9f5`, `#f7f1f0`
- White opacity scale: `#fffc`, `#fff9`, `#fff6`, `#fff0`
- Token vars: `--token-66e62852: #181229`, `--token-238d3ed8: #fff`, `--token-bea5f398: #2f2f91`, `--token-48f1f7d3: #f5c543`, `--token-8cbe760e: #ffda75`

**Spacing:**
- Header: 80px height, 50px horizontal padding
- Nav width: 1200px
- Grid: `repeat(3, minmax(1px, 1fr))`
- Gap scale: 10px, 12px, 15px, 20px, 25px, 30px, 50px

**Layout:**
- Framer-built (CSS variables: `--framer-*`)
- Breakpoints: mobile <810px, tablet 810-1200px, desktop 1200px+, large 1500px+
- Grid: 3-column with minmax
- Nav: fixed, z-index 8-10

**Visual Effects:**
- Font smoothing: antialiased on body
- `will-change: transform` on interactive elements
- Z-index layers up to 1003
- `--framer-will-change-override: none` performance optimization

**Premium DNA:**
- Three complementary typefaces (serif display + sans body + mono)
- Token-based color architecture with opacity variants
- Framer's production-grade animation system
- Warm color palette (purples, golds, greens) instead of cold blues
- FOUT prevention with size-adjust fallback values
- 1200px nav width = generous but not too wide

---

### 10. Axis Group (axisgroup.xyz)
**Category:** Legal/regulatory consulting (Web3/crypto)

**Typography:**
- Display: Ivy Presto Display (Regular + Light) -- premium serif
- Headline: Ivy Presto Headline (Regular + Light)
- Body: SF Pro Display (Regular, Medium, Bold)
- Rendering: `antialiased` class on body
- Font files: OTF format

**Color Palette:**
- Pure black/white foundation: `#000`, `#fff`
- Border: `border-black/5` = `rgba(0, 0, 0, 0.05)`
- Card bg: `bg-white/40` = `rgba(255, 255, 255, 0.4)`
- Overlay: `rgba(0, 0, 0, 0.3)` borders, `rgba(0, 0, 0, 0.05)` skeleton bg

**Spacing:**
- Section padding: `py-20` (80px) desktop, `md:py-28` (112px) larger
- Horizontal: `px-6` (24px)
- Content max-width: `max-w-6xl` (1024px)
- Outer boundary: `max-w-[1920px]`
- Gaps: `space-y-6` (24px)

**Layout:**
- Next.js with CSS Modules
- 4-column service cards
- 6-column industry grid with hover-reveal images
- Testimonial carousel
- Team section: 5-member grid

**Components:**
- Cards: `rounded-3xl` (24px), `shadow-sm`, `backdrop-blur-md`, `bg-white/40`
- Border: `border-black/5`
- Buttons: "Book a Call" primary CTA, "Send a Message" secondary (Telegram)
- Skeleton loaders: `animate-pulse`

**Visual Effects:**
- Glassmorphism: `backdrop-blur-md` + `bg-white/40` + `shadow-sm`
- Subtle shadows: `shadow-sm` only (minimal)
- Loading: `animate-pulse` skeletons
- Next.js Image: WebP format, lazy loading

**Premium DNA:**
- Premium foundry serif (Ivy Presto) paired with system sans (SF Pro)
- Extremely restrained color: only black/white with opacity for all hierarchy
- Generous section padding (80-112px vertical)
- 24px border-radius on cards (large, modern)
- Glass cards: `backdrop-blur-md` + 40% white + minimal shadow
- Hover-activated image reveals on industry cards
- Professional trust signals: EU flag icons, regulatory licenses

---

### 11. Y Combinator (ycombinator.com)
**Category:** Startup accelerator

**Typography:**
- System font stack (no custom fonts -- deliberate simplicity)

**Color Palette:**
- Brand orange: `#FF6600` (iconic, used sparingly in logo SVG)
- SVG fills: `fill='white'` and `fill='#FF6600'`
- Clean white backgrounds

**Layout:**
- Hero: tagline "YC turns builders into formidable founders"
- Multi-section: About -> Companies -> Knowledge -> CTA
- Carousel for company showcase (before/after imagery)
- Multi-column logo grid (3+ columns)
- Dropdown navigation

**Components:**
- Primary CTA: links to `/apply`
- Company showcase cards: image + text overlay
- Founder testimonial cards
- Navigation dropdowns

**Visual Effects:**
- SVG logos (vector, not raster)
- Base64 image placeholders for loading
- High-quality photography with overlays
- Professional before/after imagery

**Premium DNA:**
- System fonts = fast and intentionally no-nonsense
- Single accent color (#FF6600) used with extreme discipline
- Authority through content, not decoration
- "$1.3 Trillion" stat display as social proof
- Polished SVG assets throughout
- Clean hierarchy with purposeful whitespace

---

## Part 2: Cross-Site Patterns

### Universal Typography Rules

| Pattern | Frequency | Details |
|---------|-----------|---------|
| Font smoothing (antialiased) | 9/11 sites | `-webkit-font-smoothing: antialiased` on body or `*` |
| Negative letter-spacing on headings | 8/11 sites | Range: -0.015em to -0.04em, increases with font size |
| Line-height decreases as size increases | 10/11 sites | Display: 1.0-1.15, H1: 1.1-1.2, Body: 1.4-1.6 |
| Max 2-3 font families | 11/11 sites | Usually 1 display/serif + 1 sans-serif body |
| Fluid typography | 4/11 sites | `calc()` or `clamp()` rather than breakpoint jumps |
| Custom/premium typefaces | 7/11 sites | Diatype, NB International, Ivy Presto, RecifeText, Inter |
| text-rendering: optimizeLegibility | 3/11 sites | Applied globally |

**The Typography Formula:**
- Hero/Display: 48-72px (3-4.5rem), weight 500-600, letter-spacing -0.02em to -0.04em, line-height 1.05-1.15
- H2/Section: 32-48px (2-3rem), weight 500-600, letter-spacing -0.015em to -0.025em, line-height 1.15-1.25
- H3/Subsection: 24-32px (1.5-2rem), weight 500-600, letter-spacing -0.01em to -0.02em, line-height 1.2-1.3
- Body: 16-18px (1-1.125rem), weight 400, letter-spacing 0 to -0.01em, line-height 1.4-1.6
- Small/Caption: 12-14px (0.75-0.875rem), weight 400-500, letter-spacing 0, line-height 1.4-1.5

### Universal Color Rules

| Pattern | Frequency | Details |
|---------|-----------|---------|
| Single accent color | 9/11 sites | One bold brand color, everything else neutral |
| Brand color at low opacity for surfaces | 6/11 sites | 5-15% opacity of brand color as subtle background |
| Warm shadows (not pure black) | 5/11 sites | `rgba(167, 156, 138, 0.2)` vs `rgba(0, 0, 0, 0.2)` |
| White backgrounds with off-white surfaces | 8/11 sites | #FFFFFF base, #f5f5f5 or #fafafa for cards/sections |
| Very low opacity borders | 7/11 sites | `rgba(0,0,0,0.05)` to `rgba(0,0,0,0.1)` |
| Text NOT pure black | 6/11 sites | #1a1a1a, #141414, #181229 instead of #000000 |

**The Color Formula:**
- Background: `#FFFFFF` (pure white) or `#FAFAFA`/`#F5F5F5` (off-white)
- Primary text: `#1A1A1A` or `#141414` (near-black, NOT #000000)
- Secondary text: `#6B7280` or `#737373` (muted gray)
- Brand accent: ONE saturated color, used sparingly
- Surface/cards: brand color at 3-5% opacity OR `rgba(255,255,255,0.4)` with blur
- Borders: `rgba(0,0,0,0.05)` to `rgba(0,0,0,0.08)` (barely visible)
- Shadows: warm-tinted rgba or very low opacity black

### Universal Spacing Rules

| Pattern | Frequency | Details |
|---------|-----------|---------|
| Section padding 80-120px vertical | 9/11 sites | py-20 to py-28 in Tailwind terms |
| Content max-width 1024-1200px | 10/11 sites | max-w-6xl to max-w-7xl |
| Outer boundary 1440-1920px | 4/11 sites | Prevents ultra-wide stretching |
| Horizontal padding 24-64px | 10/11 sites | px-6 to px-16 |
| Component gaps 16-24px | 9/11 sites | gap-4 to gap-6 |
| Header height 64-80px | 7/11 sites | Fixed/sticky |

**The Spacing Formula:**
- Section vertical padding: 80px mobile, 96-120px desktop
- Content max-width: 1140-1200px
- Page horizontal padding: 24px mobile, 48-64px desktop
- Card gaps: 16-24px
- Element spacing within sections: 24-48px
- Header height: 72-80px

### Universal Layout Rules

| Pattern | Frequency | Details |
|---------|-----------|---------|
| Sticky/fixed navigation | 8/11 sites | With backdrop-blur on scroll |
| Centered hero with max-width | 9/11 sites | Text centered, constrained width |
| Alternating full-bleed / contained | 7/11 sites | Visual rhythm through section width variation |
| 2-4 column grids | 10/11 sites | 3-column most common |
| Numbered sections (01, 02...) | 3/11 sites | Editorial/process feel |
| Card-based feature display | 8/11 sites | Rounded cards with subtle depth |

### Universal Component Rules

| Pattern | Frequency | Details |
|---------|-----------|---------|
| border-radius 8-24px on cards | 10/11 sites | 12px most common, up to 24px (rounded-3xl) |
| border-radius 8-12px on buttons | 8/11 sites | NOT fully rounded (pill) unless specific style |
| Minimal shadow (shadow-sm or less) | 7/11 sites | Premium = subtle, not dramatic |
| Glassmorphism on nav/cards | 5/11 sites | backdrop-blur + semi-transparent bg |
| Single primary CTA style | 10/11 sites | One button style dominates |
| Lowercase or sentence-case CTAs | 6/11 sites | Not ALL CAPS |

### Universal Animation Rules

| Pattern | Frequency | Details |
|---------|-----------|---------|
| Scroll-triggered fade+slide | 8/11 sites | opacity 0->1, translateY 20-50px->0 |
| Staggered children animations | 6/11 sites | 0.1-0.3s delay between siblings |
| Smooth easing curves | 7/11 sites | cubic-bezier, not linear |
| Marquee/ticker for logos | 3/11 sites | Continuous horizontal scroll |
| Duration 0.6-1.2s for content reveals | 7/11 sites | Not too fast, not too slow |
| Nav transitions 0.2-0.3s | 8/11 sites | Faster for UI, slower for content |
| Blur-to-clear reveal | 3/11 sites | `filter: blur(20px)` to `blur(0)` |

---

## Part 3: Common Mistakes in AI-Generated Sites

### 1. Typography Failures

| Mistake | What Premium Sites Do Instead |
|---------|-------------------------------|
| All text same weight (400) | Headings 500-700, body 400 -- clear hierarchy |
| No letter-spacing adjustments | Negative letter-spacing on headings (-0.02em to -0.04em) |
| Line-height too loose on headings | Display: 1.05-1.15, not 1.5+ |
| Using default browser font rendering | Always add `-webkit-font-smoothing: antialiased` |
| Too many font families (3+) | Max 2: one for display, one for body |
| Body text too small (14px) | 16-18px minimum for body |
| All text pure black (#000) | Near-black (#1a1a1a, #141414) is softer |
| Same line-height for all sizes | Line-height ratio DECREASES as text size increases |
| No fluid scaling | Use `clamp()` or `calc(rem + vw)` for smooth scaling |

### 2. Color & Surface Failures

| Mistake | What Premium Sites Do Instead |
|---------|-------------------------------|
| Too many accent colors | ONE brand color, used at multiple opacities |
| Heavy borders (1-2px solid gray) | Ultra-thin: `rgba(0,0,0,0.05)` or no border at all |
| Pure black shadows | Warm-tinted: `rgba(167,156,138,0.2)` or brand-tinted |
| Aggressive gradients | Subtle: `rgba(255,255,255,0.35)` to `rgba(255,255,255,0.05)` |
| Background = brand color at full saturation | Brand at 3-5% opacity for surfaces |
| Too many surface colors | 2-3 max: white, off-white, and one accent surface |
| Gray (#808080) for borders | Near-invisible borders or none at all |
| Colorful sections (blue bg, then green bg) | White/off-white base, color only as accents |

### 3. Spacing & Layout Failures

| Mistake | What Premium Sites Do Instead |
|---------|-------------------------------|
| Cramped section padding (20-40px) | 80-120px vertical section padding |
| Content stretched to full width | max-width 1140-1200px, centered |
| Uniform section widths | Alternate full-bleed and contained sections |
| Small gaps between cards (8px) | 16-24px gaps between cards |
| No horizontal padding on mobile | 24px minimum side padding |
| Everything centered (text + images) | Mix centered hero with left-aligned body content |
| Cards touching edges | Cards have breathing room within containers |

### 4. Component Failures

| Mistake | What Premium Sites Do Instead |
|---------|-------------------------------|
| Overly rounded buttons (pill shape) | 8-12px border-radius |
| Heavy box shadows on cards | `shadow-sm` or subtle multi-layer shadows |
| Too many button variants | One primary style, one ghost/text style |
| Border on every card | Blur/glass or very subtle border (opacity 0.05) |
| Aggressive hover effects | Subtle: opacity change, slight translate, color shift |
| Generic placeholder images | High-quality, color-graded photography or SVG illustrations |
| Icon-heavy design (icons everywhere) | Selective icon use, mostly in navigation and features |

### 5. Animation Failures

| Mistake | What Premium Sites Do Instead |
|---------|-------------------------------|
| No animations at all | Scroll-triggered fade+slide on every section |
| Linear easing | Cubic-bezier deceleration curves |
| Everything animates at once | Staggered: 0.1-0.3s delay between children |
| Too fast (0.1-0.2s) | Content: 0.6-1.2s, UI: 0.2-0.3s |
| Bouncy/elastic easing | Smooth deceleration: `cubic-bezier(0.165, 0.84, 0.44, 1)` |
| No loading states | Skeleton loaders with `animate-pulse` |

### 6. Structural Failures

| Mistake | What Premium Sites Do Instead |
|---------|-------------------------------|
| No sticky navigation | Fixed nav with backdrop-blur on scroll |
| Missing trust signals | Client logos, testimonials, stats |
| Generic footer | Structured footer with columns, social links, legal |
| No social proof section | Logo wall, testimonial carousel, or stats bar |
| Missing mobile optimization | Touch events, responsive typography, mobile nav patterns |

---

## Part 4: Actionable Prompt Rules

### Global Reset & Foundation

```css
/* MANDATORY: Apply to every generated site */
*, *::before, *::after {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  font-size: 16px;
  text-rendering: optimizeLegibility;
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1a1a1a;
  background: #ffffff;
  line-height: 1.6;
  letter-spacing: -0.011em;
}

/* Hide scrollbar but keep functionality */
::-webkit-scrollbar { display: none; }
body { -ms-overflow-style: none; scrollbar-width: none; }
```

### Typography Scale (Tailwind-compatible)

```css
/* Hero/Display */
.text-display {
  font-size: clamp(2.5rem, 5vw, 4.5rem);  /* 40-72px fluid */
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

/* H1 */
.text-h1 {
  font-size: clamp(2.25rem, 4vw, 3.5rem);  /* 36-56px fluid */
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.12;
}

/* H2 */
.text-h2 {
  font-size: clamp(1.75rem, 3vw, 2.5rem);  /* 28-40px fluid */
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* H3 */
.text-h3 {
  font-size: clamp(1.25rem, 2vw, 1.75rem);  /* 20-28px fluid */
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.25;
}

/* Body Large (subheadings, lead text) */
.text-body-lg {
  font-size: 1.125rem;  /* 18px */
  font-weight: 400;
  letter-spacing: -0.011em;
  line-height: 1.5;
}

/* Body Regular */
.text-body {
  font-size: 1rem;  /* 16px */
  font-weight: 400;
  letter-spacing: -0.011em;
  line-height: 1.6;
}

/* Caption/Small */
.text-sm {
  font-size: 0.875rem;  /* 14px */
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.5;
}
```

### Tailwind Config Extension

```js
// tailwind.config.js extend
{
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  },
  fontSize: {
    'display': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.08', letterSpacing: '-0.035em', fontWeight: '600' }],
    'h1': ['clamp(2.25rem, 4vw, 3.5rem)', { lineHeight: '1.12', letterSpacing: '-0.025em', fontWeight: '600' }],
    'h2': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
    'h3': ['clamp(1.25rem, 2vw, 1.75rem)', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
    'body-lg': ['1.125rem', { lineHeight: '1.5', letterSpacing: '-0.011em', fontWeight: '400' }],
    'body': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.011em', fontWeight: '400' }],
    'caption': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '500' }],
    'overline': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.08em', fontWeight: '600' }],
  },
  colors: {
    // Near-black for text (NOT pure #000)
    foreground: '#1a1a1a',
    'foreground-muted': '#6b7280',
    'foreground-subtle': '#9ca3af',
    // Backgrounds
    background: '#ffffff',
    'surface-1': '#fafafa',
    'surface-2': '#f5f5f5',
    // Borders (very low opacity)
    border: 'rgba(0, 0, 0, 0.06)',
    'border-strong': 'rgba(0, 0, 0, 0.12)',
    // Shadows (warm-tinted)
    'shadow-color': '167 156 138',  // for warm shadows
  },
  spacing: {
    'section-sm': '3rem',      // 48px - mobile sections
    'section': '5rem',          // 80px - default sections
    'section-lg': '6rem',       // 96px - desktop sections
    'section-xl': '7.5rem',     // 120px - hero sections
  },
  maxWidth: {
    'content': '72rem',     // 1152px - main content
    'content-sm': '48rem',  // 768px - narrow content (text-heavy)
    'content-xs': '40rem',  // 640px - very narrow (forms, auth)
    'page': '90rem',        // 1440px - outer boundary
    'full-bleed': '120rem', // 1920px - max full-bleed
  },
  borderRadius: {
    'card': '1rem',       // 16px
    'card-lg': '1.5rem',  // 24px
    'button': '0.75rem',  // 12px
    'input': '0.5rem',    // 8px
    'badge': '0.375rem',  // 6px
  },
  boxShadow: {
    'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    'elevated': '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
    'glow': '0 0 24px 8px rgba(var(--accent-rgb), 0.15)',
    // Warm multi-layer shadow (premium)
    'warm': '0 1px 2px rgba(167,156,138,0.06), 0 4px 12px rgba(167,156,138,0.08)',
  },
}
```

### Section Layout Rules

```css
/* Standard section */
section {
  padding: 5rem 1.5rem;  /* 80px top/bottom, 24px sides */
}

@media (min-width: 768px) {
  section {
    padding: 6rem 3rem;  /* 96px top/bottom, 48px sides */
  }
}

@media (min-width: 1024px) {
  section {
    padding: 7.5rem 4rem;  /* 120px top/bottom, 64px sides */
  }
}

/* Content container */
.container {
  max-width: 1152px;  /* 72rem */
  margin: 0 auto;
  width: 100%;
}

/* Narrow container for text-heavy sections */
.container-narrow {
  max-width: 768px;  /* 48rem */
  margin: 0 auto;
}
```

### Navigation Rules

```css
/* Sticky nav with glass effect */
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 50;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}
```

### Button Rules

```css
/* Primary button */
.btn-primary {
  padding: 0.75rem 1.5rem;  /* 12px 24px */
  border-radius: 0.75rem;   /* 12px */
  font-size: 0.9375rem;     /* 15px */
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.01em;
  transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
  /* NO text-transform: uppercase unless brand specifically requires it */
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Ghost/secondary button */
.btn-ghost {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}
```

### Card Rules

```css
/* Standard card */
.card {
  border-radius: 1rem;        /* 16px */
  padding: 1.5rem;            /* 24px */
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

/* Glass card (for dark/image backgrounds) */
.card-glass {
  border-radius: 1.5rem;      /* 24px */
  padding: 2rem;               /* 32px */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

### Animation Rules (for scroll-triggered reveals)

```css
/* Base state for elements that will animate in */
[data-animate] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s cubic-bezier(0.165, 0.84, 0.44, 1),
              transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
}

[data-animate].visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger children */
[data-animate-stagger] > *:nth-child(1) { transition-delay: 0.0s; }
[data-animate-stagger] > *:nth-child(2) { transition-delay: 0.1s; }
[data-animate-stagger] > *:nth-child(3) { transition-delay: 0.2s; }
[data-animate-stagger] > *:nth-child(4) { transition-delay: 0.3s; }
[data-animate-stagger] > *:nth-child(5) { transition-delay: 0.4s; }

/* Easing reference */
/* Premium deceleration: cubic-bezier(0.165, 0.84, 0.44, 1) */
/* Smooth ease-out: cubic-bezier(0.25, 0.1, 0.25, 1) */
/* Quick UI: cubic-bezier(0.4, 0, 0.2, 1) */
```

### Critical Tailwind Classes to Always Include

```html
<!-- On <html> or <body> -->
class="antialiased"

<!-- On text headings -->
class="tracking-tight"  <!-- equivalent to letter-spacing: -0.025em -->

<!-- On sections -->
class="py-20 md:py-24 lg:py-32 px-6 md:px-12 lg:px-16"

<!-- On content containers -->
class="max-w-6xl mx-auto"  <!-- or max-w-7xl for wider -->

<!-- On cards -->
class="rounded-2xl border border-black/5 bg-white shadow-sm p-6"

<!-- On buttons -->
class="rounded-xl px-6 py-3 text-[15px] font-medium transition-all duration-200"

<!-- On glass nav -->
class="fixed top-0 inset-x-0 h-[72px] backdrop-blur-xl bg-white/80 border-b border-black/5 z-50"

<!-- On hero text -->
class="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold tracking-tighter leading-[1.08]"
```

---

## Part 5: Before/After Comparison Framework

### The 20-Point Premium Website Checklist

Score each indicator 0 (absent), 1 (partially present), or 2 (fully implemented). A premium site scores 34-40. Most AI-generated sites score 10-18.

| # | Indicator | AI Default | Premium Standard | How to Check |
|---|-----------|-----------|-----------------|--------------|
| 1 | **Font smoothing** | Missing | `antialiased` on body/html | Inspect body computed styles |
| 2 | **Heading letter-spacing** | 0 (normal) | -0.02em to -0.04em (negative) | Inspect any h1/h2 element |
| 3 | **Heading line-height** | 1.5+ (too loose) | 1.05-1.2 (tight) | Inspect hero heading |
| 4 | **Text color** | #000000 (pure black) | #1a1a1a or warmer near-black | Inspect body color |
| 5 | **Section padding** | 20-40px | 80-120px vertical | Measure section spacing |
| 6 | **Content max-width** | Full width or too narrow | 1100-1200px centered | Check container width |
| 7 | **Border subtlety** | 1px solid #e5e7eb (visible) | rgba(0,0,0,0.05) (barely visible) | Inspect card borders |
| 8 | **Shadow quality** | `shadow-md` (heavy) | `shadow-sm` or multi-layer subtle | Inspect card shadows |
| 9 | **Button border-radius** | Pill (9999px) or square (4px) | 8-12px (confident, not extreme) | Inspect primary CTA |
| 10 | **Card border-radius** | 4-8px (too small) | 12-24px (modern, generous) | Inspect any card |
| 11 | **Color discipline** | 3+ accent colors | 1 accent, rest neutral at opacities | Count distinct accent hues |
| 12 | **Nav style** | Static, unstyled | Fixed, blur backdrop, subtle border | Scroll page, observe nav |
| 13 | **Scroll animations** | None or all-at-once | Staggered fade+slide, 0.1-0.3s delay | Scroll down, observe reveals |
| 14 | **Animation easing** | Linear or ease (generic) | cubic-bezier deceleration curve | Check transition properties |
| 15 | **Animation duration** | Too fast (<0.3s) or too slow (>2s) | 0.6-1.0s for content, 0.2-0.3s for UI | Time the animations |
| 16 | **Whitespace confidence** | Content crammed together | Generous breathing room, 24-48px gaps | Visual scan for density |
| 17 | **Typography hierarchy** | 2 sizes (heading + body) | 5-7 distinct sizes with clear purpose | Count distinct text sizes |
| 18 | **Image quality** | Stock photos, unstyled | Color-graded, WebP/AVIF, lazy-loaded | Check image format/loading |
| 19 | **Trust signals** | Missing or generic | Logo wall, testimonials, stats | Look for social proof sections |
| 20 | **Mobile nav pattern** | Just a hamburger | Animated mobile menu with transitions | Test on mobile viewport |

### Scoring Guide

| Score | Rating | Interpretation |
|-------|--------|---------------|
| 34-40 | Premium | Indistinguishable from agency-built site |
| 26-33 | Professional | Solid, but missing some polish |
| 18-25 | Template-level | Looks like a theme/template |
| 10-17 | AI-generated | Clearly auto-generated, generic feel |
| 0-9 | Broken | Fundamental design issues |

### The 5 Highest-Impact Quick Wins

If you can only fix 5 things to make an AI site look premium, fix these (in order of impact):

1. **Add antialiased + set text color to #1a1a1a** -- Immediately improves every text element on the page
2. **Add negative letter-spacing and tight line-height to headings** -- Single biggest typography improvement: `tracking-tight leading-[1.1]`
3. **Increase section padding to 80-120px** -- Creates breathing room that signals confidence
4. **Make borders nearly invisible** -- Change `border-gray-200` to `border-black/5` everywhere
5. **Add scroll-triggered fade+slide animations** -- transforms static page into dynamic experience

### The "Squint Test"

Blur your eyes and look at the page from arm's length. A premium site should show:
- Clear visual rhythm (alternating dense/sparse sections)
- One dominant element per section (not competing focal points)
- Generous white space between sections (not uniform density)
- Consistent horizontal alignment (content doesn't jump widths)
- Color restraint (mostly neutral, accent pops are rare and intentional)

If the page looks like a uniform wall of content when blinted at, it fails the premium test.

---

## Appendix: Site-by-Site Technology Stack

| Site | Framework | CSS Approach | Animation Library |
|------|-----------|-------------|-------------------|
| Vibrant Practice | Custom | CSS + vars | GSAP + ScrollTrigger + Lenis |
| RAAD | Next.js | CSS Modules | TBD |
| Photoncycle | Astro | Utility classes | Scroll-driven CSS |
| Ada | Unknown | Unknown | Unknown (403) |
| Onboard | Webflow | Webflow + custom | GSAP |
| Superpower | Webflow | Webflow + custom | Swiper + custom |
| Revitin | Shopify/custom | Inline + CSS | Custom JS |
| Hello Sunset | Webflow | Webflow | Webflow interactions |
| Liftoff | Framer | CSS vars + tokens | Framer Motion |
| Axis Group | Next.js | Tailwind + CSS Modules | Intersection Observer |
| Y Combinator | Custom | Custom CSS | Minimal |

---

## Appendix: The Premium Design Mantra

> **Restraint is the signal.** Premium sites use LESS color, LESS border, LESS shadow, LESS animation -- but what they do use is precisely calibrated. The difference between a premium site and an AI template is not in what's present, but in the precision of every value chosen.

Key numbers to memorize:
- **-0.025em** letter-spacing on headings
- **1.1** line-height on display text
- **#1a1a1a** for text (not #000)
- **rgba(0,0,0,0.05)** for borders
- **80-120px** section padding
- **1152px** content max-width
- **12px** button border-radius
- **16-24px** card border-radius
- **0.8s** animation duration
- **cubic-bezier(0.165, 0.84, 0.44, 1)** for smooth deceleration
