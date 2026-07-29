# AU Marketing Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new `/au` landing page within the existing `(marketing)` route group, positioned for Sydney with two offer lines (Websites / AI Automation), AUD pricing, and ABN/local trust signals — without touching the existing agency page at `/`.

**Architecture:** Reuse the existing `(marketing)` layout (already isolated fonts/DLS from admin/client, per existing `app/(marketing)/layout.tsx`). New route `app/(marketing)/au/page.tsx` composes a new constants file (`lib/marketing-constants-au.ts`, following the existing "single source of truth" convention) with new AU-specific components under `components/marketing-au/`, forked rather than parameterized — the existing `components/marketing/*` components hardcode imports from `lib/marketing-constants.ts`, so forking avoids any risk of regressing the working agency page.

**Tech Stack:** Next.js App Router, Tailwind CSS 4, existing `useScrollAnimation` hook, existing CSS-only animation system from `(marketing)/layout.tsx`.

## Global Constraints

- The existing `/` agency page and its components/constants must not change — this is fully additive.
- Reuse the `(marketing)` layout's font stack, dark DLS, and CSS-only scroll animations — do not introduce a new design system.
- "Never say AI" rule applies to the **website offer** messaging only — the **AI automation** offer is expected to name AI explicitly (per spec, this is a deliberate exception).
- CTA buttons scroll to the contact form section — payment happens downstream on `/claim/[slug]`, not on this landing page (per spec).
- No new UI library dependencies — match the existing hand-coded component approach (per the existing marketing page's own decision log).
- Mobile-first responsive, matching the existing agency page's Tailwind breakpoint conventions.

---

### Task 1: AU marketing constants

**Files:**
- Create: `lib/marketing-constants-au.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: exported const objects `NAV_AU`, `HERO_AU`, `TRUST_SIGNALS_AU`, `OFFERS_AU`, `PRICING_AU`, `FAQ_AU`, `FOOTER_AU` — consumed by Tasks 3-6.

- [ ] **Step 1: Write the constants file**

```ts
// AU marketing copy constants — single source of truth for the Sydney landing page.
// Mirrors the shape of lib/marketing-constants.ts but is fully independent —
// editing this file never affects the existing agency page at `/`.

export const NAV_AU = {
  logo: "Somosite",
  links: [
    { label: "Offers", href: "#offers" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: { label: "Get In Touch", href: "#contact" },
} as const

export const HERO_AU = {
  headline: "Websites and AI automation for Sydney businesses",
  subheadline:
    "We build professional websites for businesses that don't have one, and add AI automation — missed-call text-back, online booking, smart FAQs — for businesses ready to stop losing customers to manual processes. Sydney-based.",
  primaryCta: "See What We Offer",
  secondaryCta: "View Pricing",
  primaryCtaHref: "#offers",
  secondaryCtaHref: "#pricing",
} as const

export const TRUST_SIGNALS_AU = [
  { icon: "MapPin", label: "Sydney-Based" },
  { icon: "Shield", label: "30-Day Money-Back Guarantee" },
  { icon: "CheckCircle", label: "Full Ownership, No Lock-In" },
  { icon: "Clock", label: "Live in Days, Not Weeks" },
] as const

export const OFFERS_AU = {
  sectionTitle: "Two Ways We Help Sydney Businesses",
  sectionSubtitle: "Pick what fits — or do both.",
  offers: [
    {
      key: "website",
      title: "A Website That Actually Converts",
      description:
        "For businesses with no website, or one that's embarrassingly out of date. Built from your real business data — your services, your reviews, your photos. No templates, no stock content.",
      bullets: [
        "Custom-built from your actual business info",
        "Mobile-optimized, fast-loading",
        "Live in days",
      ],
      cta: "Get My Website",
    },
    {
      key: "automation",
      title: "AI Automation That Stops the Leaks",
      description:
        "For businesses with a website already, but losing customers to missed calls, manual booking, and slow replies. We add AI where it saves you the most time and the most lost business.",
      bullets: [
        "Missed-call text-back so no enquiry goes cold",
        "AI-powered booking and appointment reminders",
        "Smart FAQ / quote bots that answer instantly",
      ],
      cta: "Automate My Business",
    },
  ],
} as const

export const PRICING_AU = {
  sectionTitle: "Simple Pricing, AUD",
  sectionSubtitle: "No hidden fees. No lock-in contracts.",
  anchoring: "Most Sydney agencies charge $3,000+ for a website that looks like everyone else's.",
  currency: "AUD",
  tiers: [
    {
      name: "Website — Standard",
      price: "TBD",
      description: "A professional, mobile-ready website built from your real business data.",
      features: ["Custom design from your data", "Mobile-optimized", "Live in days", "30-day guarantee"],
      highlighted: false,
    },
    {
      name: "Website + Automation — Pro",
      price: "TBD",
      description: "Everything in Standard, plus one AI automation (booking or missed-call text-back).",
      features: ["Everything in Standard", "One AI automation included", "Priority support", "30-day guarantee"],
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Automation Only",
      price: "TBD",
      description: "Already have a website you like? Add AI automation on its own.",
      features: ["Missed-call text-back or AI booking", "Works with your existing site", "Live in days"],
      highlighted: false,
    },
  ],
} as const

export const FAQ_AU = {
  sectionTitle: "Questions Sydney Businesses Ask",
  items: [
    {
      question: "Are you actually based in Sydney?",
      answer: "Yes — we work directly with Sydney businesses and can meet or call at a time that suits your hours.",
    },
    {
      question: "What's the difference between the website and automation offers?",
      answer: "The website offer is for businesses with no site or an outdated one. The automation offer adds AI tools — like missed-call text-back or online booking — to a business that already has a website but is losing enquiries to manual processes.",
    },
    {
      question: "How fast can I go live?",
      answer: "Most websites are ready to review within days, not weeks. Automation add-ons are typically live within a few business days of confirming scope.",
    },
    {
      question: "Do I own the website afterwards?",
      answer: "Yes — full ownership, no lock-in. You can move hosting or make changes whenever you want.",
    },
  ],
} as const

export const FOOTER_AU = {
  tagline: "Websites and AI automation for Sydney businesses.",
  abn: "ABN: TBD",
  location: "Sydney, NSW, Australia",
  links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
  ],
} as const
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors — this file has no external dependencies.

- [ ] **Step 3: Commit**

```bash
git add lib/marketing-constants-au.ts
git commit -m "feat: add AU marketing copy constants for Sydney landing page"
```

---

### Task 2: AU page route and metadata

**Files:**
- Create: `app/(marketing)/au/page.tsx`
- Create: `app/(marketing)/au/layout.tsx`

**Interfaces:**
- Consumes: nothing yet (composed in later tasks).
- Produces: route `/au`, with its own `<Metadata>` distinct from the root agency page's metadata (nested layout overrides `metadataBase`-relative title/description without touching the parent `(marketing)/layout.tsx`).

- [ ] **Step 1: Create the nested layout for AU-specific metadata**

Next.js merges nested layout metadata with the parent — this lets `/au` have its own title/OG tags while still inheriting the parent's fonts/DLS `<div>` wrapper.

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Somosite — Websites & AI Automation for Sydney Businesses",
  description:
    "Professional websites and AI automation for Sydney businesses. Built from your real business data. Sydney-based, live in days.",
  alternates: {
    canonical: "https://somosite.com/au",
  },
  openGraph: {
    title: "Somosite — Websites & AI Automation for Sydney Businesses",
    description:
      "Professional websites and AI automation for Sydney businesses. Built from your real business data. Sydney-based, live in days.",
    url: "https://somosite.com/au",
    siteName: "Somosite",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somosite — Websites & AI Automation for Sydney Businesses",
    description:
      "Professional websites and AI automation for Sydney businesses. Built from your real business data. Sydney-based, live in days.",
  },
}

export default function AuLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 2: Create the page shell (components added in later tasks)**

```tsx
import NavbarAu from "@/components/marketing-au/navbar-au"
import HeroAu from "@/components/marketing-au/hero-au"
import TrustBarAu from "@/components/marketing-au/trust-bar-au"
import OffersAu from "@/components/marketing-au/offers-au"
import PricingAu from "@/components/marketing-au/pricing-au"
import FaqAu from "@/components/marketing-au/faq-au"
import FooterAu from "@/components/marketing-au/footer-au"
import ContactForm from "@/components/marketing/contact-form"
import MobileCtaBar from "@/components/marketing/mobile-cta-bar"

export default function AuMarketingPage() {
  return (
    <>
      <NavbarAu />
      <HeroAu />
      <TrustBarAu />
      <OffersAu />
      <PricingAu />
      <FaqAu />
      <ContactForm />
      <FooterAu />
      <MobileCtaBar />
    </>
  )
}
```

`ContactForm` and `MobileCtaBar` are reused as-is from `components/marketing/` — their copy is generic ("get in touch", scroll-to-contact) and not agency/India-specific, so no fork is needed for these two.

- [ ] **Step 3: Verify the route builds (components don't exist yet — expect a build error, that's correct at this point)**

Run: `npx tsc --noEmit`
Expected: FAIL — missing modules `@/components/marketing-au/*`. This confirms the route file is wired correctly; the missing components are created in Tasks 3-5.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)/au/page.tsx" "app/(marketing)/au/layout.tsx"
git commit -m "feat: add /au route shell for Sydney landing page"
```

---

### Task 3: Navbar and Hero (AU)

**Files:**
- Create: `components/marketing-au/navbar-au.tsx`
- Create: `components/marketing-au/hero-au.tsx`

**Interfaces:**
- Consumes: `NAV_AU`, `HERO_AU` from `lib/marketing-constants-au.ts` (Task 1).
- Produces: rendered nav + hero sections for `/au`.

- [ ] **Step 1: Create `components/marketing-au/navbar-au.tsx`**

Adapted from `components/marketing/navbar.tsx` with `SECTION_IDS` updated to match the AU page's actual section IDs (`offers` replaces `how-it-works`/`portfolio`, no `pricing`→same, `faq`→same):

```tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { NAV_AU } from "@/lib/marketing-constants-au"

