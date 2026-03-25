"use client"

import { PROBLEM } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function Problem() {
  const contentRef = useScrollAnimation()

  return (
    <section id="problem" className="py-20 sm:py-28 lg:py-32">
      <div
        ref={contentRef as React.RefObject<HTMLDivElement>}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight">
          {PROBLEM.headline}
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-[var(--mkt-text-secondary)] leading-relaxed">
          {PROBLEM.body}
        </p>
        <p className="mt-8 text-xl sm:text-2xl font-medium text-[var(--mkt-accent)]">
          {PROBLEM.emphasis}
        </p>
      </div>
    </section>
  )
}
