'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'

export function SharePreviewButton({
    slug,
    businessName,
}: {
    slug: string | null
    businessName: string
}) {
    const [copied, setCopied] = useState(false)

    const previewPath = slug ? `/preview/${slug}` : null

    async function handleCopy() {
        if (!previewPath) {
            toast.error('No preview slug on this project yet')
            return
        }
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const url = origin + previewPath
        const message = `Hi ${businessName} team — we built a website sample for your business. Take a look: ${url}`
        try {
            await navigator.clipboard.writeText(message)
            setCopied(true)
            toast.success('WhatsApp message copied')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Could not copy to clipboard')
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={!previewPath}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy WhatsApp message'}
        </button>
    )
}
