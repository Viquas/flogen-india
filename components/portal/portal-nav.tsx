'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Globe, Palette, HeadphonesIcon } from 'lucide-react'

const NAV_ITEMS = [
    { href: '/portal', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
    { href: '/portal/domain', label: 'Domain', icon: Globe, enabled: true },
    { href: '/portal/customize', label: 'Customize', icon: Palette, enabled: true },
    { href: '/portal/support', label: 'Support', icon: HeadphonesIcon, enabled: true },
]

interface PortalNavProps {
    currentPlan: string
}

export function PortalNav({ currentPlan: _currentPlan }: PortalNavProps) {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#f5f0ea]/95 backdrop-blur-md border-t border-black/5 z-50 md:static md:border-t-0 md:border-b-0">
            <div className="flex items-center justify-around md:justify-center md:gap-1 max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    if (!item.enabled) {
                        return (
                            <div
                                key={item.href}
                                className="flex flex-col items-center gap-0.5 px-3 py-2 opacity-30 cursor-not-allowed md:flex-row md:gap-2 md:px-4 md:py-2 md:rounded-full"
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-[10px] md:text-xs font-medium text-gray-500">
                                    {item.label}
                                </span>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-all md:flex-row md:gap-2 md:px-4 md:py-2 md:rounded-full ${
                                isActive
                                    ? 'text-white md:bg-[#18181b] md:shadow-sm'
                                    : 'text-[#0F172A]/40 hover:text-[#0F172A] md:hover:bg-black/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] md:text-xs font-medium">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
