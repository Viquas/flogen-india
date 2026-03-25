export type SiteStatus = 'active' | 'customization_pending' | 'update_in_progress'

export interface StatusResult {
    status: SiteStatus
    label: string
    dotColor: string
    textColor: string
    bgColor: string
}

export function deriveSiteStatus(input: {
    pendingRequestCount: number
    inProgressRequestCount: number
}): StatusResult {
    if (input.inProgressRequestCount > 0) {
        return {
            status: 'update_in_progress',
            label: 'Update in Progress',
            dotColor: 'bg-[#AF92FF]',
            textColor: 'text-[#AF92FF]',
            bgColor: 'bg-[#AF92FF]/10',
        }
    }

    if (input.pendingRequestCount > 0) {
        return {
            status: 'customization_pending',
            label: 'Customization Pending',
            dotColor: 'bg-amber-400',
            textColor: 'text-amber-400',
            bgColor: 'bg-amber-400/10',
        }
    }

    return {
        status: 'active',
        label: 'Active',
        dotColor: 'bg-green-400',
        textColor: 'text-green-400',
        bgColor: 'bg-green-400/10',
    }
}
