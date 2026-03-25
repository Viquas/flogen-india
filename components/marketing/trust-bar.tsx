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
      className="py-6 sm:py-8 border-y border-[var(--mkt-border)]"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {TRUST_SIGNALS.map((signal) => {
            const Icon = ICON_MAP[signal.icon as keyof typeof ICON_MAP]
            return (
              <div key={signal.label} className="flex flex-col items-center text-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-[var(--mkt-text-tertiary)]" />}
                <p className="text-[13px] text-[var(--mkt-text-secondary)]">{signal.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
