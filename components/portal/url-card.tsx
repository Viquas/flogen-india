'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'

interface UrlCardProps {
    url: string
    previewUrl: string
}

export function UrlCard({ url, previewUrl }: UrlCardProps) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('URL copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">Your website</p>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#0F172A] truncate flex-1">
                    {url}
                </span>
                <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Copy URL"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                    )}
                </button>
                <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#050304] text-white text-xs font-medium rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                    Visit Site
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    )
}
