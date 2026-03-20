"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { Loader2, AlertCircle, Eye, Zap, Code2, Clock, Hash } from 'lucide-react'
import { constructHtmlBoilerplate } from '@/lib/utils/html-boilerplate'

export interface StreamLogEntry {
  type: 'phase' | 'info' | 'token'
  message: string
  timestamp: number
}

interface LivePreviewProps {
  code: string | null
  isLoading?: boolean
  streamingLog?: StreamLogEntry[]
  streamingPhase?: string
  tokenCount?: number
  elapsedTime?: number
  isStreaming?: boolean
  matrixView?: boolean
}

export function LivePreview({
  code,
  isLoading,
  streamingLog = [],
  streamingPhase,
  tokenCount = 0,
  elapsedTime = 0,
  isStreaming = false,
  matrixView = false,
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate the srcDoc HTML with Babel transpilation in-browser
  const srcDoc = useMemo(() => {
    if (!code) {
      console.log('[LivePreview] No code provided')
      return null
    }
    console.log('[LivePreview] Code received, length:', code.length)
    const html = constructHtmlBoilerplate(code)
    return html
  }, [code])




  // Listen for errors posted from the sandboxed iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'preview-error') {
        setError(e.data.message)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Reset error whenever code changes
  useEffect(() => {
    setError(null)
  }, [code])

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [streamingLog])

  // Show live activity panel during streaming
  if (isLoading || isStreaming) {
    return (
      <div className="h-full w-full flex flex-col bg-[#0d1117] text-green-400 font-mono overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Zap className="h-4 w-4 text-yellow-400" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-yellow-400 rounded-full animate-ping" />
            </div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              AI Generation Active
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              <span>{tokenCount.toLocaleString()} chars</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{elapsedTime}s</span>
            </div>
          </div>
        </div>

        {/* Current phase banner */}
        {streamingPhase && (
          <div className="px-4 py-2 bg-[#1c2333] border-b border-[#30363d] flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">{streamingPhase}</span>
          </div>
        )}

        {/* Log entries */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-auto p-4 space-y-1"
        >
          {streamingLog.length === 0 && (
            <div className="flex items-center gap-2 text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Initializing generation pipeline...</span>
            </div>
          )}
          {streamingLog.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 group">
              <span className="text-[10px] text-zinc-700 mt-0.5 shrink-0 w-12 text-right font-mono">
                {((entry.timestamp) / 1000).toFixed(1)}s
              </span>
              <span className={`text-xs leading-relaxed ${entry.type === 'phase'
                ? 'text-yellow-400 font-semibold'
                : entry.type === 'info'
                  ? 'text-zinc-400'
                  : 'text-green-500/70'
                }`}>
                {entry.type === 'phase' ? '▶ ' : entry.type === 'info' ? '  ' : '  '}
                {entry.message}
              </span>
            </div>
          ))}

          {/* Live streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-700 w-12 text-right">{'    '}</span>
              <div className="flex items-center gap-1">
                <Code2 className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Writing code</span>
                <span className="inline-flex gap-0.5">
                  <span className="h-1 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer progress */}
        <div className="px-4 py-2 bg-[#161b22] border-t border-[#30363d]">
          <div className="w-full bg-[#30363d] rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: isStreaming ? '70%' : streamingPhase?.includes('Saving') ? '95%' : '30%' }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
      <div className="h-full w-full flex items-center justify-center bg-red-50 dark:bg-red-950 p-8">
        <div className="text-center max-w-lg">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-700 dark:text-red-300 font-semibold text-lg mb-2">Preview Error</p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 leading-relaxed">{error}</p>
          <p className="text-xs text-red-400 dark:text-red-500">Use the revision panel below to ask the AI to fix this error, or switch to Code view to inspect the generated code.</p>
        </div>
      </div>
    )
  }


  return (
    <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden">
      {/* Preview Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {!matrixView ? (
          <div className="w-full h-full border shadow-xl bg-white rounded-md overflow-hidden transition-all duration-300">
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc || ''}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex w-full h-full items-center justify-center gap-8 overflow-hidden">
            {/* Scaled Desktop */}
            <div className="relative w-[1024px] h-[768px] shrink-0 border border-gray-200 shadow-lg bg-white rounded-md overflow-hidden" style={{ transform: 'scale(0.65)', transformOrigin: 'center center' }}>
              <div className="absolute top-0 inset-x-0 h-8 bg-gray-100 border-b flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500 font-mono ml-2">Desktop View (1024px)</span>
              </div>
              <iframe
                srcDoc={srcDoc || ''}
                className="w-full h-[calc(100%-2rem)] border-0 mt-8"
                title="Desktop Matrix Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Scaled Mobile */}
            <div className="relative w-[375px] h-[812px] shrink-0 border-4 border-gray-800 shadow-xl bg-white rounded-[2rem] overflow-hidden" style={{ transform: 'scale(0.7)', transformOrigin: 'center center' }}>
              <div className="absolute top-0 inset-x-0 h-5 bg-zinc-800 rounded-b-lg max-w-[120px] mx-auto z-10" />
              <iframe
                srcDoc={srcDoc || ''}
                className="w-full h-full border-0"
                title="Mobile Matrix Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
