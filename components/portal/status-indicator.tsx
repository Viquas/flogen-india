import type { StatusResult } from '@/lib/portal/status'

interface StatusIndicatorProps {
    status: StatusResult
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
    return (
        <span className={`inline-flex items-center gap-1.5 ${status.bgColor} ${status.textColor} px-2.5 py-1 rounded-full text-xs font-medium`}>
            <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
            {status.label}
        </span>
    )
}
