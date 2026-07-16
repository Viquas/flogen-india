import { CLIENT_TESTIMONIALS, type Testimonial } from '@/lib/testimonials'

interface TestimonialsSectionProps {
    /** Real client testimonials only. When empty, the section renders nothing. */
    testimonials?: Testimonial[]
}

export function TestimonialsSection({ testimonials = CLIENT_TESTIMONIALS }: TestimonialsSectionProps) {
    // Never fabricate social proof — omit the section until real quotes exist.
    if (testimonials.length === 0) return null

    return (
        <section className="px-4 py-14">
            <div className="max-w-4xl mx-auto">
                {/* Lime pill */}
                <div className="flex justify-center mb-10">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#AF92FF] text-[#050304] text-xs font-semibold tracking-wide">
                        Testimonials
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
                    {testimonials.map((t) => (
                        <div key={t.company} className="flex flex-col justify-between">
                            {/* Quote */}
                            <div>
                                <span className="text-3xl text-[#050304]/10 font-[family-name:var(--font-signifier)] leading-none select-none">&ldquo;</span>
                                <p className="text-base sm:text-lg font-[family-name:var(--font-signifier)] font-light text-[#050304] leading-relaxed -mt-2">
                                    {t.quote}
                                </p>
                            </div>

                            {/* Attribution */}
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#050304]/8" />
                                <div>
                                    <p className="text-sm font-semibold text-[#050304]">{t.role}</p>
                                    <p className="text-xs text-[#050304]/40">{t.company}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
