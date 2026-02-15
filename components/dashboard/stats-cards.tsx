"use client"

import { Card, CardContent } from "@/components/ui/card"

interface StatsCardsProps {
    stats: {
        totalCreated: number
        pendingApprovals: number
        approved: number
    }
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
                title="Total websites created"
                value={stats.totalCreated.toLocaleString()}
                subtitle="this month"
            />
            <StatsCard
                title="Pending approvals"
                value={stats.pendingApprovals.toLocaleString()}
                subtitle="this month"
            />
            <StatsCard
                title="Approved"
                value={stats.approved.toLocaleString()}
                subtitle="this month"
            />
        </div>
    )
}

function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <Card className="shadow-none border border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="text-4xl font-bold tracking-tight">{value}</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                        {subtitle}
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-8">
                    {title}
                </div>
            </CardContent>
        </Card>
    )
}
