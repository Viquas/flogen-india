"use client"

import { FINAL_CTA } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function FinalCta() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="final-cta"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20 bg-gradient-to-b from-[#0F0F12] to-[#0A0A0A]"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-[32px] sm:text-[48px] lg:text-[56px] leading-tight">
          {FINAL_CTA.headline}
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {FINAL_CTA.subheadline}
        </p>
        <p className="mt-3 text-sm italic text-[var(--mkt-text-secondary)]">
          {FINAL_CTA.scarcity}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={FINAL_CTA.primaryCtaHref}
            className="inline-flex items-center justify-center px-8 py-4 bg-[var(--mkt-accent)] text-white font-medium rounded-[var(--mkt-radius)] hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            {FINAL_CTA.primaryCta}
          </a>
          <a
            href={FINAL_CTA.secondaryCtaHref}
            className="inline-flex items-center justify-center px-8 py-4 text-[var(--mkt-text-secondary)] hover:text-white transition-colors w-full sm:w-auto"
          >
            {FINAL_CTA.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  )
}
