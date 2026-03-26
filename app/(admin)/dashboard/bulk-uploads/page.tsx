import { createAdminClient } from "@/lib/supabase/admin"
import { BulkUploadBatchCard } from "@/components/dashboard/bulk-upload-batch-card"
import { FileSpreadsheet } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BulkUploadsPage() {
  const supabase = createAdminClient()

  const { data: batches, error } = await supabase
    .from("bulk_uploads")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-sm">Failed to load batches: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Bulk Uploads</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upload CSV files of business leads for automated research
        </p>
      </div>

      {!batches || batches.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center">
          <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
          <h3 className="text-sm font-medium text-zinc-600 mb-1">No uploads yet</h3>
          <p className="text-xs text-zinc-400">
            Click &quot;Bulk Upload&quot; in the header to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <BulkUploadBatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  )
}
