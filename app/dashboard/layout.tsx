import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 z-40 h-screen w-[180px] bg-[#f5f5f5] border-r border-gray-200">
                <div className="flex flex-col h-full p-4">
                    <div className="mb-8 pl-3">
                        <h1 className="text-sm font-semibold text-gray-800">WebGen v1</h1>
                    </div>
                    <SidebarNav />
                </div>
            </aside>

            <main className="ml-[180px] flex-1 min-h-screen bg-white">
                <div className="p-8">
                    <ErrorBoundary fallbackTitle="Dashboard Error">
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    )
}
