export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Lists</h1>
        <p className="text-muted-foreground">
          Discovery-only Google Places results saved for cold calling.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500">
        Lead batches will appear here. Use the Discovery Engine to fetch leads with &quot;Get List&quot;.
      </div>
    </div>
  )
}
