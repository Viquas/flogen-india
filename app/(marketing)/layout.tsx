import type { Metadata } from "next"
import { DM_Serif_Display, Inter } from "next/font/google"
import { SCROLL_ANIMATION_STYLES } from "@/hooks/use-scroll-animation"

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-marketing",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Somosite — Custom Websites That Convert",
  description:
    "Precision-built websites for small businesses. Custom design, 48-hour delivery, mobile-first. Get a site that turns visitors into customers.",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`marketing ${dmSerif.variable} ${inter.variable} min-h-screen bg-[#0A0A0A] text-white font-[family-name:var(--font-inter-marketing)]`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .marketing {
              --mkt-bg: #0A0A0A;
              --mkt-bg-alt: #FAFAFA;
              --mkt-accent: #AF92FF;
              --mkt-text: #FFFFFF;
              --mkt-text-dark: #1A1A1A;
              --mkt-text-secondary: rgba(255, 255, 255, 0.7);
              --mkt-text-tertiary: rgba(255, 255, 255, 0.5);
              --mkt-border: rgba(255, 255, 255, 0.08);
              --mkt-surface: rgba(255, 255, 255, 0.03);
              --mkt-surface-hover: rgba(255, 255, 255, 0.06);
              --mkt-transition: 0.16s ease-out;
              --mkt-radius: 10px;
              --mkt-max-width: 1200px;
              position: relative;
              scroll-behavior: smooth;
            }

            .marketing::before {
              content: '';
              position: fixed;
              inset: 0;
              z-index: 1;
              pointer-events: none;
              opacity: 0.04;
              mix-blend-mode: overlay;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
              background-repeat: repeat;
              background-size: 256px 256px;
            }

            .marketing h1,
            .marketing h2,
            .marketing h3 {
              font-family: var(--font-dm-serif);
            }

            .marketing section {
              scroll-margin-top: 80px;
            }

            ${SCROLL_ANIMATION_STYLES}
          `,
        }}
      />
      <main className="relative z-10">{children}</main>
    </div>
  )
}
