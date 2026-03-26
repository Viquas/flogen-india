export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { LeadsPageClient } from '@/components/dashboard/leads-page-client'

interface LeadsPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const today = new Date()
  const selectedDate = params.date || format(today, 'yyyy-MM-dd')
  const selectedDateObj = parseISO(selectedDate)

  const supabase = createAdminClient()
  const dayStart = startOfDay(selectedDateObj).toISOString()
  const dayEnd = endOfDay(selectedDateObj).toISOString()

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
    }>
  }> = []

  try {
    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
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
        leads: batch.leads.sort((a, b) =>
          a.business_name.localeCompare(b.business_name)
        ),
      }))
    }
  } catch (e) {
    console.error('Error fetching lead lists:', e)
  }

  return <LeadsPageClient batches={batches} selectedDate={selectedDate} />
}