const SECTION_IDS = ["hero", "offers", "pricing", "faq", "contact"]

export default function NavbarAu() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 80)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.3, rootMargin: "-72px 0px -50% 0px" }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const isActive = (href: string) => activeSection === href.replace("#", "")

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="mkt-navbar-float flex items-center justify-between px-4 sm:px-6 py-3">
          <a href="#hero" className="text-[15px] font-semibold text-[var(--mkt-text)]">
            {NAV_AU.logo}
          </a>
          <div className="hidden md:flex items-center gap-6">
            {NAV_AU.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-[14px] transition-colors ${
                  isActive(link.href) ? "text-[var(--mkt-text)]" : "text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text)]"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
          <a href={NAV_AU.cta.href} className="mkt-cta-primary hidden md:inline-flex items-center px-4 py-2 text-[14px] rounded-lg">
            {NAV_AU.cta.label}
          </a>
          <button
            className="md:hidden text-[var(--mkt-text)]"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create `components/marketing-au/hero-au.tsx`**

```tsx
"use client"

import { HERO_AU } from "@/lib/marketing-constants-au"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function HeroAu() {
  const textRef = useScrollAnimation({ threshold: 0.1 })

  return (
    <section id="hero" className="relative">
      <div className="h-[120px] sm:h-[160px] lg:h-[200px]" />

      <div
        ref={textRef as React.RefObject<HTMLDivElement>}
        className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8"
      >
        <h1
          className="tracking-[-0.01em] leading-[1.1] text-center mx-auto"
          style={{ fontSize: "clamp(2rem, 3.5vw + 0.5rem, 4.5rem)" }}
        >
          {HERO_AU.headline}
        </h1>

        <div className="h-6 sm:h-8" />

        <p className="text-[17px] sm:text-[19px] text-[var(--mkt-text-secondary)] text-center max-w-2xl mx-auto leading-relaxed">
          {HERO_AU.subheadline}
        </p>

        <div className="h-10 sm:h-12" />

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href={HERO_AU.primaryCtaHref} className="mkt-cta-primary inline-flex items-center px-6 py-3 text-[15px] rounded-lg">
            {HERO_AU.primaryCta}
          </a>
          <a href={HERO_AU.secondaryCtaHref} className="mkt-cta-secondary inline-flex items-center px-6 py-3 text-[15px] rounded-lg">
            {HERO_AU.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/marketing-au/navbar-au.tsx components/marketing-au/hero-au.tsx
git commit -m "feat: add AU navbar and hero components"
```

---

### Task 4: Offers section (the two-offer differentiator)

**Files:**
- Create: `components/marketing-au/offers-au.tsx`
- Create: `components/marketing-au/trust-bar-au.tsx`

**Interfaces:**
- Consumes: `OFFERS_AU`, `TRUST_SIGNALS_AU` from `lib/marketing-constants-au.ts` (Task 1).
- Produces: the section that visually distinguishes the AU page from the single-offer agency page.

- [ ] **Step 1: Create `components/marketing-au/trust-bar-au.tsx`**

```tsx
"use client"

import { MapPin, Shield, CheckCircle, Clock } from "@phosphor-icons/react"
import { TRUST_SIGNALS_AU } from "@/lib/marketing-constants-au"

const ICON_MAP = { MapPin, Shield, CheckCircle, Clock } as const

export default function TrustBarAu() {
  return (
    <section className="py-8 border-y border-[var(--mkt-border)]">
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUST_SIGNALS_AU.map((signal) => {
            const Icon = ICON_MAP[signal.icon as keyof typeof ICON_MAP]
            return (
              <div key={signal.label} className="flex items-center gap-2 text-[14px] text-[var(--mkt-text-secondary)]">
                <Icon size={16} weight="regular" />
                <span>{signal.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `components/marketing-au/offers-au.tsx`**

```tsx
"use client"

import { OFFERS_AU } from "@/lib/marketing-constants-au"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Check } from "@phosphor-icons/react"

export default function OffersAu() {
  const sectionRef = useScrollAnimation()

  return (
    <section id="offers" ref={sectionRef as React.RefObject<HTMLElement>} className="py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {OFFERS_AU.sectionTitle}
        </h2>
        <p className="mt-4 text-[17px] text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {OFFERS_AU.sectionSubtitle}
        </p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {OFFERS_AU.offers.map((offer) => (
            <div
              key={offer.key}
              className="rounded-xl p-8 bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-border)]"
            >
              <h3 className="text-[22px] font-semibold text-[var(--mkt-text)]">{offer.title}</h3>
              <p className="mt-3 text-[15px] text-[var(--mkt-text-secondary)] leading-relaxed">
                {offer.description}
              </p>
              <ul className="mt-6 space-y-3">
                {offer.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[14px] text-[var(--mkt-text)]">
                    <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-[var(--mkt-accent)]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="mkt-cta-primary mt-8 inline-flex items-center px-5 py-2.5 text-[14px] rounded-lg"
              >
                {offer.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/marketing-au/offers-au.tsx components/marketing-au/trust-bar-au.tsx
git commit -m "feat: add AU two-offer section and trust bar"
```

---

### Task 5: Pricing, FAQ, and Footer (AU)

**Files:**
- Create: `components/marketing-au/pricing-au.tsx`
- Create: `components/marketing-au/faq-au.tsx`
- Create: `components/marketing-au/footer-au.tsx`

**Interfaces:**
- Consumes: `PRICING_AU`, `FAQ_AU`, `FOOTER_AU` from `lib/marketing-constants-au.ts` (Task 1).
- Produces: final three sections completing the `/au` page.

- [ ] **Step 1: Create `components/marketing-au/pricing-au.tsx`**

```tsx
"use client"

import { PRICING_AU } from "@/lib/marketing-constants-au"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Check } from "@phosphor-icons/react"

export default function PricingAu() {
  const sectionRef = useScrollAnimation()

  return (
    <section id="pricing" ref={sectionRef as React.RefObject<HTMLElement>} className="py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {PRICING_AU.sectionTitle}
        </h2>
        <p className="mt-4 text-[17px] text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {PRICING_AU.sectionSubtitle}
        </p>
        <p className="mt-6 text-[15px] italic text-center text-[var(--mkt-text-secondary)] max-w-xl mx-auto">
          {PRICING_AU.anchoring}
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {PRICING_AU.tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl p-8 transition-colors ${
                tier.highlighted
                  ? "order-first sm:order-none bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-accent)]/30"
                  : "bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-border)]"
              }`}
            >
              {"badge" in tier && tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block px-3 py-1 text-[11px] font-medium bg-[var(--mkt-accent-muted)] text-[var(--mkt-accent)] rounded-full whitespace-nowrap">
                  {tier.badge}
                </span>
              )}
              <h3 className="text-[17px] font-semibold text-[var(--mkt-text)]">{tier.name}</h3>
              <p className="mt-2 text-[13px] text-[var(--mkt-text-secondary)]">{tier.description}</p>
              <p className="mt-4 text-[28px] font-semibold text-[var(--mkt-text)]">
                {tier.price === "TBD" ? "Contact Us" : `${tier.price} ${PRICING_AU.currency}`}
              </p>
              <ul className="mt-6 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px] text-[var(--mkt-text-secondary)]">
                    <Check size={14} weight="bold" className="mt-0.5 shrink-0 text-[var(--mkt-accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

Note: `tier.price === "TBD"` renders "Contact Us" — per the design spec's open item, exact AUD pricing is a pending business decision. This is not a placeholder in the forbidden sense (it's a real, intentional UI state for an unset price), but it must be replaced with real numbers before this page goes live publicly. Flagged again in Self-Review Notes below.

- [ ] **Step 2: Create `components/marketing-au/faq-au.tsx`**

```tsx
"use client"

import { useState } from "react"
import { FAQ_AU } from "@/lib/marketing-constants-au"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { CaretDown } from "@phosphor-icons/react"

export default function FaqAu() {
  const sectionRef = useScrollAnimation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" ref={sectionRef as React.RefObject<HTMLElement>} className="py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {FAQ_AU.sectionTitle}
        </h2>

        <div className="mt-12 space-y-3">
          {FAQ_AU.items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={item.question} className="rounded-lg border border-[var(--mkt-border)] overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-[15px] font-medium text-[var(--mkt-text)]"
                >
                  <span>{item.question}</span>
                  <CaretDown
                    size={16}
                    className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-[14px] text-[var(--mkt-text-secondary)] leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `components/marketing-au/footer-au.tsx`**

```tsx
import { FOOTER_AU } from "@/lib/marketing-constants-au"

export default function FooterAu() {
  return (
    <footer id="footer-au" className="border-t border-[var(--mkt-border)] py-12">
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[15px] font-semibold text-[var(--mkt-text)]">Somosite</p>
            <p className="mt-1 text-[13px] text-[var(--mkt-text-secondary)]">{FOOTER_AU.tagline}</p>
            <p className="mt-3 text-[12px] text-[var(--mkt-text-tertiary)]">
              {FOOTER_AU.location} · {FOOTER_AU.abn}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {FOOTER_AU.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run TypeScript check for the full page**

Run: `npx tsc --noEmit`
Expected: no errors — all imports in `app/(marketing)/au/page.tsx` now resolve.

- [ ] **Step 5: Commit**

```bash
git add components/marketing-au/pricing-au.tsx components/marketing-au/faq-au.tsx components/marketing-au/footer-au.tsx
git commit -m "feat: add AU pricing, FAQ, and footer components"
```

---

### Task 6: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server and load the page**

Run: `npm run dev`, then open `http://localhost:3000/au` in a browser.
Expected: page renders with dark DLS matching the existing agency page's visual language, hero shows the two-offer headline, Offers section shows two distinct cards (Website / AI Automation), Pricing shows "Contact Us" for all three tiers (expected, since exact AUD pricing is still TBD), Footer shows "Sydney, NSW, Australia" and placeholder ABN line.

- [ ] **Step 2: Verify mobile responsiveness**

Resize the browser viewport to 375px width (or use browser devtools device emulation).
Expected: hero, offers cards stack to single column, nav collapses to hamburger menu, no horizontal scroll.

- [ ] **Step 3: Verify the existing `/` agency page is unaffected**

Navigate to `http://localhost:3000/` in the same session.
Expected: renders exactly as before — no visual or content changes, confirming the AU page is fully additive.

- [ ] **Step 4: Verify CTA scroll behavior**

Click "See What We Offer" and "Get In Touch" buttons.
Expected: page scrolls smoothly to `#offers` and `#contact` respectively — no navigation to a payment page (per the "CTA scrolls to contact, not payment" constraint).

---

## Self-Review Notes

- **Spec coverage:** Sydney positioning (Hero, Footer), two offer lines (Offers section — the core differentiator), AUD pricing (Pricing, currency field), ABN + trust footer (Footer), reuse of existing DLS/fonts (layout reuse, no new design system), "never say AI" exception for the automation offer (Offers copy explicitly names "AI automation," "AI-powered booking," etc. — intentional per spec).
- **Placeholder scan:** `ABN: TBD` and `price: "TBD"` are flagged real business-decision gaps (pricing numbers, ABN registration — both explicitly deferred in the approved spec's "Open Items for Planning Phase"), not implementation placeholders. **Before this page is made public, these two values must be filled in** — this is a hard blocker for launch, not an optional polish item.
- **Route group decision resolved:** per the spec's open item, this plan resolves to "reuse `(marketing)` layout, add `/au` sub-route" rather than a fully separate route group — the existing layout is already isolated from admin/client and already has the right dark/premium DLS; a second isolated layout would duplicate the font-loading and CSS-injection work in `app/(marketing)/layout.tsx` for no benefit.
- **Component fork vs share decision:** existing `components/marketing/*` components hardcode their constants import path, so sharing them would require either prop-threading (bigger, riskier change touching working agency-page code) or forking (chosen — zero risk to `/`). `ContactForm` and `MobileCtaBar` are reused unforked since their copy is already market-neutral.
