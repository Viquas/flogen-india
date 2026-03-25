"use client"

import { PORTFOLIO } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Gauge, Smartphone, Database } from "lucide-react"

const ICON_MAP = { Gauge, Smartphone, Database } as const

/** Industry-specific gradient pairs for each portfolio card screenshot area. */
const CARD_GRADIENTS = [
  "from-[#1a0f0a] to-[#2a1a10]", // Restaurant — warm
  "from-[#0a1a1a] to-[#102a2a]", // Dental — teal
  "from-[#0f0a1a] to-[#1a102a]", // Law — deep purple
  "from-[#1a1a0a] to-[#2a2a10]", // Auto — gold
  "from-[#0a1a0f] to-[#102a1a]", // Yoga — green
  "from-[#1a0a0a] to-[#2a1010]", // Barbershop — red
] as const

export default function Portfolio() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="portfolio"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-16 sm:py-24 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
          {PORTFOLIO.sectionTitle}
        </h2>
        <p className="mt-4 text-lg text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {PORTFOLIO.sectionSubtitle}
        </p>

        {/* Portfolio grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {PORTFOLIO.items.map((item, i) => (
            <div
              key={item.name}
              className="group hover:translate-y-[-2px] transition-transform"
            >
              {/* Browser mockup frame */}
              <div className="rounded-xl border border-[var(--mkt-border)] bg-[#111] overflow-hidden group-hover:border-[var(--mkt-accent)]/30 transition-colors">
                {/* Title bar */}
                <div className="h-7 flex items-center gap-1.5 px-3 bg-[#1A1A1A] border-b border-[var(--mkt-border)]">
                  <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                  <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                  <span className="w-2 h-2 rounded-full bg-[#28C840]" />
                </div>

                {/* Screenshot area with industry gradient */}
                <div
                  className={`aspect-video bg-gradient-to-br ${CARD_GRADIENTS[i] ?? CARD_GRADIENTS[0]}`}
                >
                  {/* Placeholder website layout lines */}
                  <div className="p-4 space-y-3 h-full flex flex-col justify-between">
                    {/* Nav bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-[var(--mkt-accent)]/20" />
                      <div className="h-1.5 w-16 rounded bg-white/10" />
                      <div className="ml-auto flex gap-2">
                        <div className="h-1.5 w-8 rounded bg-white/8" />
                        <div className="h-1.5 w-8 rounded bg-white/8" />
                        <div className="h-1.5 w-8 rounded bg-white/8" />
                      </div>
                    </div>

                    {/* Headline block */}
                    <div className="flex-1 flex items-center px-2">
                      <div className="space-y-2 max-w-[65%]">
                        <div className="h-3 w-32 rounded bg-white/12" />
                        <div className="h-2 w-24 rounded bg-white/8" />
                        <div className="h-2 w-28 rounded bg-white/6" />
                        <div className="mt-3 h-6 w-20 rounded-md bg-[var(--mkt-accent)]/30" />
                      </div>
                    </div>

                    {/* Content blocks */}
                    <div className="flex gap-2 px-2">
                      <div className="h-10 flex-1 rounded-lg bg-white/4" />
                      <div className="h-10 flex-1 rounded-lg bg-white/4" />
                      <div className="h-10 flex-1 rounded-lg bg-white/4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card info */}
              <div className="mt-4">
                <h3 className="text-lg font-medium">{item.name}</h3>
                <p className="text-sm text-[var(--mkt-text-tertiary)]">
                  {item.category}
                </p>
                <a
                  href={item.demoUrl}
                  className="text-sm text-[var(--mkt-accent)] hover:underline mt-1 inline-block"
                >
                  View Demo
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Quality badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {PORTFOLIO.qualityBadges.map((badge) => {
            const Icon = ICON_MAP[badge.icon as keyof typeof ICON_MAP]
            return (
              <span
                key={badge.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--mkt-border)] text-sm text-[var(--mkt-text-secondary)]"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {badge.label}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
