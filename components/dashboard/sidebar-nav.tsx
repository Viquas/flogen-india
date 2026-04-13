"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Layers, BarChart3, Palette, TrendingDown, Settings, Users, ClipboardList, Wrench, Upload, MessageSquare, LogOut, Phone } from "lucide-react"
import { logoutAdmin } from "@/app/login/login-actions"

const sections = [
    {
        label: "Main",
        items: [
            { title: "Home", href: "/dashboard", icon: LayoutDashboard },
            { title: "Templates", href: "/dashboard/templates", icon: Layers },
            { title: "DLS", href: "/dashboard/dls", icon: Palette },
        ],
    },
    {
        label: "Manage",
        items: [
            { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
            { title: "Queries", href: "/dashboard/queries", icon: MessageSquare },
            { title: "Funnel", href: "/dashboard/funnel", icon: TrendingDown },
            { title: "Config", href: "/dashboard/config", icon: Settings },
        ],
    },
    {
        label: "Fulfillment",
        items: [
            { title: "Lead Lists", href: "/dashboard/leads", icon: ClipboardList },
            { title: "Custom Builds", href: "/dashboard/custom", icon: Wrench },
            { title: "Clients", href: "/dashboard/clients", icon: Users },
            { title: "Bulk Uploads", href: "/dashboard/bulk-uploads", icon: Upload },
            { title: "Sales CRM", href: "/sales", icon: Phone },
        ],
    },
]

export function SidebarNav() {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard" || pathname === "/"
        }
        return pathname.startsWith(href)
    }

    return (
        <nav className="flex flex-col gap-6 flex-1">
            {sections.map((section) => (
                <div key={section.label} className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 mb-1">
                        {section.label}
                    </span>
                    {section.items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive(item.href)
                                    ? "bg-purple-50 text-purple-700"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn(
                                "h-4 w-4",
                                isActive(item.href) ? "text-purple-600" : "text-gray-400"
                            )} />
                            <span>{item.title}</span>
                        </Link>
                    ))}
                </div>
            ))}

            <div className="mt-auto pt-4 border-t border-gray-100">
                <form action={logoutAdmin}>
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
