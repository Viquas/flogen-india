import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Somosite",
}

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-[28px] sm:text-[40px] leading-tight mb-8">
          Privacy Policy
        </h1>
        <div className="space-y-8 text-[var(--mkt-text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Information We Collect
            </h2>
            <p>
              When you use Somosite, we collect information you provide directly
              to us. This includes:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Contact form data:</strong> Your
                name, email address, business name, and message when you submit
                our contact form.
              </li>
              <li>
                <strong className="text-white">Account information:</strong>{" "}
                Email address and business details when you purchase a website
                plan.
              </li>
              <li>
                <strong className="text-white">Usage data:</strong> Page views,
                device type, browser type, and referring URLs collected through
                analytics.
              </li>
            </ul>
            <p className="mt-3">
              We do not collect sensitive personal data such as financial
              information, government IDs, or health data. Payment processing is
              handled entirely by Razorpay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                Respond to your inquiries and communicate about our services
              </li>
              <li>
                Design and deliver your custom website (Standard, Pro, or
                Premium plans)
              </li>
              <li>Process payments and manage your account</li>
              <li>
                Improve our website and services based on usage patterns
              </li>
              <li>Send transactional emails related to your order</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal data with third
              parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Cookies</h2>
            <p>Somosite uses cookies in two categories:</p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Essential cookies:</strong>{" "}
                Required for basic site functionality, such as remembering your
                cookie consent preference.
              </li>
              <li>
                <strong className="text-white">Analytics cookies:</strong> Used
                to understand how visitors interact with our site (page views,
                session duration). These are only placed with your consent.
              </li>
            </ul>
            <p className="mt-3">
              You can manage your cookie preferences using the consent banner
              that appears on your first visit. You can also clear cookies at any
              time through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Third-Party Services
            </h2>
            <p>
              We use the following third-party services that may process your
              data:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Razorpay:</strong> Payment
                processing for website plan purchases. Razorpay handles all
                payment data under their own{" "}
                <a
                  href="https://razorpay.com/privacy/"
                  className="text-[var(--mkt-accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  privacy policy
                </a>
                .
              </li>
              <li>
                <strong className="text-white">Analytics provider:</strong>{" "}
                Website analytics for understanding visitor behavior. Data is
                anonymized and aggregated.
              </li>
            </ul>
            <p className="mt-3">
              Each third-party service operates under their own privacy policy
              and terms. We recommend reviewing their policies directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Your Rights (GDPR)
            </h2>
            <p>
              If you are located in the European Economic Area, you have the
              following rights regarding your personal data:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Access:</strong> Request a copy
                of the personal data we hold about you.
              </li>
              <li>
                <strong className="text-white">Correction:</strong> Request
                correction of inaccurate or incomplete data.
              </li>
              <li>
                <strong className="text-white">Deletion:</strong> Request
                deletion of your personal data.
              </li>
              <li>
                <strong className="text-white">Data portability:</strong>{" "}
                Request your data in a machine-readable format.
              </li>
              <li>
                <strong className="text-white">Objection:</strong> Object to
                processing of your personal data for specific purposes.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:hello@somosite.com"
                className="text-[var(--mkt-accent)] hover:underline"
              >
                hello@somosite.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Contact form submissions:</strong>{" "}
                Retained for 12 months, then automatically deleted.
              </li>
              <li>
                <strong className="text-white">Account and order data:</strong>{" "}
                Retained for the duration of your active account and as required
                for legal and accounting purposes.
              </li>
              <li>
                <strong className="text-white">Analytics data:</strong>{" "}
                Aggregated and anonymized after 26 months.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">
              Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. Changes will
              be posted on this page with an updated revision date. Continued use
              of Somosite after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-4">Contact Us</h2>
            <p>
              For privacy-related questions or requests, contact us at{" "}
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
