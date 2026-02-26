"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Layers, Settings, Plus } from "lucide-react"

const items = [
    {
        title: "Dashboard",
        href: "/dashboard",
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

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard" || pathname === "/"
        }
        return pathname.startsWith(href)
    }

    return (
        <nav className="flex flex-col gap-1 flex-1">
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
            <Link
                href="/editor"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold bg-[#1a1a2e] text-white hover:bg-[#252542] transition-all"
                aria-label="Create new project"
            >
                <Plus className="h-4 w-4" />
                Create New Project
            </Link>
        </nav>
    )
}
