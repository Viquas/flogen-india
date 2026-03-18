"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, CheckCircle, Copy, Link2, ChevronDown, FileCode } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface ExportButtonProps {
  projectId: string
  generatedCode?: string | null
  disabled?: boolean
}

export function ExportButton({ projectId, generatedCode, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const showSuccessBriefly = (message: string) => {
    setSuccessMessage(message)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleExportHtml = async () => {
    if (!projectId || isExporting) return
    setIsExporting(true)
    try {
      const response = await fetch(`/api/export/${projectId}`)
      if (!response.ok) throw new Error("Export failed")
      const disposition = response.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] || "website.html"
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccessBriefly("Downloaded")
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyCode = async () => {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
      showSuccessBriefly("Copied")
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = generatedCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showSuccessBriefly("Copied")
    }
  }

  const handleShareLink = async () => {
    if (!projectId || isExporting) return
    setIsExporting(true)
    try {
      const response = await fetch(`/api/export/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share' }),
      })
      if (!response.ok) {
        // Fallback: copy the editor URL
        await navigator.clipboard.writeText(`${window.location.origin}/editor?id=${projectId}`)
        showSuccessBriefly("Link copied")
        return
      }
      const { url } = await response.json()
      await navigator.clipboard.writeText(url)
      showSuccessBriefly("Link copied")
    } catch {
      await navigator.clipboard.writeText(`${window.location.origin}/editor?id=${projectId}`)
      showSuccessBriefly("Link copied")
    } finally {
      setIsExporting(false)
    }
  }

  const icon = showSuccess ? (
    <CheckCircle className="h-4 w-4 text-green-600" />
  ) : isExporting ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Download className="h-4 w-4" />
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || !projectId}
          className="gap-1.5 text-zinc-600 hover:text-zinc-900"
        >
          {icon}
          {showSuccess ? successMessage : "Export"}
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-zinc-500">Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportHtml} className="gap-2 cursor-pointer">
          <Download className="h-4 w-4" />
          Download HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyCode} disabled={!generatedCode} className="gap-2 cursor-pointer">
          <Copy className="h-4 w-4" />
          Copy React Code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareLink} className="gap-2 cursor-pointer">
          <Link2 className="h-4 w-4" />
          Copy Share Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
