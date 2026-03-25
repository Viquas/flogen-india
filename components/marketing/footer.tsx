import { FOOTER } from "@/lib/marketing-constants"
import Link from "next/link"
import { CheckCircle, Shield } from "lucide-react"

export default function Footer() {
  return (
    <footer id="footer" className="py-16 sm:py-24 border-t border-[var(--mkt-border)]">
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Column 1: Company info (special layout) */}
          <div>
            <p className="text-xl font-bold text-white">
              {FOOTER.company.name}
            </p>
            <p className="mt-3 text-sm text-[var(--mkt-text-secondary)] leading-relaxed">
              {FOOTER.company.description}
            </p>
            <p className="mt-3 text-sm text-[var(--mkt-text-tertiary)]">
              {FOOTER.company.email}
            </p>
            <p className="mt-1 text-sm text-[var(--mkt-text-tertiary)]">
              {FOOTER.company.location}
            </p>
            <ul className="mt-4 space-y-2">
              {FOOTER.columns[0].links.map((link) => (
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

          {/* Columns 2-4: Standard link lists */}
          {FOOTER.columns.slice(1).map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-medium text-[var(--mkt-text-tertiary)] uppercase tracking-wider">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--mkt-text-secondary)] hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-[var(--mkt-text-secondary)] hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges + payment methods */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--mkt-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[var(--mkt-accent)]" />
              {FOOTER.guarantee}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[var(--mkt-accent)]" />
              {FOOTER.ssl}
            </span>
          </div>
          <p className="text-xs text-[var(--mkt-text-tertiary)] tracking-wide">
            {FOOTER.paymentMethods.join(" \u00B7 ")}
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-[var(--mkt-border)] text-center text-sm text-[var(--mkt-text-tertiary)]">
          {FOOTER.copyright}
        </div>
      </div>
    </footer>
  )
}
