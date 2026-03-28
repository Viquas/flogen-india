"use client"

import { HOW_IT_WORKS } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { MagnifyingGlass, Palette, Rocket } from "@phosphor-icons/react"

const ICON_MAP = { Search: MagnifyingGlass, Palette, Rocket } as const

export default function HowItWorks() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="how-it-works"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 3rem)" }}>
          {HOW_IT_WORKS.sectionTitle}
        </h2>
        <p className="mt-4 text-[17px] text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {HOW_IT_WORKS.sectionSubtitle}
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW_IT_WORKS.steps.map((step) => {
            const Icon = ICON_MAP[step.icon as keyof typeof ICON_MAP]
            return (
              <div
                key={step.number}
                className="bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-border)] rounded-xl p-8 hover:border-[var(--mkt-border-strong)] transition-colors"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[13px] font-mono text-[var(--mkt-text-tertiary)]">
                    {String(step.number).padStart(2, "0")}
                  </span>
                  {Icon && (
                    <Icon className="w-4 h-4 text-[var(--mkt-text-secondary)]" />
                  )}
                </div>

                <h3 className="text-[17px] font-semibold text-[var(--mkt-text)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] text-[var(--mkt-text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
