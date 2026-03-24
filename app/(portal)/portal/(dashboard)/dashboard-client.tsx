'use client'

import type { StatusResult } from '@/lib/portal/status'
import { SitePreview } from '@/components/portal/site-preview'
import { UrlCard } from '@/components/portal/url-card'
import { PlanBadge } from '@/components/portal/plan-badge'
import { StatusIndicator } from '@/components/portal/status-indicator'

interface DashboardClientProps {
    previewHtml: string
    businessName: string
    previewUrl: string
    displayUrl: string
    plan: string
    status: StatusResult
}

export function DashboardClient({
    previewHtml,
    businessName,
    previewUrl,
    displayUrl,
    plan,
    status,
}: DashboardClientProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4 md:gap-6">
            {/* Preview */}
            <div className="min-w-0">
                <SitePreview html={previewHtml} businessName={businessName} />
            </div>

            {/* Info sidebar */}
            <div className="flex flex-col gap-4">
                <UrlCard url={displayUrl} previewUrl={previewUrl} />

                {/* Plan + Status card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Your plan</p>
                            <PlanBadge plan={plan} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <StatusIndicator status={status} />
                        </div>
                    </div>
                </div>

                {/* Quick links placeholder */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Quick links</p>
                    <p className="text-sm text-gray-400">
                        More features coming soon
                    </p>
                </div>
            </div>
        </div>
    )
}
