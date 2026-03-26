"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy, Check } from "lucide-react"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BulkUploadDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: Record<string, unknown>
  title: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadDataModal({ open, onOpenChange, data, title }: BulkUploadDataModalProps) {
  const [copied, setCopied] = useState(false)

  const jsonStr = JSON.stringify(data, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement("textarea")
      textarea.value = jsonStr
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{title || "Lead Data"}</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh] rounded-lg border bg-zinc-50 p-4">
          <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono">
            {jsonStr}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
