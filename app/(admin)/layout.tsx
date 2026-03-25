import Link from "next/link"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "sonner"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/supabase/roles"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Auth guard — defense in depth (middleware also checks)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen">
            <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border">
                <div className="flex flex-col h-full p-4">
                    <Link href="/dashboard" className="mb-6 px-2 block">
                        <img src="/flogen-logo-dark.svg" alt="Flogen" className="h-6" />
                    </Link>
                    <SidebarNav />
                </div>
            </aside>

            <main className="ml-[220px] flex-1 min-h-screen bg-background text-foreground">
                <ErrorBoundary fallbackTitle="Dashboard Error">
                    {children}
                </ErrorBoundary>
            </main>
            <Toaster position="bottom-right" richColors />
        </div>
    )
}
