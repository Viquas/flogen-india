"use client"

import { useState } from "react"
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { ProjectListDialog } from "./project-list-dialog"
import { useRouter } from "next/navigation"

interface CalendarNavProps {
    currentDate: string // YYYY-MM-DD
}

export function CalendarNav({ currentDate }: CalendarNavProps) {
    const [selectedDateForDialog, setSelectedDateForDialog] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const today = new Date()
    const currentMonth = startOfMonth(today)
    const nextMonth = addMonths(currentMonth, 1)

    const parsedCurrentDate = parseISO(currentDate)

    const router = useRouter()

    const handleDateClick = (dateString: string) => {
        setSelectedDateForDialog(dateString)
        setIsDialogOpen(true)
        // Also update URL to refresh the grid below
        router.push(`/?date=${dateString}`)
    }

    const renderMonthRow = (monthStart: Date) => {
        const monthEnd = endOfMonth(monthStart)
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

        return (
            <div className="mb-8">
                <h3 className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {format(monthStart, "MMMM")}
                </h3>
                <div className="flex flex-wrap gap-3">
                    {days.map((day) => {
                        const dateString = format(day, "yyyy-MM-dd")
                        const isSelected = isSameDay(day, parsedCurrentDate)
                        const dayNumber = format(day, "d")

                        return (
                            <button
                                key={dateString}
                                onClick={() => handleDateClick(dateString)}
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all",
                                    isSelected
                                        ? "bg-gray-800 text-white shadow-md ring-2 ring-gray-800 ring-offset-2"
                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900"
                                )}
                            >
                                {dayNumber}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="py-6">
            {renderMonthRow(currentMonth)}
            {renderMonthRow(nextMonth)}

            <ProjectListDialog
                date={selectedDateForDialog}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </div>
    )
}
