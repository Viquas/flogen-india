export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { LeadsPageClient, type LeadsView, type DaySummary } from '@/components/dashboard/leads-page-client'

interface LeadsPageProps {
  searchParams: Promise<{ date?: string; pool?: string; view?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const today = new Date()
  const selectedDate = params.date || format(today, 'yyyy-MM-dd')
  const selectedDateObj = parseISO(selectedDate)
  const selectedPool = params.pool === 'automation' ? 'automation' : 'website'
  const view: LeadsView =
    params.view === 'week' ? 'week' : params.view === 'month' ? 'month' : 'day'

  const supabase = createAdminClient()

  const rangeStart =
    view === 'month'
      ? startOfMonth(selectedDateObj)
      : view === 'week'
        ? startOfWeek(selectedDateObj, { weekStartsOn: 1 })
        : startOfDay(selectedDateObj)
  const rangeEnd =
    view === 'month'
      ? endOfMonth(selectedDateObj)
      : view === 'week'
        ? endOfWeek(selectedDateObj, { weekStartsOn: 1 })
        : endOfDay(selectedDateObj)

  let batches: Array<{
    batch_id: string
    query: string
    location: string
    lead_count: number
    created_at: string
    leads: Array<{
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
    }>
  }> = []
  let daySummaries: Record<string, DaySummary> = {}

  try {
    if (view === 'month') {
      // Light columns only — a month of raw_data JSON would be a huge payload
      const { data, error } = await supabase
        .from('lead_lists')
        .select('id, batch_id, created_at')
        .eq('pool', selectedPool)
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())

      if (!error && data) {
        const summaryMap = new Map<string, { leads: number; batchIds: Set<string> }>()
        for (const row of data) {
          const day = format(parseISO(row.created_at), 'yyyy-MM-dd')
          const entry = summaryMap.get(day) || { leads: 0, batchIds: new Set<string>() }
          entry.leads += 1
          entry.batchIds.add(row.batch_id)
          summaryMap.set(day, entry)
        }
        daySummaries = Object.fromEntries(
          Array.from(summaryMap.entries()).map(([day, entry]) => [
            day,
            { leads: entry.leads, batches: entry.batchIds.size },
          ]),
        )
      }
    } else {
      const { data, error } = await supabase
        .from('lead_lists')
        .select('*')
        .eq('pool', selectedPool)
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
        .order('created_at', { ascending: false })

      if (!error && data) {
        const batchMap = new Map<string, (typeof batches)[number]>()

        for (const row of data) {
          const lead = {
            id: row.id,
            business_name: row.business_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            location: row.location,
            maps_url: row.maps_url,
            website: row.website as string | null,
            raw_data: row.raw_data as Record<string, unknown> | null,
            niche_score: row.niche_score,
            pitch_angle: row.pitch_angle,
            audit_signals: row.audit_signals as Record<string, unknown> | null,
          }

          const existing = batchMap.get(row.batch_id)
          if (existing) {
            existing.leads.push(lead)
            existing.lead_count = existing.leads.length
            if (row.created_at < existing.created_at) {
              existing.created_at = row.created_at
            }
          } else {
            batchMap.set(row.batch_id, {
              batch_id: row.batch_id,
              query: row.industry || 'Unknown',
              location: row.location || 'Unknown',
              lead_count: 1,
              created_at: row.created_at,
              leads: [lead],
            })
          }
        }

        batches = Array.from(batchMap.values()).map((batch) => ({
          ...batch,
          leads: selectedPool === 'automation'
            ? batch.leads.sort((a, b) => (b.niche_score || 0) - (a.niche_score || 0))
            : batch.leads.sort((a, b) => a.business_name.localeCompare(b.business_name)),
        }))
      }
    }
  } catch (e) {
    console.error('Error fetching lead lists:', e)
  }

  return (
    <LeadsPageClient
      batches={batches}
      daySummaries={daySummaries}
      selectedDate={selectedDate}
      selectedPool={selectedPool}
      view={view}
      todayStr={format(today, 'yyyy-MM-dd')}
    />
  )
}
