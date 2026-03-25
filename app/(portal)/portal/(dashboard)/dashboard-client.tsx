'use client'

import { formatDistanceToNow } from 'date-fns'
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
    updatedAt: string | null
}

export function DashboardClient({
    previewHtml,
    businessName,
    previewUrl,
    displayUrl,
    plan,
    status,
    updatedAt,
}: DashboardClientProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 md:gap-5">
            {/* Preview with browser chrome */}
            <div className="min-w-0">
                <SitePreview html={previewHtml} businessName={businessName} />
            </div>

            {/* Sidebar — refined dark cards */}
            <div className="flex flex-col gap-4">
                <UrlCard url={displayUrl} previewUrl={previewUrl} />

                {/* Plan + Status */}
                <div className="bg-[#18181b] rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-white/40 mb-2 font-semibold uppercase tracking-widest">Plan</p>
                            <PlanBadge plan={plan} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-white/40 mb-2 font-semibold uppercase tracking-widest">Status</p>
                            <StatusIndicator status={status} />
                        </div>
                    </div>
                    {updatedAt && (
                        <p className="text-[11px] text-white/25 mt-4 pt-3 border-t border-white/6">
                            Last updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
