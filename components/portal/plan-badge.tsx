interface PlanBadgeProps {
    plan: string
}

export function PlanBadge({ plan }: PlanBadgeProps) {
    const isPro = plan.toLowerCase() === 'pro'

    if (isPro) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#AF92FF]/10 text-[#7C5AE2]">
                Pro
            </span>
        )
    }

    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            Standard
        </span>
    )
}
