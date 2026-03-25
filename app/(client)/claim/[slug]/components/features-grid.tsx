import { Smartphone, Search, Zap, Shield, MessageSquare, Clock } from 'lucide-react'

interface Feature {
    icon: typeof Smartphone
    title: string
    description: string
}

const FEATURES: Feature[] = [
    { icon: Smartphone, title: 'Mobile Responsive', description: 'Looks perfect on every device' },
    { icon: Search, title: 'SEO Optimized', description: 'Built to rank on Google' },
    { icon: Zap, title: 'Lightning Fast', description: 'Sub-2 second load times' },
    { icon: Shield, title: 'SSL Secured', description: 'Free HTTPS certificate' },
    { icon: MessageSquare, title: 'Contact Forms', description: 'Built-in lead capture' },
    { icon: Clock, title: '99.9% Uptime', description: 'Always online, always available' },
]

export function FeaturesGrid() {
    return (
        <section className="px-4 py-14">
            <div className="max-w-2xl mx-auto">
                {/* Lime pill label */}
                <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#AF92FF] text-[#050304] text-xs font-semibold tracking-wide">
                        What&apos;s Included
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-signifier)] font-light text-[#050304] text-center mb-10">
                    Everything you need
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="flex flex-col gap-2 p-5 bg-white rounded-2xl border border-[#050304]/5"
                        >
                            <feature.icon className="text-[#050304]/50 w-5 h-5" strokeWidth={1.5} />
                            <div>
                                <h3 className="text-sm font-semibold text-[#050304]">{feature.title}</h3>
                                <p className="text-xs text-[#050304]/40 mt-0.5 leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
