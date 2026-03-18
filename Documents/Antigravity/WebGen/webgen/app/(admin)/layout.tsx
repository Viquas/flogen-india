import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border">
                <div className="flex flex-col h-full p-4">
                    <div className="mb-8 pl-3">
                        <h1 className="text-base font-semibold text-sidebar-foreground tracking-tight">App Home</h1>
                    </div>
                    <SidebarNav />
                </div>
            </aside>

            <main className="ml-[220px] flex-1 min-h-screen bg-background text-foreground">
                <div className="p-8 max-w-[1200px] mx-auto">
                    <ErrorBoundary fallbackTitle="Dashboard Error">
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    )
}
