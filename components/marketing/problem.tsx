"use client"

import { PROBLEM } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function Problem() {
  const contentRef = useScrollAnimation()

  return (
    <section id="problem" className="py-28 sm:py-36 lg:py-40">
      <div
        ref={contentRef as React.RefObject<HTMLDivElement>}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center"
      >
        <div className="w-12 h-px bg-[var(--mkt-border-strong)] mx-auto mb-12" />
        <h2 className="leading-tight tracking-[-0.02em]" style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 3rem)" }}>
          {PROBLEM.headline}
        </h2>
        <p className="mt-6 text-[17px] sm:text-[19px] text-[var(--mkt-text-secondary)] leading-relaxed">
          {PROBLEM.body}
        </p>
        <p className="mt-8 text-lg sm:text-xl font-medium text-[var(--mkt-accent)]">
          {PROBLEM.emphasis}
        </p>
      </div>
    </section>
  )
}
