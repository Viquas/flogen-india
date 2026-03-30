"use client"

import { PORTFOLIO } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import Image from "next/image"

/** Industry-specific subtle gradient pairs for each portfolio card. */
const CARD_GRADIENTS = [
  "from-[#1a120a]/80 via-[#0c0c14] to-[#0c0c14]", // Restaurant — warm amber
  "from-[#0a1a1a]/80 via-[#0c0c14] to-[#0c0c14]", // Dental — teal
  "from-[#0f0a1a]/80 via-[#0c0c14] to-[#0c0c14]", // Law — deep indigo
  "from-[#1a1a0a]/80 via-[#0c0c14] to-[#0c0c14]", // Auto — gold
  "from-[#0a1a0f]/80 via-[#0c0c14] to-[#0c0c14]", // Yoga — sage
  "from-[#1a0a0f]/80 via-[#0c0c14] to-[#0c0c14]", // Barbershop — muted rose
] as const

/** Map portfolio slugs to screenshot filenames (when available) */
const SCREENSHOT_MAP: Record<string, string> = {
  "/preview/the-olive-table": "/portfolio/the-olive-table.png",
  "/preview/bright-smile-dental": "/portfolio/bright-smile-dental.png",
  "/preview/morrison-associates": "/portfolio/morrison-associates.png",
  "/preview/elite-auto-detailing": "/portfolio/elite-auto-detailing.png",
  "/preview/flow-yoga-studio": "/portfolio/flow-yoga-studio.png",
  "/preview/the-gentlemans-cut": "/portfolio/the-gentlemans-cut.png",
}

function PlaceholderSite({ gradient }: { gradient: string }) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-b ${gradient} p-5 flex flex-col justify-between`}>
      {/* Nav hint */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white/6" />
          <div className="h-1.5 w-16 rounded-full bg-white/8" />
        </div>
        <div className="flex gap-3">
          <div className="h-1.5 w-8 rounded-full bg-white/5" />
          <div className="h-1.5 w-8 rounded-full bg-white/5" />
          <div className="h-6 w-14 rounded bg-white/6" />
        </div>
      </div>
      {/* Hero hint */}
      <div className="flex-1 flex items-center">
        <div className="space-y-2.5 max-w-[60%]">
          <div className="h-3 w-32 rounded-full bg-white/10" />
          <div className="h-2 w-24 rounded-full bg-white/6" />
          <div className="h-2 w-28 rounded-full bg-white/4" />
          <div className="mt-3 h-7 w-20 rounded bg-white/8" />
        </div>
      </div>
      {/* Cards hint */}
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 rounded bg-white/3" />
        <div className="h-10 rounded bg-white/3" />
        <div className="h-10 rounded bg-white/3" />
      </div>
    </div>
  )
}

export default function Portfolio() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="portfolio"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {PORTFOLIO.sectionTitle}
        </h2>
        <p className="mt-4 text-[17px] text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {PORTFOLIO.sectionSubtitle}
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PORTFOLIO.items.map((item, i) => {
            const screenshot = SCREENSHOT_MAP[item.demoUrl]
            const hasScreenshot = false // Set to true once screenshots are captured
            return (
              <a
                key={item.name}
                href={item.demoUrl}
                className="group block"
              >
                {/* Browser frame */}
                <div className="rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-bg-elevated)] overflow-hidden hover:border-[var(--mkt-border-strong)] transition-colors">
                  {/* Screenshot / Placeholder */}
                  <div className="aspect-video relative overflow-hidden">
                    {hasScreenshot && screenshot ? (
                      <Image
                        src={screenshot}
                        alt={`${item.name} website preview`}
                        fill
                        className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <PlaceholderSite gradient={CARD_GRADIENTS[i] ?? CARD_GRADIENTS[0]} />
                    )}
                  </div>
                </div>

                {/* Card info */}
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <h3 className="text-[15px] font-medium text-[var(--mkt-text)]">
                      {item.name}
                    </h3>
                    <p className="text-[13px] text-[var(--mkt-text-tertiary)]">
                      {item.category}
                    </p>
                  </div>
                  <span className="text-[13px] text-[var(--mkt-text-tertiary)] group-hover:text-[var(--mkt-text-secondary)] transition-colors">
                    View →
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
