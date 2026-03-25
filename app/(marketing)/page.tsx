import Navbar from "@/components/marketing/navbar"
import Hero from "@/components/marketing/hero"
import TrustBar from "@/components/marketing/trust-bar"
import Problem from "@/components/marketing/problem"
import HowItWorks from "@/components/marketing/how-it-works"
import Portfolio from "@/components/marketing/portfolio"
import Benefits from "@/components/marketing/benefits"
import Pricing from "@/components/marketing/pricing"
import Faq from "@/components/marketing/faq"
import FinalCta from "@/components/marketing/final-cta"
import { CONTACT, FOOTER } from "@/lib/marketing-constants"

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

      <Pricing />
      <Faq />
      <FinalCta />

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
