'use client'

import { useState } from 'react'

interface SitePreviewProps {
    html: string
    businessName: string
}

export function SitePreview({ html, businessName }: SitePreviewProps) {
    const [loading, setLoading] = useState(true)

    return (
        <div className="relative w-full">
            {loading && (
                <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse" />
            )}
            <iframe
                srcDoc={html}
                className="w-full rounded-xl border border-gray-200 shadow-sm h-[40vh] md:h-[50vh]"
                sandbox="allow-scripts allow-same-origin"
                title={`Website preview for ${businessName}`}
                onLoad={() => setLoading(false)}
            />
        </div>
    )
}
