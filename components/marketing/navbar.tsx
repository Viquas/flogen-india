"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { NAV } from "@/lib/marketing-constants"

const SECTION_IDS = ["hero", "how-it-works", "portfolio", "pricing", "faq", "contact"]

export default function Navbar() {
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#08090A]/80 backdrop-blur-xl border-b border-[var(--mkt-border)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <a href="#hero" className="flex items-center">
          <Image
            src="/sumosite-logo.svg"
            alt="Somosite"
            width={140}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </a>

        <div className="hidden sm:flex items-center gap-6">
          {NAV.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[13px] transition-colors duration-150 ${
                isActive(link.href)
                  ? "text-[var(--mkt-text)]"
                  : "text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text)]"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/portal"
            className="mkt-cta-secondary inline-flex items-center px-5 py-3 text-[14px]"
          >
            Client Login
          </a>
          <a
            href={NAV.cta.href}
            className="mkt-cta-primary inline-flex items-center px-5 py-3 text-[14px]"
          >
            {NAV.cta.label}
          </a>
        </div>

        <button
          type="button"
          className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-[6px]"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span
            className={`block w-5 h-[1.5px] bg-[var(--mkt-text-secondary)] transition-transform duration-300 origin-center ${
              isOpen ? "rotate-45 translate-y-[3.75px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-[var(--mkt-text-secondary)] transition-transform duration-300 origin-center ${
              isOpen ? "-rotate-45 -translate-y-[3.75px]" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`sm:hidden overflow-hidden transition-[max-height] duration-300 bg-[#08090A]/95 backdrop-blur-xl ${
          isOpen ? "max-h-[400px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
          {NAV.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block py-3.5 text-[15px] transition-colors duration-150 border-b border-[var(--mkt-border)] ${
                isActive(link.href)
                  ? "text-[var(--mkt-text)]"
                  : "text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text)]"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/portal"
            onClick={() => setIsOpen(false)}
            className="mkt-cta-secondary mt-4 inline-flex items-center justify-center px-5 py-2.5 text-[14px]"
          >
            Client Login
          </a>
          <a
            href={NAV.cta.href}
            onClick={() => setIsOpen(false)}
            className="mkt-cta-primary mt-2 inline-flex items-center justify-center px-5 py-2.5 text-[14px]"
          >
            {NAV.cta.label}
          </a>
        </div>
      </div>
    </nav>
  )
}
