'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Headphones } from 'lucide-react'

export function NeedHelpButton() {
    const pathname = usePathname()
    const router = useRouter()

    // Hide on the support page itself
    if (pathname === '/portal/support') {
        return null
    }

    return (
        <button
            type="button"
            onClick={() => router.push('/portal/support')}
            className="fixed bottom-24 md:bottom-8 right-4 z-40 bg-[#0F172A] text-white rounded-full p-3 shadow-lg hover:bg-[#1e293b] transition-all hover:scale-105 group"
            aria-label="Need help? Talk to our agents"
        >
            <Headphones className="w-5 h-5" />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
                Need help? Talk to our agents
            </span>
        </button>
    )
}
