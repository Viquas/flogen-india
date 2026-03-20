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
        <Card className="rounded-xl border border-border bg-card">
            <CardContent className="p-5">
                <div className="flex flex-col gap-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {title}
                    </div>
                    <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {subtitle}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
