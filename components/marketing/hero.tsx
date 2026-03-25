"use client"

import { HERO } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function Hero() {
  const textRef = useScrollAnimation({ threshold: 0.1 })

  return (
    <section id="hero" className="relative">
      {/* Responsive top spacer */}
      <div className="h-[120px] sm:h-[160px] lg:h-[200px]" />

      <div
        ref={textRef as React.RefObject<HTMLDivElement>}
        className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8"
      >
        {/* Centered headline — fluid sizing */}
        <h1
          className="tracking-[-0.01em] leading-[1.1] text-center mx-auto"
          style={{ fontSize: "clamp(2rem, 3.5vw + 0.5rem, 4.5rem)" }}
        >
          {HERO.headline}
        </h1>

        {/* Spacer */}
        <div className="h-6 sm:h-8" />

        {/* Subtitle */}
        <p className="text-[17px] sm:text-[19px] text-[var(--mkt-text-secondary)] text-center max-w-2xl mx-auto leading-relaxed">
          {HERO.subheadline}
        </p>

        {/* Spacer */}
        <div className="h-10 sm:h-12" />

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4">
          <a
            href={HERO.primaryCtaHref}
            className="inline-flex items-center justify-center px-5 py-2.5 text-[14px] font-medium bg-[var(--mkt-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            {HERO.primaryCta}
          </a>
          <a
            href={HERO.secondaryCtaHref}
            className="inline-flex items-center justify-center px-5 py-2.5 text-[14px] font-medium text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text)] transition-colors"
          >
            {HERO.secondaryCta} <span className="ml-1.5">→</span>
          </a>
        </div>
      </div>

      {/* Spacer before showcase */}
      <div className="h-16 sm:h-20 lg:h-24" />

      {/* Full-bleed showcase frame */}
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Ambient glow behind frame */}
          <div className="absolute -inset-4 bg-[var(--mkt-accent)]/5 blur-3xl rounded-3xl" />

          {/* Browser frame */}
          <div className="relative rounded-xl border border-[var(--mkt-border-strong)] overflow-hidden bg-[var(--mkt-bg-elevated)]">
            {/* Minimal URL bar */}
            <div className="h-9 flex items-center justify-center bg-[var(--mkt-bg-elevated)] border-b border-[var(--mkt-border)]">
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--mkt-surface)] text-[11px] text-[var(--mkt-text-tertiary)]">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 1a1 1 0 0 1 1 1v4.586l2.707-2.707a1 1 0 1 1 1.414 1.414l-4.414 4.414a1 1 0 0 1-1.414 0L2.879 5.293a1 1 0 0 1 1.414-1.414L7 6.586V2a1 1 0 0 1 1-1z" />
                </svg>
                yourbusiness.com
              </div>
            </div>
            {/* Screenshot area */}
            <div className="aspect-[16/9] bg-gradient-to-br from-[#0c0c14] via-[#10101a] to-[#14141e] relative overflow-hidden">
              {/* Refined placeholder — clean wireframe suggesting a real site */}
              <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between">
                {/* Top nav hint */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/6" />
                    <div className="h-2 w-20 rounded-full bg-white/8" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-2 w-10 rounded-full bg-white/5" />
                    <div className="h-2 w-10 rounded-full bg-white/5" />
                    <div className="h-2 w-10 rounded-full bg-white/5" />
                    <div className="h-7 w-16 rounded-md bg-[var(--mkt-accent)]/20" />
                  </div>
                </div>

                {/* Hero content hint */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-[50%]">
                    <div className="h-4 w-64 rounded-full bg-white/10 mx-auto" />
                    <div className="h-3 w-48 rounded-full bg-white/6 mx-auto" />
                    <div className="h-3 w-52 rounded-full bg-white/4 mx-auto" />
                    <div className="h-9 w-28 rounded-lg bg-[var(--mkt-accent)]/25 mx-auto mt-6" />
                  </div>
                </div>

                {/* Bottom cards hint */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 sm:h-20 rounded-lg bg-white/3 border border-white/4" />
                  <div className="h-16 sm:h-20 rounded-lg bg-white/3 border border-white/4" />
                  <div className="h-16 sm:h-20 rounded-lg bg-white/3 border border-white/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-16 sm:h-24" />
    </section>
  )
}
