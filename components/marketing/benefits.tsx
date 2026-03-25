"use client"

import { BENEFITS } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Database, Fingerprint, Smartphone, Zap, ShieldCheck } from "lucide-react"

const ICON_MAP = { Database, Fingerprint, Smartphone, Zap, ShieldCheck } as const

export default function Benefits() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="benefits"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {BENEFITS.sectionTitle}
        </h2>
        <p className="mt-4 text-[17px] text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          What makes us different from template builders and generic agencies.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.items.map((item) => {
            const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]
            return (
              <div
                key={item.title}
                className="bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-border)] rounded-xl p-8 hover:border-[var(--mkt-border-strong)] transition-colors"
              >
                {Icon && (
                  <Icon className="w-5 h-5 text-[var(--mkt-text-tertiary)] mb-5" />
                )}
                <h3 className="text-[16px] font-medium text-[var(--mkt-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] text-[var(--mkt-text-secondary)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
