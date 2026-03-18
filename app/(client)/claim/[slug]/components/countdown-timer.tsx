'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    expiresAt: string
}

function calculateTimeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
        total: diff,
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
    }
}

const UNITS = [
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'minutes', label: 'Minutes' },
    { key: 'seconds', label: 'Seconds' },
] as const

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiresAt))

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(expiresAt))
        }, 1000)
        return () => clearInterval(interval)
    }, [expiresAt])

    if (timeLeft.total <= 0) {
        return null
    }

    return (
        <div className="text-center">
            <p className="text-sm text-gray-500 text-center mb-3">
                Offer expires in
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
                {UNITS.map((unit, index) => (
                    <div key={unit.key} className="flex items-center gap-2 sm:gap-3">
                        <div className="flex flex-col items-center">
                            <div className="bg-[#F8FAFC] rounded-lg px-3 py-2 min-w-[60px] text-center">
                                <span className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
                                    {String(timeLeft[unit.key]).padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 uppercase mt-1">
                                {unit.label}
                            </span>
                        </div>
                        {index < UNITS.length - 1 && (
                            <span className="text-xl font-bold text-gray-300 -mt-5">
                                :
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
