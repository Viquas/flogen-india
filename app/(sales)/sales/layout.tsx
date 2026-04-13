import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { SalesSidebar } from '@/components/sales/sales-sidebar'
import { ErrorBoundary } from '@/components/error-boundary'
import { checkHasSalesAccess } from '@/lib/auth/require-sales'

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sales-login')
    }

    const hasAccess = await checkHasSalesAccess(user.id)
    if (!hasAccess) {
        redirect('/sales-login')
    }

    return (
        <div className="flex min-h-screen bg-background">
            <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border">
                <div className="flex flex-col h-full p-4">
                    <Link href="/sales" className="mb-6 px-2 block">
                        <img src="/flogen-logo-dark.svg" alt="Flogen Sales" className="h-6" />
                    </Link>
                    <SalesSidebar />
                </div>
            </aside>

            <main className="ml-[220px] flex-1 min-h-screen text-foreground">
                <ErrorBoundary fallbackTitle="Sales Dashboard Error">
                    {children}
                </ErrorBoundary>
            </main>
            <Toaster position="bottom-right" richColors />
        </div>
    )
}
