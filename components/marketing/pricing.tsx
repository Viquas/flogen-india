"use client"

import { PRICING } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Check, Shield } from "lucide-react"

export default function Pricing() {
  const sectionRef = useScrollAnimation()

  return (
    <section
      id="pricing"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        {/* Anchoring statement */}
        <p className="text-center text-[var(--mkt-text-dark)]/60 italic max-w-3xl mx-auto mb-6 text-base sm:text-lg">
          {PRICING.anchoring}
        </p>

        <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
          {PRICING.sectionTitle}
        </h2>
        <p className="mt-4 text-lg text-center opacity-70 max-w-2xl mx-auto">
          {PRICING.sectionSubtitle}
        </p>

        {/* Pricing cards -- Pro first on mobile via order utilities */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
          {PRICING.tiers.map((tier) => {
            const isHighlighted = tier.highlighted
            return (
              <div
                key={tier.name}
                className={`relative rounded-xl p-8 transition-all duration-200 hover:scale-[1.02] ${
                  isHighlighted
                    ? "order-first sm:order-none border-2 border-[var(--mkt-accent)] shadow-lg shadow-[var(--mkt-accent)]/10 sm:scale-105 sm:py-10"
                    : "border border-gray-200"
                }`}
              >
                {/* Most Popular badge */}
                {"badge" in tier && tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block px-4 py-1 text-xs font-semibold bg-[var(--mkt-accent)] text-white rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <p className="mt-2 text-sm opacity-60">{tier.description}</p>

                <p className="mt-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period !== "quote" && (
                    <span className="text-sm opacity-50 ml-2">
                      /{tier.period}
                    </span>
                  )}
                </p>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-[var(--mkt-accent)] mt-0.5 shrink-0" />
                      <span className="opacity-80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`mt-8 block text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    isHighlighted
                      ? "bg-[var(--mkt-accent)] text-white hover:opacity-90"
                      : "border border-gray-300 hover:bg-gray-100 transition-colors"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            )
          })}
        </div>

        {/* Below cards: guarantee + no hidden fees + payment badges */}
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="w-5 h-5 text-[var(--mkt-accent)]" />
            <span>{PRICING.guarantee}</span>
          </div>
          <p className="text-sm opacity-60">{PRICING.noHiddenFees}</p>
          <p className="mt-2 text-xs opacity-40 tracking-wide">
            Visa &middot; Mastercard &middot; UPI
          </p>
        </div>
      </div>
    </section>
  )
}
