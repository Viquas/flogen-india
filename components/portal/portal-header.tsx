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
        <header className="bg-[#f5f0ea] px-4 md:px-6 py-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <h1 className="font-[family-name:var(--font-signifier)] text-lg md:text-xl font-medium text-[#0F172A] truncate mr-4">
                    Welcome, {businessName}
                </h1>

                <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen(!open)}
                        className="w-8 h-8 bg-[#050304] text-white rounded-full flex items-center justify-center text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
                        aria-label="Profile menu"
                    >
                        {initial}
                    </button>

                    {open && (
                        <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
                            <div className="px-3 py-2 border-b border-gray-100">
                                <p className="text-xs text-gray-500 truncate">
                                    {userEmail}
                                </p>
                            </div>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
