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
      className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
          {BENEFITS.sectionTitle}
        </h2>
        <p className="mt-4 text-lg text-center opacity-70 max-w-2xl mx-auto">
          What makes us different from template builders and generic agencies.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.items.map((item) => {
            const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]
            return (
              <div
                key={item.title}
                className="rounded-xl p-6 transition-colors hover:bg-gray-100/80"
              >
                {/* Icon circle */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--mkt-accent)]/10">
                  {Icon && (
                    <Icon className="w-6 h-6 text-[var(--mkt-accent)]" />
                  )}
                </div>

                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 opacity-70 leading-relaxed">
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
