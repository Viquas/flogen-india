"use client"

import { FINAL_CTA } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function FinalCta() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="final-cta"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-32 sm:py-40 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="leading-tight tracking-[-0.01em]" style={{ fontSize: "clamp(2rem, 3vw + 0.5rem, 3.5rem)" }}>
          {FINAL_CTA.headline}
        </h2>
        <p className="mt-6 text-[17px] sm:text-[19px] text-[var(--mkt-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          {FINAL_CTA.subheadline}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={FINAL_CTA.primaryCtaHref}
            className="mkt-cta-primary inline-flex items-center justify-center px-6 py-3 text-[14px]"
          >
            {FINAL_CTA.primaryCta}
          </a>
          <a
            href={FINAL_CTA.secondaryCtaHref}
            className="mkt-cta-secondary inline-flex items-center justify-center px-6 py-3 text-[14px]"
          >
            {FINAL_CTA.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  )
}
