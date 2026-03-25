import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import { SCROLL_ANIMATION_STYLES } from "@/hooks/use-scroll-animation"
import CookieConsent from "@/components/marketing/cookie-consent"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-marketing",
  display: "swap",
})

const signifier = localFont({
  src: [
    { path: "../../public/fonts/Signifier-Light.otf", weight: "300", style: "normal" },
    { path: "../../public/fonts/Signifier-LightItalic.otf", weight: "300", style: "italic" },
    { path: "../../public/fonts/Signifier-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Signifier-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "../../public/fonts/Signifier-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Signifier-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Signifier-BoldItalic.otf", weight: "700", style: "italic" },
  ],
  variable: "--font-signifier",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Somosite — Custom Websites Built From Your Real Business Data",
  description:
    "Professional websites for small businesses. Built from your actual business data — no templates, no stock content. Starting at $499. Ready in days.",
  metadataBase: new URL("https://somosite.com"),
  alternates: {
    canonical: "https://somosite.com",
  },
  openGraph: {
    title: "Somosite — Custom Websites Built From Your Real Business Data",
    description:
      "Professional websites for small businesses. Built from your actual business data — no templates, no stock content. Starting at $499. Ready in days.",
    url: "https://somosite.com",
    siteName: "Somosite",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somosite — Custom Websites Built From Your Real Business Data",
    description:
      "Professional websites for small businesses. Built from your actual business data — no templates, no stock content. Starting at $499. Ready in days.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`marketing ${inter.variable} ${signifier.variable} min-h-screen bg-[#08090A] text-[#E8E8ED] font-[family-name:var(--font-inter-marketing)]`}
      style={{ background: "#08090A" }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background: #08090A !important;
              background-color: #08090A !important;
              overflow-x: hidden;
            }

            /* Scrollbar styling */
            html::-webkit-scrollbar {
              width: 8px;
            }
            html::-webkit-scrollbar-track {
              background: #08090A;
            }
            html::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
            }
            html::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.15);
            }
            html {
              scrollbar-color: rgba(255, 255, 255, 0.1) #08090A;
            }

            .marketing ::selection {
              background: var(--mkt-accent);
              color: #ffffff;
            }

            .marketing {
              overflow-x: hidden;
              --mkt-bg: #08090A;
              --mkt-bg-elevated: #111213;
              --mkt-bg-hover: #1A1B1E;
              --mkt-accent: #8B7BF5;
              --mkt-accent-muted: rgba(139, 123, 245, 0.12);
              --mkt-text: #E8E8ED;
              --mkt-text-secondary: #8F8F9D;
              --mkt-text-tertiary: #5C5C66;
              --mkt-border: rgba(255, 255, 255, 0.06);
              --mkt-border-strong: rgba(255, 255, 255, 0.10);
              --mkt-surface: rgba(255, 255, 255, 0.03);
              --mkt-surface-hover: rgba(255, 255, 255, 0.06);
              --mkt-transition: 0.16s ease-out;
              --mkt-radius: 8px;
              --mkt-max-width: 1400px;
              position: relative;
              scroll-behavior: smooth;
            }

            .marketing::before {
              content: '';
              position: fixed;
              inset: 0;
              z-index: 1;
              pointer-events: none;
              opacity: 0.03;
              mix-blend-mode: overlay;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
              background-repeat: repeat;
              background-size: 256px 256px;
            }

            .marketing::after {
              content: '';
              position: fixed;
              top: -40%;
              left: 50%;
              transform: translateX(-50%);
              width: 80%;
              height: 60%;
              background: radial-gradient(ellipse, rgba(139, 123, 245, 0.04) 0%, transparent 70%);
              pointer-events: none;
              z-index: 0;
            }

            .marketing h1,
            .marketing h2,
            .marketing h3 {
              font-family: var(--font-signifier);
              font-weight: 300;
              letter-spacing: -0.01em;
              color: var(--mkt-text);
            }

            .marketing section {
              scroll-margin-top: 72px;
            }

            ${SCROLL_ANIMATION_STYLES}
          `,
        }}
      />
      <main className="relative z-10">{children}</main>
      <CookieConsent />
    </div>
  )
}
