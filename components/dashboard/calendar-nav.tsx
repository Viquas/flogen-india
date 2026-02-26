"use client"

import { useState, useTransition } from "react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isBefore,
    isAfter,
    parseISO,
    getDay,
    startOfWeek,
    endOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getMonthActivityCounts } from "@/app/dashboard/actions"

// Mon=0 … Sun=6 column index (ISO week)
const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

interface CalendarNavProps {
    currentDate: string                          // YYYY-MM-DD — selected date from URL
    initialCounts: Record<string, number>        // per-day project counts for the initial month
    initialMonth: Date                           // the month that was server-rendered
}

export function CalendarNav({ currentDate, initialCounts, initialMonth }: CalendarNavProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const today = new Date()
    const selectedDate = parseISO(currentDate)

    const [viewMonth, setViewMonth] = useState<Date>(initialMonth)
    const [counts, setCounts] = useState<Record<string, number>>(initialCounts)
    const [loadingMonth, setLoadingMonth] = useState(false)

    // Navigate to a different month client-side — re-fetch counts without page reload
    const goToMonth = (newMonth: Date) => {
        setViewMonth(newMonth)
        setLoadingMonth(true)
        getMonthActivityCounts(newMonth.getFullYear(), newMonth.getMonth() + 1)
            .then((data) => setCounts(data))
            .finally(() => setLoadingMonth(false))
    }

    const handleDateClick = (dateString: string) => {
        startTransition(() => {
            router.push(`/dashboard?date=${dateString}`)
        })
    }

    // Build the 7-column week-aligned grid
    // Pad the start of the month so the first day lands in the right column
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })       // Sunday
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

    // Are we viewing a future month? (don't allow navigating beyond next month)
    const canGoForward = isBefore(viewMonth, addMonths(startOfMonth(today), 1))
    // Can we go back? Allow up to 12 months in the past
    const canGoBack = isAfter(viewMonth, addMonths(startOfMonth(today), -12))

    return (
        <div className={cn("select-none transition-opacity", loadingMonth && "opacity-60 pointer-events-none")}>
            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => canGoBack && goToMonth(subMonths(viewMonth, 1))}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                        canGoBack
                            ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            : "text-zinc-200 cursor-not-allowed"
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm font-semibold text-zinc-800 tracking-tight">
                    {format(viewMonth, "MMMM yyyy")}
                </span>

                <button
                    onClick={() => canGoForward && goToMonth(addMonths(viewMonth, 1))}
                    disabled={!canGoForward}
                    aria-label="Next month"
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                        canGoForward
                            ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            : "text-zinc-200 cursor-not-allowed"
                    )}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
                {WEEK_DAYS.map((d) => (
                    <div key={d} className="flex justify-center">
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{d}</span>
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {allDays.map((day) => {
                    const dateString = format(day, "yyyy-MM-dd")
                    const isCurrentMonth = day.getMonth() === viewMonth.getMonth()
                    const isToday = isSameDay(day, today)
                    const isSelected = isSameDay(day, selectedDate)
                    const isFuture = isAfter(day, today)
                    const count = counts[dateString] ?? 0
                    const hasActivity = count > 0

                    return (
                        <div key={dateString} className="flex flex-col items-center py-0.5">
                            <button
                                onClick={() => !isFuture && isCurrentMonth && handleDateClick(dateString)}
                                disabled={isFuture || !isCurrentMonth || isPending}
                                aria-label={`${format(day, "MMMM d, yyyy")}${hasActivity ? ` — ${count} project${count !== 1 ? "s" : ""}` : ""}`}
                                title={hasActivity ? `${count} project${count !== 1 ? "s" : ""}` : undefined}
                                className={cn(
                                    "relative flex h-9 w-9 flex-col items-center justify-center rounded-full text-sm font-medium transition-all",
                                    // Non-current-month padding days
                                    !isCurrentMonth && "invisible pointer-events-none",
                                    // Future dates
                                    isFuture && isCurrentMonth && "opacity-25 cursor-not-allowed",
                                    // Selected state (filled)
                                    isSelected && isCurrentMonth && "bg-zinc-900 text-white shadow-sm ring-2 ring-zinc-900 ring-offset-2",
                                    // Today (not selected)
                                    isToday && !isSelected && "ring-2 ring-zinc-400 ring-offset-1 text-zinc-900",
                                    // Normal past day
                                    !isSelected && !isToday && isCurrentMonth && !isFuture && "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                                )}
                            >
                                {format(day, "d")}
                            </button>

                            {/* Activity dot */}
                            {hasActivity && isCurrentMonth && !isFuture && (
                                <div className={cn(
                                    "mt-0.5 flex items-center gap-0.5",
                                )}>
                                    <span className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        isSelected ? "bg-white" : "bg-purple-500"
                                    )} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
