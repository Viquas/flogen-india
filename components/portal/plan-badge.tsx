interface PlanBadgeProps {
    plan: string
}

export function PlanBadge({ plan }: PlanBadgeProps) {
    const isPro = plan.toLowerCase() === 'pro'

    if (isPro) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#AF92FF]/15 text-[#AF92FF] border border-[#AF92FF]/20">
                Pro
            </span>
        )
    }

    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/10">
            Standard
        </span>
    )
}
