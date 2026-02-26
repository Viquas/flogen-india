"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

interface QuickDateChipsProps {
    todayString: string       // YYYY-MM-DD
    yesterdayString: string   // YYYY-MM-DD
    selectedDate: string      // YYYY-MM-DD — currently active date
}

export function QuickDateChips({ todayString, yesterdayString, selectedDate }: QuickDateChipsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const navigate = (dateString: string) => {
        startTransition(() => {
            router.push(`/dashboard?date=${dateString}`)
        })
    }

    const chips = [
        { label: "Today", value: todayString },
        { label: "Yesterday", value: yesterdayString },
    ]

    return (
        <div className="flex items-center gap-2">
            {chips.map((chip) => {
                const isActive = selectedDate === chip.value
                return (
                    <button
                        key={chip.value}
                        onClick={() => navigate(chip.value)}
                        disabled={isPending}
                        aria-label={`Show projects for ${chip.label}`}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            isActive
                                ? "bg-zinc-900 text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                        )}
                    >
                        {chip.label}
                    </button>
                )
            })}
        </div>
    )
}
