'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Globe, Palette, HeadphonesIcon } from 'lucide-react'

const NAV_ITEMS = [
    { href: '/portal', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
    { href: '/portal/domain', label: 'Domain', icon: Globe, enabled: false },
    { href: '/portal/customize', label: 'Customize', icon: Palette, enabled: false },
    { href: '/portal/support', label: 'Support', icon: HeadphonesIcon, enabled: false },
]

interface PortalNavProps {
    currentPlan: string
}

export function PortalNav({ currentPlan: _currentPlan }: PortalNavProps) {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:static md:border-t-0 md:border-b md:border-gray-200">
            <div className="flex items-center justify-around md:justify-start md:gap-1 md:max-w-5xl md:mx-auto md:px-6 py-1 md:py-0">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    if (!item.enabled) {
                        return (
                            <div
                                key={item.href}
                                className="flex flex-col items-center gap-0.5 px-3 py-2 opacity-40 cursor-not-allowed md:flex-row md:gap-2 md:py-3 md:border-b-2 md:border-transparent relative"
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] md:text-xs text-gray-500">
                                    {item.label}
                                </span>
                                <span className="absolute -top-1 right-0 text-[8px] bg-gray-200 text-gray-500 px-1 rounded-full hidden md:inline">
                                    Soon
                                </span>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors md:flex-row md:gap-2 md:py-3 md:border-b-2 ${
                                isActive
                                    ? 'text-[#0F172A] md:border-[#0F172A]'
                                    : 'text-gray-400 hover:text-gray-600 md:border-transparent'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
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
