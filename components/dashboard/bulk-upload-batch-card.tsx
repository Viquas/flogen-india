"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Map, Globe, AlertCircle, FileSpreadsheet, Download, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteBulkUploadBatch } from "@/app/(admin)/dashboard/bulk-uploads/actions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BulkUploadBatch {
  id: string
  batch_id: string
  source_filename: string
  status: "pending" | "researching" | "completed" | "partially_failed"
  total_leads: number
  found_maps: number
  found_web: number
  not_found: number
  created_at: string
}

interface BulkUploadBatchCardProps {
  batch: BulkUploadBatch
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  researching: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  partially_failed: "bg-amber-100 text-amber-700",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadBatchCard({ batch }: BulkUploadBatchCardProps) {
  const router = useRouter()

  const handleGenerateAll = async () => {
    try {
      const res = await fetch("/api/bulk-upload/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.batch_id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Generate failed")
      }
      const { generated } = await res.json()
      toast.success(`Started generation for ${generated} leads`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate")
    }
  }

  const handleDownloadCSV = async () => {
    try {
      const res = await fetch(`/api/bulk-upload/${batch.batch_id}/leads`)
      if (!res.ok) throw new Error("Failed to fetch leads")
      const leads = await res.json()

      const csvHeaders = ["business_name", "location", "email", "phone", "industry", "source", "status"]
      const csvRows = leads.map((l: Record<string, string>) =>
        csvHeaders.map((h) => `"${(l[h] || l[`research_${h}`] || "").toString().replace(/"/g, '""')}"`).join(","),
      )
      const csv = [csvHeaders.join(","), ...csvRows].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${batch.source_filename.replace(".csv", "")}-researched.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this batch and all its leads?")) return
    const result = await deleteBulkUploadBatch(batch.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Batch deleted")
      router.refresh()
    }
  }

  return (
    <div
      className="border rounded-xl p-5 hover:border-zinc-300 transition-colors cursor-pointer group"
      onClick={() => router.push(`/dashboard/bulk-uploads/${batch.batch_id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="h-5 w-5 text-zinc-400 shrink-0" />
          <h3 className="font-medium text-sm truncate">{batch.source_filename}</h3>
        </div>
        <Badge className={STATUS_STYLES[batch.status] || STATUS_STYLES.pending}>
          {batch.status.replace("_", " ")}
        </Badge>
      </div>

      <p className="text-xs text-zinc-400 mb-3">{formatDate(batch.created_at)}</p>

      {/* Source chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5">
          <Map className="h-3 w-3" />
          {batch.found_maps} Maps
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5">
          <Globe className="h-3 w-3" />
          {batch.found_web} Web
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-500 rounded-full px-2.5 py-0.5">
          <AlertCircle className="h-3 w-3" />
          {batch.not_found} Not Found
        </span>
        <span className="text-xs text-zinc-400 ml-auto">
          {batch.total_leads} total
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {batch.status === "completed" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleGenerateAll}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate All
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleDownloadCSV}
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
