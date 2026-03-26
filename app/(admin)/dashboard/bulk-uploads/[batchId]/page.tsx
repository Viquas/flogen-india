import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { BulkUploadLeadTable } from "@/components/dashboard/bulk-upload-lead-table"
import { Map, Globe, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  researching: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  partially_failed: "bg-amber-100 text-amber-700",
}

interface PageProps {
  params: Promise<{ batchId: string }>
}

export default async function BulkUploadBatchPage({ params }: PageProps) {
  const { batchId } = await params
  const supabase = createAdminClient()

  const { data: batch, error } = await supabase
    .from("bulk_uploads")
    .select("*")
    .eq("batch_id", batchId)
    .single()

  if (error || !batch) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/bulk-uploads"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bulk Uploads
        </Link>
        <p className="text-red-500 text-sm">Batch not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/bulk-uploads"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bulk Uploads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {batch.source_filename}
            </h1>
            <Badge className={STATUS_STYLES[batch.status] || STATUS_STYLES.pending}>
              {batch.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {batch.total_leads} total leads &middot;{" "}
            {new Date(batch.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-4 py-2.5">
          <Map className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-600 font-medium">Google Maps</p>
            <p className="text-lg font-semibold text-emerald-700 tabular-nums">
              {batch.found_maps}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2.5">
          <Globe className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Web Search</p>
            <p className="text-lg font-semibold text-blue-700 tabular-nums">
              {batch.found_web}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-500 font-medium">Not Found</p>
            <p className="text-lg font-semibold text-zinc-600 tabular-nums">
              {batch.not_found}
            </p>
          </div>
        </div>
      </div>

      {/* Lead table */}
      <BulkUploadLeadTable batchId={batchId} />
    </div>
  )
}
