"use client"

import { HOW_IT_WORKS } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Search, Palette, Rocket } from "lucide-react"

const ICON_MAP = { Search, Palette, Rocket } as const

export default function HowItWorks() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="how-it-works"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
          {HOW_IT_WORKS.sectionTitle}
        </h2>
        <p className="mt-4 text-lg text-center opacity-70 max-w-2xl mx-auto">
          {HOW_IT_WORKS.sectionSubtitle}
        </p>

        {/* Desktop: horizontal step cards with connecting lines */}
        <div className="mt-16 hidden sm:grid sm:grid-cols-3 gap-0 relative">
          {HOW_IT_WORKS.steps.map((step, i) => {
            const Icon = ICON_MAP[step.icon as keyof typeof ICON_MAP]
            return (
              <div key={step.number} className="relative text-center px-6">
                {/* Connecting line before step 2 and 3 */}
                {i > 0 && (
                  <div
                    className="absolute top-8 right-1/2 w-full h-px border-t-2 border-dashed border-[var(--mkt-accent)]/30"
                    aria-hidden="true"
                  />
                )}

                {/* Step number circle */}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--mkt-accent)]/10 border-2 border-[var(--mkt-accent)]/30">
                  <span className="text-2xl font-bold text-[var(--mkt-accent)]">
                    {String(step.number).padStart(2, "0")}
                  </span>
                </div>

                {/* Icon */}
                {Icon && (
                  <div className="mt-5 flex justify-center">
                    <Icon className="w-7 h-7 text-[var(--mkt-accent)]" />
                  </div>
                )}

                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 opacity-70 leading-relaxed">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="mt-12 sm:hidden relative">
          {/* Vertical line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-px bg-[var(--mkt-accent)]/20"
            aria-hidden="true"
          />

          <div className="space-y-10">
            {HOW_IT_WORKS.steps.map((step) => {
              const Icon = ICON_MAP[step.icon as keyof typeof ICON_MAP]
              return (
                <div key={step.number} className="relative pl-14">
                  {/* Number circle on the timeline */}
                  <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[var(--mkt-accent)]/10 border-2 border-[var(--mkt-accent)]/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--mkt-accent)]">
                      {String(step.number).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {Icon && (
                      <Icon className="w-5 h-5 text-[var(--mkt-accent)] shrink-0" />
                    )}
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-2 opacity-70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
