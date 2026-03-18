import { CheckCircle, ShieldCheck, Lock } from 'lucide-react'

interface TrustSectionProps {
    approvedCount: number
}

export function TrustSection({ approvedCount }: TrustSectionProps) {
    return (
        <section className="px-4 py-8">
            <div className="flex flex-col items-center gap-4">
                {approvedCount > 0 && (
                    <div className="flex items-center gap-2">
                        <CheckCircle className="text-[#2563EB] w-5 h-5" />
                        <span className="text-sm font-medium text-[#0F172A]">
                            Trusted by {approvedCount}+ businesses
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-[#2563EB] w-5 h-5" />
                    <span className="text-sm font-medium text-[#0F172A]">
                        100% Satisfaction Guarantee
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Lock className="text-gray-400 w-5 h-5" />
                    <span className="text-sm text-gray-500">
                        Powered by Razorpay
                    </span>
                </div>
            </div>
        </section>
    )
}
