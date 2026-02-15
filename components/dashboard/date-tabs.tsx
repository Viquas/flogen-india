"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, parseISO, isToday, isYesterday } from 'date-fns'

interface DateTabsProps {
    dates: string[]
    selectedDate: string | null
}

export function DateTabs({ dates, selectedDate }: DateTabsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const formatDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr)
        if (isToday(date)) return 'Today'
        if (isYesterday(date)) return 'Yesterday'
        return format(date, 'MMM d')
    }

    const handleDateChange = (date: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', date)
        router.push(`/dashboard?${params.toString()}`)
    }

    if (dates.length === 0) {
        return (
            <div className="text-muted-foreground text-sm">
                No projects found. Ingest some data via the webhook to get started.
            </div>
        )
    }

    return (
        <Tabs value={selectedDate || dates[0]} onValueChange={handleDateChange}>
            <TabsList className="flex flex-wrap h-auto gap-1">
                {dates.map((date) => (
                    <TabsTrigger key={date} value={date} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {formatDateLabel(date)}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}
