import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface HeroSectionProps {
    businessName: string
    screenshotUrl: string | null
    previewUrl?: string
    previewHtml?: string | null
}

export function HeroSection({ businessName, screenshotUrl, previewUrl, previewHtml }: HeroSectionProps) {
    const fakeUrl = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com'

    return (
        <section className="bg-[#050304] rounded-b-[2rem] sm:rounded-b-[2.5rem] px-4 pt-12 pb-14">
            <div className="max-w-2xl mx-auto">
                {/* Eyebrow */}
                <p className="text-center text-sm font-medium tracking-wide text-white/30 mb-4">
                    Your website is ready
                </p>

                {/* Business name — serif with lime italic accent */}
                <h1 className="text-center text-3xl sm:text-[3rem] sm:leading-[1.15] font-[family-name:var(--font-signifier)] font-light text-white">
                    A website built for{' '}
                    <span className="italic text-[#AF92FF]">
                        {businessName}
                    </span>
                </h1>

                <p className="text-center text-white/40 mt-4 text-base max-w-md mx-auto leading-relaxed">
                    A professional website designed specifically for your business — ready to claim and make your own.
                </p>

                {/* Browser chrome mockup */}
                <div className="mt-10 rounded-2xl border border-white/8 overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
                    {/* Title bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/5">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                        <div className="flex-1 mx-3">
                            <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-white/20 truncate">
                                {fakeUrl}
                            </div>
                        </div>
                    </div>
                    {/* Live Preview */}
                    <div className="aspect-[16/7] overflow-hidden bg-[#1a1a1a]">
                        {previewHtml ? (
                            <iframe
                                srcDoc={previewHtml}
                                className="w-full h-full bg-white pointer-events-none"
                                sandbox="allow-scripts allow-same-origin"
                                title={`Website preview for ${businessName}`}
                                loading="eager"
                            />
                        ) : screenshotUrl ? (
                            <img
                                src={screenshotUrl}
                                alt={`Website preview for ${businessName}`}
                                className="w-full h-full object-cover object-top"
                                loading="eager"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-3xl font-[family-name:var(--font-signifier)] italic text-white/8">{businessName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* CTAs — Krida style: lime filled + dark outlined */}
                <div className="mt-8 flex items-center justify-center gap-3">
                    {previewUrl && (
                        <Link
                            href={previewUrl}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#AF92FF] text-[#050304] hover:bg-[#cdf598] transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Live Preview
                        </Link>
                    )}
                    <a
                        href="#pricing"
                        className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold text-white border border-white/15 hover:bg-white/5 transition-colors"
                    >
                        Claim Now
                    </a>
                </div>
            </div>
        </section>
    )
}
