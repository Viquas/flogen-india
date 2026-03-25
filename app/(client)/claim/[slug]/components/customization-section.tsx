import { ShoppingCart, Paintbrush, Rocket, Image, Palette, Type, Phone } from 'lucide-react'

const STEPS = [
    { icon: ShoppingCart, label: 'Claim', description: 'Secure your website today' },
    { icon: Paintbrush, label: 'We Customize', description: 'Share your details, we do the rest' },
    { icon: Rocket, label: 'Go Live', description: 'Launch in 2-3 days' },
]

const CUSTOMIZABLE = [
    { icon: Image, label: 'Logo & Photos', detail: 'Send us your branding and images' },
    { icon: Palette, label: 'Brand Colors', detail: 'We\'ll match your exact brand palette' },
    { icon: Type, label: 'All Content', detail: 'We\'ll update text, descriptions, and copy' },
    { icon: Phone, label: 'Contact Info', detail: 'Phone, email, address, WhatsApp' },
]

export function CustomizationSection() {
    return (
        <section className="px-4 py-14">
            <div className="max-w-2xl mx-auto">
                {/* Lime pill label — Krida style */}
                <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#AF92FF] text-[#050304] text-xs font-semibold tracking-wide">
                        Fully Customizable
                    </span>
                </div>

                <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-signifier)] font-light text-[#050304]">
                    Make it <span className="italic">yours</span>
                </h2>
                <p className="text-center text-[#050304]/50 mt-3 text-base max-w-md mx-auto leading-relaxed">
                    This isn&apos;t a locked template. After purchase, share your details and we&apos;ll tailor everything to your brand.
                </p>

                {/* 3-step process */}
                <div className="flex items-start justify-between gap-2 sm:gap-4 mt-10 mb-10">
                    {STEPS.map((step, i) => (
                        <div key={step.label} className="flex-1 flex flex-col items-center text-center relative">
                            <div className="w-12 h-12 rounded-full bg-white border border-[#050304]/8 flex items-center justify-center mb-3 shadow-sm">
                                <step.icon className="w-5 h-5 text-[#050304]/70" strokeWidth={1.5} />
                            </div>
                            <span className="text-sm font-semibold text-[#050304]">{step.label}</span>
                            <span className="text-xs text-[#050304]/40 mt-0.5">{step.description}</span>
                            {i < STEPS.length - 1 && (
                                <div className="absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-[#050304]/8" aria-hidden="true" />
                            )}
                        </div>
                    ))}
                </div>

                {/* What you can customize — dark card like Krida security section */}
                <div className="rounded-2xl bg-[#050304] p-6 sm:p-8">
                    <p className="text-white/50 text-sm font-medium mb-5">
                        Send us your details, we&apos;ll handle the rest
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CUSTOMIZABLE.map((item) => (
                            <div
                                key={item.label}
                                className="flex items-start gap-3"
                            >
                                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                                    <item.icon className="w-4 h-4 text-[#AF92FF]" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-white">{item.label}</span>
                                    <p className="text-xs text-white/40 mt-0.5">{item.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
