import { redirect } from 'next/navigation'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { getActiveClaim, getClaimProject } from '@/lib/portal/get-claim'
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

    const claim = await getActiveClaim(user.id)

    if (!claim) {
        redirect('/portal/login')
    }

    const project = await getClaimProject(claim.project_id)

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
