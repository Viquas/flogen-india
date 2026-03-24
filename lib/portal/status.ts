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
            dotColor: 'bg-amber-500',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
        }
    }

    if (input.pendingRequestCount > 0) {
        return {
            status: 'customization_pending',
            label: 'Customization Pending',
            dotColor: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
        }
    }

    return {
        status: 'active',
        label: 'Active',
        dotColor: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
    }
}
