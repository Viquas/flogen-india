'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    expiresAt: string
}

function calculateTimeLeft(expiresAt: string) {
    if (!expiresAt) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    const expiry = new Date(expiresAt).getTime()
    if (isNaN(expiry)) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    const diff = expiry - Date.now()
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
        if (!expiresAt || isNaN(new Date(expiresAt).getTime())) return
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(expiresAt))
        }, 1000)
        return () => clearInterval(interval)
    }, [expiresAt])

    if (!expiresAt || timeLeft.total <= 0) return null

    return (
        <div className="max-w-md mx-auto">
            <p className="text-sm text-[#050304]/35 font-medium text-center mb-3">
                This offer expires in
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
                {UNITS.map((unit, index) => (
                    <div key={unit.key} className="flex items-center gap-2 sm:gap-3">
                        <div className="flex flex-col items-center">
                            <div className="bg-white/60 backdrop-blur-sm border border-[#050304]/5 rounded-xl px-3 py-2.5 min-w-[56px] text-center">
                                <span className="text-2xl sm:text-3xl font-bold text-[#050304] tabular-nums">
                                    {String(timeLeft[unit.key]).padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-[10px] text-[#050304]/25 uppercase font-medium mt-1.5 tracking-wider">
                                {unit.label}
                            </span>
                        </div>
                        {index < UNITS.length - 1 && (
                            <span className="text-lg font-bold text-[#050304]/10 -mt-5">:</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
