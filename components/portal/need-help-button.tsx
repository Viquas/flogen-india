'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Headphones } from 'lucide-react'

export function NeedHelpButton() {
    const pathname = usePathname()
    const router = useRouter()

    if (pathname === '/portal/support') {
        return null
    }

    return (
        <button
            type="button"
            onClick={() => router.push('/portal/support')}
            className="fixed bottom-24 md:bottom-8 right-4 z-40 bg-[#AF92FF] text-[#050304] rounded-full p-3.5 shadow-lg shadow-[#AF92FF]/20 hover:bg-[#c4b0ff] transition-all hover:scale-105 group"
            aria-label="Need help? Talk to our agents"
        >
            <Headphones className="w-5 h-5" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#18181b] text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block shadow-lg">
                Need help? Talk to our agents
            </span>
        </button>
    )
}
