'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Phone, CalendarClock, Users, LogOut } from 'lucide-react'
import { logoutSales } from '@/app/sales-login/login-actions'

const items = [
    { title: 'Overview', href: '/sales', icon: LayoutDashboard, exact: true },
    { title: 'Leads', href: '/sales/leads', icon: Phone },
    { title: 'My Follow-ups', href: '/sales/followups', icon: CalendarClock },
    { title: 'Team', href: '/sales/team', icon: Users },
]

export function SalesSidebar() {
    const pathname = usePathname()

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href
        return pathname === href || pathname.startsWith(href + '/')
    }

    return (
        <nav className="flex flex-col gap-0.5 flex-1">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
                Sales
            </span>
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href, item.exact)
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    )}
                >
                    <item.icon
                        className={cn(
                            'h-4 w-4',
                            isActive(item.href, item.exact) ? 'text-emerald-600' : 'text-gray-400',
                        )}
                    />
                    <span>{item.title}</span>
                </Link>
            ))}

            <div className="mt-auto pt-4 border-t border-gray-100">
                <form action={logoutSales}>
                    <button
                        type="submit"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4 text-gray-400" />
                        <span>Logout</span>
                    </button>
                </form>
            </div>
        </nav>
    )
}
