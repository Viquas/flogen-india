'use client'

import { useState } from 'react'

interface SitePreviewProps {
    html: string
    businessName: string
}

export function SitePreview({ html, businessName }: SitePreviewProps) {
    const [loading, setLoading] = useState(true)

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/10 bg-[#18181b]">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex justify-center">
                    <span className="text-[11px] text-white/25 font-mono tracking-wide">
                        Desktop View (1024px)
                    </span>
                </div>
            </div>

            {/* Iframe */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-[#18181b] animate-pulse" />
                )}
                <iframe
                    srcDoc={html}
                    className="w-full h-[50vh] md:h-[80vh] bg-white"
                    sandbox="allow-scripts allow-same-origin"
                    title={`Website preview for ${businessName}`}
                    onLoad={() => setLoading(false)}
                />
            </div>
        </div>
    )
}
