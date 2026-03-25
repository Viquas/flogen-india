import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy — Somosite",
}

export default function RefundPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-[28px] sm:text-[40px] leading-tight mb-8">
          Refund Policy
        </h1>
        <div className="space-y-8 text-[var(--mkt-text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              30-Day Satisfaction Guarantee
            </h2>
            <p>
              We stand behind the quality of our work. If you are not satisfied
              with your website, you may request a full refund within 30 days of
              delivery. No questions asked. Our goal is to deliver a website you
              are proud of — if we fall short, you should not have to pay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Eligibility
            </h2>
            <p>The 30-day satisfaction guarantee applies to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Standard plan ($499)</strong> —
                Full refund within 30 days of site delivery.
              </li>
              <li>
                <strong className="text-white">Pro plan ($1,299)</strong> — Full
                refund within 30 days of site delivery.
              </li>
            </ul>
            <p className="mt-3">
              Premium plans with custom quotes have separate refund terms
              outlined in their individual agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              How to Request a Refund
            </h2>
            <p>To request a refund:</p>
            <ol className="mt-3 list-decimal pl-6 space-y-2">
              <li>
                Email{" "}
                <a
                  href="mailto:hello@somosite.com"
                  className="text-[var(--mkt-accent)] hover:underline"
                >
                  hello@somosite.com
                </a>{" "}
                within 30 days of receiving your website.
              </li>
              <li>
                Include your order details (plan type, business name, and
                payment date).
              </li>
              <li>
                Let us know the reason for your request so we can improve our
                service.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Refund Process
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Refund requests are reviewed within{" "}
                <strong className="text-white">3 business days</strong>.
              </li>
              <li>
                Approved refunds are processed to your original payment method
                within{" "}
                <strong className="text-white">5-10 business days</strong>.
              </li>
              <li>
                You will receive an email confirmation once the refund has been
                initiated.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Exceptions</h2>
            <p>Refunds are not available in the following cases:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Domain transfer complete:</strong>{" "}
                If the custom domain has already been transferred to your
                hosting, the domain registration fee is non-refundable.
              </li>
              <li>
                <strong className="text-white">
                  After the 30-day window:
                </strong>{" "}
                Requests received after 30 days from delivery are not eligible
                for a refund.
              </li>
              <li>
                <strong className="text-white">
                  Custom domain registration:
                </strong>{" "}
                Domain registration fees paid to third-party registrars are
                non-refundable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Partial Refunds
            </h2>
            <p>
              If significant work has been completed and you request cancellation
              before the final website is delivered, a partial refund may apply.
              The refund amount will be determined based on the work completed at
              the time of cancellation. We will communicate the breakdown before
              processing any partial refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Contact</h2>
            <p>
              For refund requests or questions about this policy, email us at{" "}
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
