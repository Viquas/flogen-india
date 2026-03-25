import { redirect } from 'next/navigation'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalHeader } from '@/components/portal/portal-header'
import { PortalNav } from '@/components/portal/portal-nav'
import { NeedHelpButton } from '@/components/portal/need-help-button'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const signifier = localFont({
    src: [
        { path: '../../../../public/fonts/Signifier-Light.otf', weight: '300', style: 'normal' },
        { path: '../../../../public/fonts/Signifier-LightItalic.otf', weight: '300', style: 'italic' },
        { path: '../../../../public/fonts/Signifier-Regular.otf', weight: '400', style: 'normal' },
        { path: '../../../../public/fonts/Signifier-RegularItalic.otf', weight: '400', style: 'italic' },
        { path: '../../../../public/fonts/Signifier-Medium.otf', weight: '500', style: 'normal' },
        { path: '../../../../public/fonts/Signifier-Bold.otf', weight: '700', style: 'normal' },
        { path: '../../../../public/fonts/Signifier-BoldItalic.otf', weight: '700', style: 'italic' },
    ],
    variable: '--font-signifier',
    display: 'swap',
})

export default async function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/portal/login')
    }

    const admin = createAdminClient()

    const { data: claim } = await admin
        .from('claims')
        .select('id, project_id, plan, status, client_name, client_email')
        .eq('auth_user_id', user.id)
        .in('status', ['paid', 'customizing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!claim) {
        redirect('/portal/login')
    }

    const { data: project } = await admin
        .from('projects')
        .select('id, business_data, generated_code, slug, version')
        .eq('id', claim.project_id)
        .single()

    const businessData = project?.business_data as Record<string, unknown> | null
    const businessName = (businessData?.businessName as string) || claim.client_name || 'Your Business'

    return (
        <div className={`${inter.variable} ${signifier.variable} min-h-screen bg-[#f5f0ea] font-[family-name:var(--font-inter)]`}>
            <Toaster position="top-center" />
            <PortalHeader businessName={businessName} userEmail={user.email || ''} />
            <PortalNav currentPlan={claim.plan} />
            <main className="pb-20 md:pb-0 px-4 md:px-8 max-w-7xl mx-auto pt-4">
                {children}
            </main>
            <NeedHelpButton />
        </div>
    )
}
