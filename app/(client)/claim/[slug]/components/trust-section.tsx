import { ShieldCheck, Lock } from 'lucide-react'

interface TrustSectionProps {
    approvedCount: number
}

export function TrustSection({ approvedCount }: TrustSectionProps) {
    return (
        <section className="px-4 py-14">
            <div className="max-w-2xl mx-auto">
                {/* Dark trust card — Krida-style dark section */}
                <div className="rounded-2xl bg-[#050304] p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <ShieldCheck className="w-4 h-4 text-[#AF92FF]" strokeWidth={1.5} />
                        <span className="text-xs font-semibold text-white/50 tracking-wide uppercase">Safe & Trusted</span>
                    </div>

                    {/* Stats row */}
                    <div className={`grid ${approvedCount > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-6 mb-8`}>
                        {approvedCount > 0 && (
                            <div>
                                <span className="text-2xl sm:text-3xl font-bold text-white">{approvedCount}+</span>
                                <p className="text-xs text-white/30 mt-1">Websites Delivered</p>
                            </div>
                        )}
                        <div>
                            <span className="text-2xl sm:text-3xl font-bold text-white">2-3</span>
                            <p className="text-xs text-white/30 mt-1">Days to Go Live</p>
                        </div>
                        <div>
                            <span className="text-2xl sm:text-3xl font-bold text-white">100%</span>
                            <p className="text-xs text-white/30 mt-1">Satisfaction Rate</p>
                        </div>
                    </div>

                    {/* Guarantee */}
                    <div className="border-t border-white/8 pt-6">
                        <p className="text-white/80 text-sm font-medium">
                            Money-back guarantee
                        </p>
                        <p className="text-white/35 text-sm mt-1 leading-relaxed">
                            Not happy with the result? We&apos;ll refund your purchase. No questions asked.
                        </p>
                    </div>
                </div>

                {/* Payment security */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <Lock className="text-[#050304]/20 w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="text-xs text-[#050304]/25">Secure payment powered by Razorpay</span>
                </div>
            </div>
        </section>
    )
}
