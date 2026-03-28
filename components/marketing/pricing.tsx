"use client"

import { PRICING } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Check, Shield } from "@phosphor-icons/react"

export default function Pricing() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="pricing"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-24 sm:py-32 scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <h2 className="leading-tight text-center" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 3rem)" }}>
          {PRICING.sectionTitle}
        </h2>
        <p className="mt-4 text-[17px] text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
          {PRICING.sectionSubtitle}
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {PRICING.tiers.map((tier) => {
            const isHighlighted = tier.highlighted
            return (
              <div
                key={tier.name}
                className={`relative rounded-xl p-8 transition-colors ${
                  isHighlighted
                    ? "order-first sm:order-none bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-accent)]/30"
                    : "bg-[var(--mkt-bg-elevated)] border border-[var(--mkt-border)]"
                }`}
              >
                {"badge" in tier && tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block px-3 py-1 text-[11px] font-medium bg-[var(--mkt-accent-muted)] text-[var(--mkt-accent)] rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                <h3 className="text-[17px] font-semibold text-[var(--mkt-text)]">
                  {tier.name}
                </h3>
                <p className="mt-2 text-[13px] text-[var(--mkt-text-secondary)]">
                  {tier.description}
                </p>

                <p className="mt-6">
                  <span className="text-[40px] font-semibold tracking-tight text-[var(--mkt-text)]">
                    {tier.price}
                  </span>
                  {tier.period !== "quote" && (
                    <span className="text-[13px] text-[var(--mkt-text-tertiary)] ml-2">
                      /{tier.period}
                    </span>
                  )}
                </p>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[14px]">
                      <Check className="w-4 h-4 text-[var(--mkt-text-secondary)] mt-0.5 shrink-0" />
                      <span className="text-[var(--mkt-text-secondary)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`mt-8 block text-center px-5 py-2.5 text-[14px] ${
                    isHighlighted
                      ? "mkt-cta-primary rounded-lg"
                      : "mkt-cta-secondary"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-[13px] text-[var(--mkt-text-secondary)]">
            <Shield className="w-4 h-4 text-[var(--mkt-text-tertiary)]" />
            <span>{PRICING.guarantee}</span>
          </div>
          <p className="text-[12px] text-[var(--mkt-text-tertiary)]">
            {PRICING.noHiddenFees}
          </p>
        </div>
      </div>
    </section>
  )
}
