"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Layers, Settings } from "lucide-react"

const items = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Templates",
        href: "/dashboard/templates",
        icon: Layers,
    },
    {
        title: "Config",
        href: "/dashboard/config",
        icon: Settings,
    },
]

export function SidebarNav() {
    const pathname = usePathname()

    // Logic to detect active state
    const isActive = (href: string) => {
        if (href === "/") {
            // Dashboard is active when on / or root domain
            return pathname === "/" || (pathname.startsWith("/?") && !pathname.includes("date="))
        }
        return pathname.startsWith(href)
    }

    return (
        <nav className="flex flex-col gap-1">
            {items.map((item, index) => (
                <Link
                    key={index}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive(item.href)
                            ? "bg-[#1a1a2e] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                    )}
                >
                    <span
                        className={cn(
                            "flex h-2 w-2 rounded-full",
                            isActive(item.href) ? "bg-blue-500" : "bg-gray-300"
                        )}
                    />
                    <span>{item.title}</span>
                </Link>
            ))}
        </nav>
    )
}
