'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  parseISO,
  addDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameWeek,
  getDay,
} from 'date-fns'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
  CheckCircle2,
  Filter,
  Layers,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LeadDetailModal } from '@/components/dashboard/lead-detail-modal'

interface LeadRow {
  id: string
  business_name: string
  email: string | null
  phone: string | null
  address: string | null
  location: string | null
  maps_url: string | null
  website: string | null
  raw_data: Record<string, unknown> | null
  niche_score: number | null
  pitch_angle: string | null
  audit_signals: Record<string, unknown> | null
}

type WebsiteFilter = 'all' | 'with-website' | 'without-website'

export type LeadsView = 'day' | 'week' | 'month'

export interface DaySummary {
  leads: number
  batches: number
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
  daySummaries: Record<string, DaySummary>
  selectedDate: string
  selectedPool: 'website' | 'automation'
  view: LeadsView
  todayStr: string
}

const VIEWS: { value: LeadsView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

export function LeadsPageClient({
  batches,
  daySummaries,
  selectedDate,
  selectedPool,
  view,
  todayStr,
}: LeadsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null)
  const [generatedLeadIds, setGeneratedLeadIds] = useState<Set<string>>(
    new Set(),
  )
  const [websiteFilter, setWebsiteFilter] = useState<WebsiteFilter>('all')

  const dateObj = parseISO(selectedDate)
  const todayObj = parseISO(todayStr)

  function navigate(next: { view?: LeadsView; date?: string; pool?: 'website' | 'automation' }) {
    setShowDatePicker(false)
    const params = new URLSearchParams({
      view: next.view ?? view,
      date: next.date ?? selectedDate,
      pool: next.pool ?? selectedPool,
    })
    startTransition(() => {
      router.push(`/dashboard/leads?${params.toString()}`)
    })
  }

  function stepRange(direction: 1 | -1) {
    const next =
      view === 'month'
        ? addMonths(dateObj, direction)
        : addDays(dateObj, direction * (view === 'week' ? 7 : 1))
    navigate({ date: format(next, 'yyyy-MM-dd') })
  }

  const rangeLabel =
    view === 'day'
      ? format(dateObj, 'EEE d MMM yyyy')
      : view === 'week'
        ? `${format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'd MMM')} – ${format(endOfWeek(dateObj, { weekStartsOn: 1 }), 'd MMM yyyy')}`
        : format(dateObj, 'MMMM yyyy')

  const isCurrentPeriod =
    view === 'day'
      ? selectedDate === todayStr
      : view === 'week'
        ? isSameWeek(dateObj, todayObj, { weekStartsOn: 1 })
        : isSameMonth(dateObj, todayObj)

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
      'Phone',
      'Email',
      'Location',
      'Website',
      'Google Maps URL',
    ]
    const rows = batch.leads.map((lead) => [
      lead.business_name,
      lead.phone || '',
      lead.email || '',
      lead.address || lead.location || '',
      lead.website || '',
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

  // Apply website filter to batch leads (day/week views)
  const filteredBatches = batches
    .map((batch) => {
      if (websiteFilter === 'all') return batch
      const filtered = batch.leads.filter((lead) =>
        websiteFilter === 'with-website' ? !!lead.website : !lead.website,
      )
      return { ...batch, leads: filtered, lead_count: filtered.length }
    })
    .filter((batch) => batch.leads.length > 0)

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Lists</h1>
          <p className="text-muted-foreground">
            Discovery-only Google Places results saved for cold calling.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pool toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              onClick={() => navigate({ pool: 'website' })}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedPool === 'website'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              Website Leads
            </button>
            <button
              onClick={() => navigate({ pool: 'automation' })}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedPool === 'automation'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              AI Automation Leads
            </button>
          </div>

          {/* Website filter — hidden in month view (no per-lead rows loaded) */}
          {view !== 'month' && (
            <div className="relative">
              <select
                value={websiteFilter}
                onChange={(e) => setWebsiteFilter(e.target.value as WebsiteFilter)}
                className="appearance-none rounded-lg border bg-white pl-8 pr-8 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900 dark:border-zinc-700 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Leads</option>
                <option value="with-website">With Website</option>
                <option value="without-website">Without Website</option>
              </select>
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* View switcher + range navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => navigate({ view: v.value })}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentPeriod && (
            <button
              onClick={() => navigate({ date: todayStr })}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              Today
            </button>
          )}
          <div className="flex items-center rounded-lg border">
            <button
              onClick={() => stepRange(-1)}
              aria-label={`Previous ${view}`}
              className="p-2 text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-l-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[9.5rem] border-x px-3 py-2 text-center text-sm font-medium tabular-nums">
              {rangeLabel}
            </span>
            <button
              onClick={() => stepRange(1)}
              aria-label={`Next ${view}`}
              className="p-2 text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-r-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Date picker button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              aria-label="Jump to date"
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border bg-white p-2 shadow-lg dark:bg-zinc-900">
                <input
                  type="date"
                  defaultValue={selectedDate}
                  onChange={(e) => e.target.value && navigate({ date: e.target.value })}
                  className="rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View body */}
      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        {view === 'month' ? (
          <MonthView
            dateObj={dateObj}
            todayStr={todayStr}
            daySummaries={daySummaries}
            onSelectDay={(date) => navigate({ view: 'day', date })}
          />
        ) : (
          <>
            {view === 'week' && (
              <WeekStrip
                dateObj={dateObj}
                todayStr={todayStr}
                batches={batches}
                onSelectDay={(date) => navigate({ view: 'day', date })}
              />
            )}
            <BatchListView
              view={view}
              batches={batches}
              filteredBatches={filteredBatches}
              onSelectLead={setSelectedLead}
              onDownloadCSV={handleDownloadCSV}
              generatedLeadIds={generatedLeadIds}
              selectedPool={selectedPool}
            />
          </>
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

function BatchListView({
  view,
  batches,
  filteredBatches,
  onSelectLead,
  onDownloadCSV,
  generatedLeadIds,
  selectedPool,
}: {
  view: LeadsView
  batches: LeadBatch[]
  filteredBatches: LeadBatch[]
  onSelectLead: (lead: LeadRow) => void
  onDownloadCSV: (batch: LeadBatch) => void
  generatedLeadIds: Set<string>
  selectedPool: 'website' | 'automation'
}) {
  const periodNoun = view === 'week' ? 'week' : 'date'

  if (filteredBatches.length === 0 && batches.length > 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <Filter className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p>No leads match this filter.</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Try changing the website filter.
        </p>
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <FileSearch className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p>No leads found for this {periodNoun}.</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Use the Discovery Engine to fetch leads with &quot;Get List&quot;.
        </p>
      </div>
    )
  }

  if (view === 'day') {
    return (
      <div className="space-y-6">
        {filteredBatches.map((batch) => (
          <BatchCard
            key={batch.batch_id}
            batch={batch}
            onSelectLead={onSelectLead}
            onDownloadCSV={onDownloadCSV}
            generatedLeadIds={generatedLeadIds}
            selectedPool={selectedPool}
          />
        ))}
      </div>
    )
  }

  // Week view: group batches under day headings, newest day first
  const dayGroups = new Map<string, LeadBatch[]>()
  for (const batch of filteredBatches) {
    const day = format(parseISO(batch.created_at), 'yyyy-MM-dd')
    const group = dayGroups.get(day) || []
    group.push(batch)
    dayGroups.set(day, group)
  }
  const sortedDays = Array.from(dayGroups.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-8">
      {sortedDays.map((day) => {
        const dayBatches = dayGroups.get(day)!
        const leadTotal = dayBatches.reduce((sum, b) => sum + b.lead_count, 0)
        return (
          <div key={day} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">
                {format(parseISO(day), 'EEEE, d MMM')}
              </h2>
              <span className="text-xs text-muted-foreground">
                {dayBatches.length} batch{dayBatches.length !== 1 ? 'es' : ''} ·{' '}
                {leadTotal} lead{leadTotal !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {dayBatches.map((batch) => (
                <BatchCard
                  key={batch.batch_id}
                  batch={batch}
                  onSelectLead={onSelectLead}
                  onDownloadCSV={onDownloadCSV}
                  generatedLeadIds={generatedLeadIds}
                  selectedPool={selectedPool}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeekStrip({
  dateObj,
  todayStr,
  batches,
  onSelectDay,
}: {
  dateObj: Date
  todayStr: string
  batches: LeadBatch[]
  onSelectDay: (date: string) => void
}) {
  // Unfiltered per-day lead counts for the strip
  const countsByDay = new Map<string, number>()
  for (const batch of batches) {
    const day = format(parseISO(batch.created_at), 'yyyy-MM-dd')
    countsByDay.set(day, (countsByDay.get(day) || 0) + batch.lead_count)
  }

  const days = eachDayOfInterval({
    start: startOfWeek(dateObj, { weekStartsOn: 1 }),
    end: endOfWeek(dateObj, { weekStartsOn: 1 }),
  })

  return (
    <div className="mb-6 grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const count = countsByDay.get(dayStr) || 0
        const isToday = dayStr === todayStr
        return (
          <button
            key={dayStr}
            onClick={() => onSelectDay(dayStr)}
            className={cn(
              'rounded-lg border p-2 text-center transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              isToday && 'border-primary ring-1 ring-primary',
              count === 0 && 'opacity-50',
            )}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {format(day, 'EEE')}
            </div>
            <div className="text-sm font-semibold">{format(day, 'd')}</div>
            <div
              className={cn(
                'mt-0.5 text-xs',
                count > 0 ? 'font-medium text-primary' : 'text-zinc-400 dark:text-zinc-600',
              )}
            >
              {count > 0 ? `${count} lead${count !== 1 ? 's' : ''}` : '—'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MonthView({
  dateObj,
  todayStr,
  daySummaries,
  onSelectDay,
}: {
  dateObj: Date
  todayStr: string
  daySummaries: Record<string, DaySummary>
  onSelectDay: (date: string) => void
}) {
  const monthStart = startOfMonth(dateObj)
  const monthEnd = endOfMonth(dateObj)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  // Mon=0 … Sun=6 leading pad so day 1 lands in the right column
  const leadingPad = (getDay(monthStart) + 6) % 7

  const entries = Object.entries(daySummaries)
  const totalLeads = entries.reduce((sum, [, s]) => sum + s.leads, 0)
  const totalBatches = entries.reduce((sum, [, s]) => sum + s.batches, 0)
  const activeDays = entries.length
  const busiest = entries.reduce<[string, DaySummary] | null>(
    (best, entry) => (!best || entry[1].leads > best[1].leads ? entry : best),
    null,
  )

  if (activeDays === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <FileSearch className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p>No leads found for this month.</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Use the Discovery Engine to fetch leads with &quot;Get List&quot;.
        </p>
      </div>
    )
  }

  const stats = [
    { icon: Users, label: 'Total leads', value: totalLeads.toLocaleString() },
    { icon: Layers, label: 'Batches', value: totalBatches.toLocaleString() },
    { icon: CalendarDays, label: 'Active days', value: `${activeDays}` },
    {
      icon: TrendingUp,
      label: 'Busiest day',
      value: busiest ? `${format(parseISO(busiest[0]), 'd MMM')} · ${busiest[1].leads}` : '—',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Totals bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {label}
            </div>
          ))}
          {Array.from({ length: leadingPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const summary = daySummaries[dayStr]
            const isToday = dayStr === todayStr
            return (
              <button
                key={dayStr}
                onClick={() => onSelectDay(dayStr)}
                className={cn(
                  'flex min-h-[4.5rem] flex-col items-start rounded-md border p-1.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                  isToday && 'border-primary ring-1 ring-primary',
                  !summary && 'opacity-50',
                )}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
                {summary && (
                  <span className="mt-auto space-y-0.5">
                    <span className="block rounded bg-primary/10 px-1 py-0.5 text-[11px] font-semibold leading-tight text-primary">
                      {summary.leads} lead{summary.leads !== 1 ? 's' : ''}
                    </span>
                    <span className="block text-[10px] leading-tight text-muted-foreground">
                      {summary.batches} batch{summary.batches !== 1 ? 'es' : ''}
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BatchCard({
  batch,
  onSelectLead,
  onDownloadCSV,
  generatedLeadIds,
  selectedPool,
}: {
  batch: LeadBatch
  onSelectLead: (lead: LeadRow) => void
  onDownloadCSV: (batch: LeadBatch) => void
  generatedLeadIds: Set<string>
  selectedPool: 'website' | 'automation'
}) {
  const batchTime = format(parseISO(batch.created_at), 'HH:mm')
  const gridCols =
    selectedPool === 'automation'
      ? 'grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_0.7fr_0.5fr_1.2fr_1fr]'
      : 'grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr]'

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
      <div className={`grid ${gridCols} gap-2 border-b px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider`}>
        <div>Company Name</div>
        <div>Phone</div>
        <div>Email</div>
        <div>Location</div>
        <div>Website</div>
        {selectedPool === 'automation' && (
          <>
            <div>Score</div>
            <div>Pitch Angle</div>
            <div>Actions</div>
          </>
        )}
      </div>

      {/* Lead rows */}
      {batch.leads.map((lead) => (
        <div
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className={`grid ${gridCols} gap-2 border-b last:border-b-0 px-4 py-2.5 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors`}
        >
          <div className="flex items-center gap-1.5 font-medium truncate">
            {generatedLeadIds.has(lead.id) && (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
            )}
            <span className="truncate">{lead.business_name}</span>
          </div>
          <div className="text-muted-foreground truncate">
            {lead.phone || '—'}
          </div>
          <div className="text-muted-foreground truncate">
            {lead.email || '—'}
          </div>
          <div className="text-muted-foreground truncate">
            {lead.location || lead.address || '—'}
          </div>
          <div className="text-muted-foreground truncate">
            {lead.website ? (
              <span className="text-xs text-green-600 font-medium">Yes</span>
            ) : (
              <span className="text-xs text-zinc-400">No</span>
            )}
          </div>
          {selectedPool === 'automation' && (
            <>
              <div className="font-medium truncate">
                {lead.niche_score ?? '—'}
              </div>
              <div
                className="text-muted-foreground truncate"
                title={lead.pitch_angle ?? ''}
              >
                {lead.pitch_angle ?? '—'}
              </div>
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.phone && (
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${lead.business_name}, ${lead.pitch_angle || "I'd love to chat about your website."}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent(`Quick idea for ${lead.business_name}`)}&body=${encodeURIComponent(lead.pitch_angle || '')}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Email
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </section>
  )
}
