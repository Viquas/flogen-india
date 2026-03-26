'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Star,
} from 'lucide-react'

interface LeadRow {
  id: string
  business_name: string
  email: string | null
  phone: string | null
  address: string | null
  location: string | null
  maps_url: string | null
  raw_data: Record<string, unknown> | null
}

interface LeadDetailModalProps {
  lead: LeadRow | null
  onOpenChange: (open: boolean) => void
  onGenerate: (leadId: string) => Promise<void>
}

type GenerateState = 'idle' | 'loading' | 'success'

function highlightJSON(json: string): string {
  // Escape HTML entities first
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Color JSON keys, string values, numbers, booleans, nulls
  return escaped
    .replace(
      /("(?:\\.|[^"\\])*")(\s*:)/g,
      '<span class="text-blue-600 dark:text-blue-400">$1</span>$2',
    )
    .replace(
      /:\s*("(?:\\.|[^"\\])*")/g,
      (match, val) => `: <span class="text-green-600 dark:text-green-400">${val}</span>`,
    )
    .replace(
      /:\s*(\d+(?:\.\d+)?)/g,
      ': <span class="text-amber-600 dark:text-amber-400">$1</span>',
    )
    .replace(
      /:\s*(true|false)/g,
      ': <span class="text-purple-600 dark:text-purple-400">$1</span>',
    )
    .replace(
      /:\s*(null)/g,
      ': <span class="text-zinc-400">$1</span>',
    )
}

export function LeadDetailModal({
  lead,
  onOpenChange,
  onGenerate,
}: LeadDetailModalProps) {
  const [generateState, setGenerateState] = useState<GenerateState>('idle')

  const handleGenerate = async () => {
    if (!lead || generateState !== 'idle') return
    setGenerateState('loading')
    try {
      await onGenerate(lead.id)
      setGenerateState('success')
      setTimeout(() => {
        onOpenChange(false)
        // Reset state after close animation
        setTimeout(() => setGenerateState('idle'), 300)
      }, 1500)
    } catch {
      setGenerateState('idle')
    }
  }

  // Reset generate state when opening a different lead
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setGenerateState('idle'), 300)
    }
    onOpenChange(open)
  }

  const rating = lead?.raw_data?.rating as number | undefined
  const rawJson = lead?.raw_data
    ? JSON.stringify(lead.raw_data, null, 2)
    : null

  return (
    <Dialog open={!!lead} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead?.business_name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {rating != null && (
                <>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {rating}
                  </span>
                  <span aria-hidden="true">&middot;</span>
                </>
              )}
              {lead?.phone && (
                <>
                  <span>{lead.phone}</span>
                  <span aria-hidden="true">&middot;</span>
                </>
              )}
              {(lead?.address || lead?.location) && (
                <span>{lead?.address || lead?.location}</span>
              )}
              {lead?.maps_url && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <a
                    href={lead.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View on Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* RJSON Viewer */}
        {rawJson && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Raw Data
            </p>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900 overflow-auto max-h-[400px]">
              <pre
                className="text-xs font-mono whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: highlightJSON(rawJson) }}
              />
            </div>
          </div>
        )}

        {/* Generate Website CTA */}
        <button
          onClick={handleGenerate}
          disabled={generateState !== 'idle'}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            generateState === 'success'
              ? 'bg-green-600 text-white'
              : generateState === 'loading'
                ? 'bg-primary/70 text-primary-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {generateState === 'idle' && (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Website
            </>
          )}
          {generateState === 'loading' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          )}
          {generateState === 'success' && (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Generation Queued
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  )
}
