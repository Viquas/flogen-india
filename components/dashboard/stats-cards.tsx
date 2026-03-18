"use client"

import { Card, CardContent } from "@/components/ui/card"

interface StatsCardsProps {
    stats: {
        totalCreated: number
        pendingApprovals: number
        approved: number
    }
    costStats?: {
        monthlySpendUsd: number
        monthlyGenerations: number
    }
}

export function StatsCards({ stats, costStats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
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
            {costStats && (
                <StatsCard
                    title="Monthly Spend"
                    value={`$${costStats.monthlySpendUsd.toFixed(2)}`}
                    subtitle={`${costStats.monthlyGenerations} AI calls this month`}
                />
            )}
        </div>
    )
}

function StatsCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <Card className="rounded-lg shadow-sm border border-border bg-card">
            <CardContent className="p-5">
                <div className="flex flex-col gap-1 pb-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        {title}
                    </div>
                    <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                        {subtitle}
                        <svg className="ml-1 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
