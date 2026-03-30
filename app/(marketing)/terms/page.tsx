import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service — Somosite",
}

export default function TermsPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--mkt-text-tertiary)] hover:text-[var(--mkt-text-secondary)] transition-colors mb-6"
        >
          ← Back to Somosite
        </Link>
        <h1 className="text-[28px] sm:text-[40px] leading-tight mb-8">
          Terms of Service
        </h1>
        <div className="space-y-8 text-[var(--mkt-text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Service Description
            </h2>
            <p>
              Somosite provides custom website design and development services
              for small businesses. We research your business data — including
              your online presence, reviews, and industry — to build a website
              tailored to your brand. Our service is not template-based; each
              site is designed from your real business information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Pricing and Payment
            </h2>
            <p>Somosite offers the following plans:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Standard — $499:</strong>{" "}
                One-page website with mobile-responsive design, contact form,
                and SEO basics.
              </li>
              <li>
                <strong className="text-white">Pro — $1,299:</strong>{" "}
                Multi-page website with advanced design, animations, and
                priority support.
              </li>
              <li>
                <strong className="text-white">Premium — Custom quote:</strong>{" "}
                Enterprise-level websites with custom functionality, integrations,
                and dedicated project management.
              </li>
            </ul>
            <p className="mt-3">
              All prices are in USD. Payment is processed securely through
              Razorpay. Full payment is required before work begins unless
              otherwise agreed for Premium plans.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Delivery</h2>
            <p>
              After payment, you will receive a website preview within days. Once
              you approve the design, your site goes live within 48 hours.
              Delivery timelines are estimates and may vary depending on project
              complexity and revision requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Revisions</h2>
            <p>
              Each plan includes revisions during the review period. We work with
              you to ensure the final design meets your expectations. Major scope
              changes — such as adding new pages, features, or functionality
              beyond the original plan — may incur additional costs, which will
              be communicated and agreed upon before any extra work begins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Intellectual Property
            </h2>
            <p>
              Upon full payment, you own your website, its content, and your
              domain. Somosite retains rights to the underlying design system,
              tools, and code frameworks used to build your site. We may
              reference your project in our portfolio unless you opt out in
              writing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Refund Policy
            </h2>
            <p>
              We offer a 30-day satisfaction guarantee on Standard and Pro plans.
              If you are not satisfied with your website, you may request a full
              refund within 30 days of delivery. For full details, see our{" "}
              <a
                href="/refund"
                className="text-[var(--mkt-accent)] hover:underline"
              >
                Refund Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Limitation of Liability
            </h2>
            <p>
              Somosite provides websites on an &ldquo;as is&rdquo; basis after
              delivery and approval. We are not liable for any indirect,
              incidental, or consequential damages arising from the use of your
              website. Our total liability is limited to the amount paid for the
              service. We do not guarantee specific business outcomes such as
              increased traffic, leads, or revenue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Termination
            </h2>
            <p>
              Either party may terminate the service agreement at any time.
              If you cancel after payment but before delivery, our{" "}
              <a
                href="/refund"
                className="text-[var(--mkt-accent)] hover:underline"
              >
                Refund Policy
              </a>{" "}
              applies. If Somosite is unable to deliver the agreed service, you
              will receive a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Changes will be posted
              on this page with an updated revision date. Continued use of
              Somosite after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Governing Law
            </h2>
            <p>
              These terms are governed by the laws of India. Any disputes arising
              from these terms or the use of our services shall be resolved in
              the courts of Bangalore, Karnataka, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a
                href="mailto:hello@somosite.com"
                className="text-[var(--mkt-accent)] hover:underline"
              >
                hello@somosite.com
              </a>
              .
            </p>
          </section>
        </div>
        <p className="mt-12 text-sm text-[var(--mkt-text-tertiary)]">
          Last updated: March 2026
        </p>
      </div>
    </div>
  )
}
