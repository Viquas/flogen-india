import {
  HERO,
  TRUST_SIGNALS,
  PROBLEM,
  HOW_IT_WORKS,
  PORTFOLIO,
  BENEFITS,
  PRICING,
  FAQ,
  FINAL_CTA,
  CONTACT,
  FOOTER,
} from "@/lib/marketing-constants"

export default function MarketingPage() {
  return (
    <>
      {/* Hero */}
      <section id="hero" className="relative py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <h1 className="text-[32px] sm:text-[48px] lg:text-[64px] leading-tight">
            {HERO.headline}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[var(--mkt-text-secondary)] max-w-2xl">
            {HERO.subheadline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href={HERO.primaryCtaHref}
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--mkt-accent)] text-white font-medium rounded-[var(--mkt-radius)] hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              {HERO.primaryCta}
            </a>
            <a
              href={HERO.secondaryCtaHref}
              className="inline-flex items-center justify-center px-8 py-4 border border-[var(--mkt-border)] text-white font-medium rounded-[var(--mkt-radius)] hover:bg-[var(--mkt-surface-hover)] transition-colors w-full sm:w-auto"
            >
              {HERO.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section
        id="trust"
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)]"
      >
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_SIGNALS.map((signal) => (
              <div key={signal.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">
                  {signal.value}
                </p>
                <p className="mt-1 text-sm opacity-70">{signal.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="py-16 sm:py-24">
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight">
            {PROBLEM.headline}
          </h2>
          <p className="mt-6 text-lg text-[var(--mkt-text-secondary)] leading-relaxed">
            {PROBLEM.body}
          </p>
          <p className="mt-6 text-xl font-medium text-[var(--mkt-accent)]">
            {PROBLEM.emphasis}
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)]"
      >
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
            {HOW_IT_WORKS.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-center opacity-70 max-w-2xl mx-auto">
            {HOW_IT_WORKS.sectionSubtitle}
          </p>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12">
            {HOW_IT_WORKS.steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--mkt-accent)] text-white font-bold text-lg">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl">{step.title}</h3>
                <p className="mt-3 opacity-70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-16 sm:py-24">
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
            {PORTFOLIO.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
            {PORTFOLIO.sectionSubtitle}
          </p>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PORTFOLIO.items.map((item) => (
              <div
                key={item.name}
                className="group rounded-[var(--mkt-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] overflow-hidden hover:bg-[var(--mkt-surface-hover)] transition-colors"
              >
                <div className="aspect-video bg-[var(--mkt-surface)]" />
                <div className="p-6">
                  <p className="text-sm text-[var(--mkt-text-tertiary)]">
                    {item.category}
                  </p>
                  <h3 className="mt-1 text-lg">{item.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        id="benefits"
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)]"
      >
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
            {BENEFITS.sectionTitle}
          </h2>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {BENEFITS.items.map((item) => (
              <div key={item.title}>
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 opacity-70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
            {PRICING.sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-center text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
            {PRICING.sectionSubtitle}
          </p>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {PRICING.tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-[var(--mkt-radius)] border p-8 ${
                  tier.highlighted
                    ? "border-[var(--mkt-accent)] bg-[var(--mkt-surface-hover)]"
                    : "border-[var(--mkt-border)] bg-[var(--mkt-surface)]"
                }`}
              >
                {"badge" in tier && tier.badge && (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-[var(--mkt-accent)] text-white rounded-full mb-4">
                    {tier.badge}
                  </span>
                )}
                <h3 className="text-xl">{tier.name}</h3>
                <p className="mt-2 text-[var(--mkt-text-secondary)] text-sm">
                  {tier.description}
                </p>
                <p className="mt-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period !== "quote" && (
                    <span className="text-[var(--mkt-text-tertiary)] ml-2">
                      /{tier.period}
                    </span>
                  )}
                </p>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-[var(--mkt-text-secondary)]"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.ctaHref}
                  className={`mt-8 block text-center px-6 py-3 rounded-[var(--mkt-radius)] font-medium transition-colors ${
                    tier.highlighted
                      ? "bg-[var(--mkt-accent)] text-white hover:opacity-90"
                      : "border border-[var(--mkt-border)] text-white hover:bg-[var(--mkt-surface-hover)]"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)]"
      >
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight text-center">
            {FAQ.sectionTitle}
          </h2>
          <div className="mt-12 space-y-8">
            {FAQ.items.map((item) => (
              <div key={item.question}>
                <h3 className="text-lg font-medium">{item.question}</h3>
                <p className="mt-3 opacity-70">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[56px] leading-tight">
            {FINAL_CTA.headline}
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-[var(--mkt-text-secondary)] max-w-2xl mx-auto">
            {FINAL_CTA.subheadline}
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
              className="inline-flex items-center justify-center px-8 py-4 border border-[var(--mkt-border)] text-white font-medium rounded-[var(--mkt-radius)] hover:bg-[var(--mkt-surface-hover)] transition-colors w-full sm:w-auto"
            >
              {FINAL_CTA.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)]"
      >
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8 max-w-2xl text-center">
          <h2 className="text-[28px] sm:text-[40px] lg:text-[48px] leading-tight">
            {CONTACT.sectionTitle}
          </h2>
          <p className="mt-4 text-lg opacity-70">{CONTACT.sectionSubtitle}</p>
          {/* Contact form will be built in Phase 20 */}
          <div className="mt-12 rounded-[var(--mkt-radius)] border border-gray-200 p-12 text-center opacity-50">
            <p>Contact form — Phase 20</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="py-16 sm:py-24 border-t border-[var(--mkt-border)]">
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {FOOTER.columns.map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-medium text-[var(--mkt-text-tertiary)] uppercase tracking-wider">
                  {column.title}
                </h4>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-[var(--mkt-text-secondary)] hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t border-[var(--mkt-border)] text-center text-sm text-[var(--mkt-text-tertiary)]">
            {FOOTER.copyright}
          </div>
        </div>
      </footer>
    </>
  )
}
