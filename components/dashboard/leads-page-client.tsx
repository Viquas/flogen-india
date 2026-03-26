'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  CalendarDays,
  ChevronDown,
  Download,
  FileSearch,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { LeadDetailModal } from '@/components/dashboard/lead-detail-modal'

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

interface LeadBatch {
  batch_id: string
  query: string
  location: string
  lead_count: number
  created_at: string
  leads: LeadRow[]
}

interface LeadsPageClientProps {
  batches: LeadBatch[]
  selectedDate: string
}

export function LeadsPageClient({ batches, selectedDate }: LeadsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null)
  const [generatedLeadIds, setGeneratedLeadIds] = useState<Set<string>>(
    new Set(),
  )

  const dateObj = parseISO(selectedDate)
  const formattedDate = format(dateObj, 'EEE d MMM')

  function handleDateChange(value: string) {
    setShowDatePicker(false)
    startTransition(() => {
      router.push(`/dashboard/leads?date=${value}`)
    })
  }

  const handleGenerate = useCallback(async (leadId: string) => {
    const res = await fetch(`/api/leads/${leadId}/generate`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Generation failed')
      throw new Error(data.error || 'Generation failed')
    }
    setGeneratedLeadIds((prev) => new Set(prev).add(leadId))
    toast.success('Website generation queued')
  }, [])

  function handleDownloadCSV(batch: LeadBatch) {
    const headers = [
      'Company Name',
      'Email',
      'Phone',
      'Location',
      'Google Maps URL',
    ]
    const rows = batch.leads.map((lead) => [
      lead.business_name,
      lead.email || '',
      lead.phone || '',
      lead.address || lead.location || '',
      lead.maps_url || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','),
      )
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeQuery = batch.query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '')
    const dateStr = format(parseISO(batch.created_at), 'yyyy-MM-dd')
    link.href = url
    link.download = `leads-${safeQuery}-${dateStr}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Lists</h1>
          <p className="text-muted-foreground">
            Discovery-only Google Places results saved for cold calling.
          </p>
        </div>

        {/* Date picker button */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {formattedDate}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showDatePicker && (
            <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border bg-white p-2 shadow-lg dark:bg-zinc-900">
              <input
                type="date"
                defaultValue={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* Batch list */}
      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        {batches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <FileSearch className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p>No leads found for this date.</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Use the Discovery Engine to fetch leads with &quot;Get List&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {batches.map((batch) => (
              <BatchCard
                key={batch.batch_id}
                batch={batch}
                onSelectLead={setSelectedLead}
                onDownloadCSV={handleDownloadCSV}
                generatedLeadIds={generatedLeadIds}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lead detail modal */}
      <LeadDetailModal
        lead={selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onGenerate={handleGenerate}
      />
    </div>
  )
}

function BatchCard({
  batch,
  onSelectLead,
  onDownloadCSV,
  generatedLeadIds,
}: {
  batch: LeadBatch
  onSelectLead: (lead: LeadRow) => void
  onDownloadCSV: (batch: LeadBatch) => void
  generatedLeadIds: Set<string>
}) {
  const batchTime = format(parseISO(batch.created_at), 'HH:mm')

  return (
    <section className="rounded-lg border">
      {/* Batch header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">
            {batch.query} in {batch.location}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {batch.lead_count} lead{batch.lead_count !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-muted-foreground">{batchTime}</span>
        </div>
        <button
          onClick={() => onDownloadCSV(batch)}
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </button>
      </div>

      {/* Lead table header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 border-b px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div>Company Name</div>
        <div>Email</div>
        <div>Phone</div>
        <div>Location</div>
      </div>

      {/* Lead rows */}
      {batch.leads.map((lead) => (
        <div
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 border-b last:border-b-0 px-4 py-2.5 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 font-medium truncate">
            {generatedLeadIds.has(lead.id) && (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
            )}
            <span className="truncate">{lead.business_name}</span>
          </div>
          <div className="text-muted-foreground truncate">
            {lead.email || '\u2014'}
          </div>
          <div className="text-muted-foreground truncate">
            {lead.phone || '\u2014'}
          </div>
          <div className="text-muted-foreground truncate">
            {lead.location || lead.address || '\u2014'}
          </div>
        </div>
      ))}
    </section>
  )
}
