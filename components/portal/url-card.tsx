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
        <div className="bg-[#18181b] rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/10 ring-1 ring-white/5">
            <p className="text-[10px] text-white/40 mb-3 font-semibold uppercase tracking-widest">Your website</p>
            <div className="flex items-center gap-3">
                <span className="text-sm text-white/90 truncate flex-1 font-mono">
                    {url}
                </span>
                <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 hover:bg-white/5 rounded-lg transition-colors"
                    aria-label="Copy URL"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                    ) : (
                        <Copy className="w-4 h-4 text-white/30" />
                    )}
                </button>
                <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 bg-[#AF92FF] text-[#050304] text-xs font-semibold rounded-full hover:bg-[#c4b0ff] transition-colors"
                >
                    Visit Site
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    )
}
