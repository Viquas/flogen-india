"use client"

import { HERO } from "@/lib/marketing-constants"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { Shield } from "lucide-react"

function BrowserMockup() {
  return (
    <div className="relative" style={{ animation: "float 6s ease-in-out infinite" }}>
      {/* Desktop frame */}
      <div className="rounded-xl border border-[var(--mkt-border)] shadow-2xl overflow-hidden bg-[#111]">
        {/* Title bar */}
        <div className="h-8 flex items-center gap-2 px-4 bg-[#1A1A1A] border-b border-[var(--mkt-border)]">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          <span className="ml-auto mr-auto text-xs text-[var(--mkt-text-tertiary)]">
            yourbusiness.com
          </span>
        </div>
        {/* Screen */}
        <div className="aspect-video bg-gradient-to-br from-[#0F0F1A] via-[#141422] to-[#1A1A2E]">
          {/* Placeholder layout lines */}
          <div className="p-6 space-y-4 h-full flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[var(--mkt-accent)]/20" />
              <div className="h-2 w-24 rounded bg-white/10" />
              <div className="ml-auto flex gap-3">
                <div className="h-2 w-12 rounded bg-white/8" />
                <div className="h-2 w-12 rounded bg-white/8" />
                <div className="h-2 w-12 rounded bg-white/8" />
              </div>
            </div>
            <div className="flex-1 flex items-center px-4">
              <div className="space-y-3 max-w-[60%]">
                <div className="h-4 w-48 rounded bg-white/12" />
                <div className="h-3 w-36 rounded bg-white/8" />
                <div className="h-3 w-40 rounded bg-white/6" />
                <div className="mt-4 h-8 w-28 rounded-md bg-[var(--mkt-accent)]/30" />
              </div>
            </div>
            <div className="flex gap-4 px-4">
              <div className="h-16 flex-1 rounded-lg bg-white/4" />
              <div className="h-16 flex-1 rounded-lg bg-white/4" />
              <div className="h-16 flex-1 rounded-lg bg-white/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile frame — offset bottom-right */}
      <div className="absolute -bottom-6 -right-4 w-[35%]">
        <div className="rounded-2xl border border-[var(--mkt-border)] shadow-2xl bg-[#111] overflow-hidden">
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-1 bg-[#1A1A1A]">
            <div className="w-16 h-1 rounded-full bg-white/15" />
          </div>
          {/* Mobile screen */}
          <div className="aspect-[9/16] bg-gradient-to-br from-[#0F0F1A] via-[#141422] to-[#1A1A2E] max-h-[160px] overflow-hidden">
            <div className="p-3 space-y-2">
              <div className="h-2 w-16 rounded bg-white/12" />
              <div className="h-1.5 w-20 rounded bg-white/8" />
              <div className="h-1.5 w-14 rounded bg-white/6" />
              <div className="mt-2 h-5 w-14 rounded bg-[var(--mkt-accent)]/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const textRef = useScrollAnimation({ threshold: 0.1 })

  return (
    <section id="hero" className="pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-24">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }
          `,
        }}
      />
      <div className="mx-auto max-w-[var(--mkt-max-width)] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
          {/* Text content */}
          <div ref={textRef as React.RefObject<HTMLDivElement>}>
            <h1 className="text-[32px] sm:text-[48px] lg:text-[64px] leading-[1.08] tracking-tight">
              {HERO.headline}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--mkt-text-secondary)] max-w-xl leading-relaxed">
              {HERO.subheadline}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href={HERO.primaryCtaHref}
                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--mkt-accent)] text-white font-medium rounded-[var(--mkt-radius)] hover:opacity-90 transition-opacity"
              >
                {HERO.primaryCta}
              </a>
              <a
                href={HERO.secondaryCtaHref}
                className="inline-flex items-center justify-center px-8 py-4 border border-[var(--mkt-border)] text-white font-medium rounded-[var(--mkt-radius)] hover:bg-[var(--mkt-surface-hover)] transition-colors"
              >
                {HERO.secondaryCta}
              </a>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-[var(--mkt-text-tertiary)]">
              <Shield className="w-4 h-4 text-[var(--mkt-accent)]" />
              {HERO.trustSignal}
            </p>
          </div>

          {/* Browser mockup — hidden on small screens */}
          <div className="hidden sm:block">
            <BrowserMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
