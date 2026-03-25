"use client"

import { useEffect, useState } from "react"
import { NAV } from "@/lib/marketing-constants"

const SECTION_IDS = ["hero", "how-it-works", "portfolio", "pricing", "faq", "contact"]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  // Scroll-based background transition
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

  // Active section highlighting via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // Close mobile menu on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const isActive = (href: string) => activeSection === href.replace("#", "")

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-[16px] shadow-[0_1px_0_rgba(255,255,255,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#hero" className="text-xl font-bold text-white">
          {NAV.logo}
        </a>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-8">
          {NAV.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors duration-150 ${
                isActive(link.href)
                  ? "text-white"
                  : "text-[var(--mkt-text-secondary)] hover:text-white"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="block h-px bg-[var(--mkt-accent)] mt-0.5" />
              )}
            </a>
          ))}
          <a
            href={NAV.cta.href}
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-[var(--mkt-accent)] text-white rounded-[var(--mkt-radius)] hover:opacity-90 transition-opacity"
          >
            {NAV.cta.label}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-[6px]"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span
            className={`block w-5 h-[2px] bg-white transition-transform duration-300 origin-center ${
              isOpen ? "rotate-45 translate-y-[4px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-[2px] bg-white transition-transform duration-300 origin-center ${
              isOpen ? "-rotate-45 -translate-y-[4px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile slide-out panel */}
      <div
        className={`sm:hidden overflow-hidden transition-[max-height] duration-300 bg-[#0A0A0A] ${
          isOpen ? "max-h-[400px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
          {NAV.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block py-4 text-base transition-colors duration-150 border-b border-[var(--mkt-border)] ${
                isActive(link.href)
                  ? "text-[var(--mkt-accent)]"
                  : "text-[var(--mkt-text-secondary)] hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={NAV.cta.href}
            onClick={() => setIsOpen(false)}
            className="mt-4 inline-flex items-center justify-center px-6 py-3 text-base font-medium bg-[var(--mkt-accent)] text-white rounded-[var(--mkt-radius)] hover:opacity-90 transition-opacity"
          >
            {NAV.cta.label}
          </a>
        </div>
      </div>
    </nav>
  )
}
