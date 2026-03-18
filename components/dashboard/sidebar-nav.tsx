"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Layers, Settings, Plus, BarChart3 } from "lucide-react"

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
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
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
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                            ? "bg-zinc-200/50 text-foreground font-semibold"
                            : "text-muted-foreground hover:bg-zinc-100/80 hover:text-foreground"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                </Link>
            ))}
            <Link
                href="/editor"
                className="mt-6 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                aria-label="Create new project"
            >
                <Plus className="h-4 w-4" />
                Create New Project
            </Link>
        </nav>
    )
}
