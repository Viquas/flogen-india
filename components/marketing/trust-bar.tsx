"use client"

import { TRUST_SIGNALS } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { CheckCircle, Shield, BarChart, Clock } from "lucide-react"

const ICON_MAP = { CheckCircle, Shield, BarChart, Clock } as const

export default function TrustBar() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="trust"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-12 sm:py-16 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)]"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {TRUST_SIGNALS.map((signal) => {
            const Icon = ICON_MAP[signal.icon as keyof typeof ICON_MAP]
            return (
              <div key={signal.label} className="flex flex-col items-center text-center">
                {Icon && <Icon className="w-6 h-6 text-[var(--mkt-accent)] mb-3" />}
                <p className="text-sm sm:text-base font-medium">{signal.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
