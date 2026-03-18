"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, CheckCircle } from "lucide-react"

interface ExportButtonProps {
  projectId: string
  disabled?: boolean
}

export function ExportButton({ projectId, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleExport = async () => {
    if (!projectId || isExporting) return

    setIsExporting(true)
    setShowSuccess(false)

    try {
      const response = await fetch(`/api/export/${projectId}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Export failed")
      }

      // Extract filename from Content-Disposition header
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

      // Brief success indicator
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err) {
      console.error("Export failed:", err)
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isExporting || !projectId}
      className="gap-2 text-zinc-600 hover:text-zinc-900"
    >
      {icon}
      {isExporting ? "Exporting..." : showSuccess ? "Downloaded" : "Export"}
    </Button>
  )
}
