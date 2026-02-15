"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { Loader2, AlertCircle, Eye } from 'lucide-react'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'

interface LivePreviewProps {
  code: string | null
  isLoading?: boolean
}

export function LivePreview({ code, isLoading }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate the srcDoc HTML with Babel transpilation in-browser
  const srcDoc = useMemo(() => {
    if (!code) {
      console.log('[LivePreview] No code provided')
      return null
    }
    console.log('[LivePreview] Code received, length:', code.length)
    console.log('[LivePreview] Code preview:', code.substring(0, 200))
    const html = constructHtmlBoilerplate(code)
    console.log('[LivePreview] Generated HTML length:', html.length)
    return html
  }, [code])

  useEffect(() => {
    if (iframeRef.current && srcDoc) {
      console.log('[LivePreview] Setting srcDoc on iframe')
      setError(null)
    }
  }, [srcDoc])

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Generating preview...</p>
        </div>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No code to preview</p>
          <p className="text-sm text-muted-foreground">Generate code first to see the preview</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50 dark:bg-red-950">
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-700 dark:text-red-300 font-medium">Preview Error</p>
          <p className="text-sm text-red-600 dark:text-red-400 max-w-md">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc || ''}
      className="w-full h-full border-0 bg-white"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  )
}
