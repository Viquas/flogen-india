'use client'

import { useState, useEffect, useRef } from 'react'
import { logout } from '@/app/(portal)/portal/logout-action'

interface PortalHeaderProps {
    businessName: string
    userEmail: string
}

export function PortalHeader({ businessName, userEmail }: PortalHeaderProps) {
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const initial = businessName.charAt(0).toUpperCase()

    return (
        <header className="bg-[#f5f0ea] px-4 md:px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <img src="/sumosite-logo-dark.svg" alt="Sumosite" className="h-6 shrink-0" />
                    <span className="text-[#0F172A]/15 shrink-0">|</span>
                    <h1 className="font-[family-name:var(--font-signifier)] text-xl md:text-2xl font-light text-[#0F172A] truncate">
                        {businessName}
                    </h1>
                </div>

                <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen(!open)}
                        className="w-9 h-9 bg-[#18181b] text-white rounded-full flex items-center justify-center text-sm font-medium hover:bg-[#27272a] transition-colors ring-2 ring-white/20"
                        aria-label="Profile menu"
                    >
                        {initial}
                    </button>

                    {open && (
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 z-50 py-2 overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Account</p>
                                <p className="text-xs text-gray-600 truncate">
                                    {userEmail}
                                </p>
                            </div>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Log out
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
