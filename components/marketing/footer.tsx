import { FOOTER } from "@/lib/marketing-constants"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <>
      {/* Aurora video divider */}
      <div className="relative w-full overflow-hidden h-[200px] sm:h-[300px] -mb-px">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/marketing/footer-aurora.mp4" type="video/mp4" />
        </video>
      </div>

      <footer
        id="footer"
        className="py-12 sm:py-16"
        style={{ backgroundColor: "#FFEADF" }}
      >
        <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Company info */}
            <div>
              <Image
                src="/sumosite-logo-dark.svg"
                alt="Somosite"
                width={120}
                height={20}
                className="h-5 w-auto"
              />
              <p className="mt-3 text-[13px] text-[#0B0B0A]/50 leading-relaxed">
                {FOOTER.company.description}
              </p>
              <p className="mt-3 text-[13px] text-[#0B0B0A]/50">
                {FOOTER.company.email}
              </p>
              <p className="mt-1 text-[13px] text-[#0B0B0A]/50">
                {FOOTER.company.location}
              </p>
            </div>

            {/* Link columns */}
            {FOOTER.columns.slice(1).map((column) => (
              <div key={column.title}>
                <h4 className="text-[11px] font-medium text-[#0B0B0A]/40 uppercase tracking-[0.08em]">
                  {column.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link
                          href={link.href}
                          className="text-[13px] text-[#0B0B0A]/50 hover:text-[#0B0B0A]/80 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-[13px] text-[#0B0B0A]/50 hover:text-[#0B0B0A]/80 transition-colors"
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

          {/* Copyright */}
          <div className="mt-12 pt-6 border-t border-[#0B0B0A]/10 text-[12px] text-[#0B0B0A]/40">
            &copy; 2026 Sohail Minimalist. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
