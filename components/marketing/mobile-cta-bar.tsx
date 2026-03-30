"use client"

import { useEffect, useState } from "react"

export default function MobileCtaBar() {
  const [dismissed, setDismissed] = useState(false)
  const [unmounted, setUnmounted] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById("hero")
    const footer = document.getElementById("footer")
    if (!hero || !footer) return

    const heroObserver = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0 }
    )

    const footerObserver = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    )

    heroObserver.observe(hero)
    footerObserver.observe(footer)

    return () => {
      heroObserver.disconnect()
      footerObserver.disconnect()
    }
  }, [])

  const visible = !dismissed && !heroVisible && !footerVisible

  if (unmounted) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      onTransitionEnd={() => {
        if (dismissed) setUnmounted(true)
      }}
      role="complementary"
      aria-label="Get started"
    >
      <div className="h-14 flex items-center justify-between gap-3 px-4 bg-[#0A0B0D]/90 backdrop-blur-xl border-t border-[var(--mkt-border-strong)]">
        <p className="text-[13px] text-[var(--mkt-text)] whitespace-nowrap font-medium">
          Custom websites from{" "}
          <span className="text-[var(--mkt-accent)]">$499</span>
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#pricing"
            className="mkt-cta-primary inline-flex items-center px-4 py-2 text-[13px]"
          >
            Get Started
          </a>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex items-center justify-center w-7 h-7 text-[var(--mkt-text-tertiary)] hover:text-[var(--mkt-text)] transition-colors"
            aria-label="Dismiss"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
