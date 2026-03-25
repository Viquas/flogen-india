import Navbar from "@/components/marketing/navbar"
import Hero from "@/components/marketing/hero"
import TrustBar from "@/components/marketing/trust-bar"
import Problem from "@/components/marketing/problem"
import HowItWorks from "@/components/marketing/how-it-works"
import Portfolio from "@/components/marketing/portfolio"
import Benefits from "@/components/marketing/benefits"
import {
  PRICING,
  FAQ,
  FINAL_CTA,
  CONTACT,
  FOOTER,
} from "@/lib/marketing-constants"

export default function MarketingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />

      <HowItWorks />
      <Portfolio />
      <Benefits />

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 scroll-mt-20">
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
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)] scroll-mt-20"
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
      <section id="final-cta" className="py-24 sm:py-32 scroll-mt-20">
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
        className="py-16 sm:py-24 bg-[var(--mkt-bg-alt)] text-[var(--mkt-text-dark)] scroll-mt-20"
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
