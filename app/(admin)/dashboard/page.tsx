import { CalendarNav } from '@/components/dashboard/calendar-nav'
import { ProjectGrid } from '@/components/dashboard/project-grid'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { RealtimeProjectsListener } from '@/components/dashboard/realtime-listener'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { DiscoverySearch } from '@/components/dashboard/discovery-search'
import { getMonthActivityCounts, getCostStats } from '@/app/(admin)/dashboard/actions'
import { QuickDateChips } from '@/components/dashboard/quick-date-chips'

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const today = new Date()
  // Use the date from searchParams if available, otherwise default to today
  const selectedDate = params.date ? params.date : format(today, 'yyyy-MM-dd')

  // The month we need to show initially — matches the selected date's month so
  // the calendar opens on the right page when the user bookmarks a past date.
  const selectedDateObj = parseISO(selectedDate)
  const initialMonth = startOfMonth(selectedDateObj)

  const monthStart = startOfMonth(today).toISOString()
  const monthEndFull = endOfMonth(today).toISOString()

  let projects: any[] = []
  let batchesMap: Record<string, { id: string; metadata: any; source: string; created_at: string }> = {}
  let activityCounts: Record<string, number> = {}

  let stats = {
    totalCreated: 0,
    pendingApprovals: 0,
    approved: 0
  }

  let costStats: { monthlySpendUsd: number; monthlyGenerations: number } | undefined
  let tableMissing = false
  try {
    const dayStart = startOfDay(selectedDateObj).toISOString()
    const dayEnd = endOfDay(selectedDateObj).toISOString()

    const [
      projectsResponse,
      totalCreatedResponse,
      pendingResponse,
      approvedResponse,
      activityCountsResult,
      costStatsResult,
    ] = await Promise.all([
      supabase
        .from('projects')
        .select('*, batches(id, metadata, source, created_at)')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false }),

      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart)
        .lte('created_at', monthEndFull),

      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'review')
        .gte('created_at', monthStart)
        .lte('created_at', monthEndFull),

      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'deployed'])
        .gte('created_at', monthStart)
        .lte('created_at', monthEndFull),

      // Per-day counts for the calendar's initial month view
      getMonthActivityCounts(initialMonth.getFullYear(), initialMonth.getMonth() + 1),

      // Monthly cost stats for the spend card
      getCostStats(),
    ])

    if (projectsResponse.error?.code === 'PGRST204' || projectsResponse.error?.code === 'PGRST205' || projectsResponse.error?.message?.includes('schema cache')) {
      tableMissing = true
    } else if (projectsResponse.data) {
      projects = projectsResponse.data
      // Extract unique batches from the joined data
      for (const p of projects) {
        if (p.batches && p.batch_id && !batchesMap[p.batch_id]) {
          batchesMap[p.batch_id] = p.batches
        }
      }
    }

    stats = {
      totalCreated: totalCreatedResponse.count || 0,
      pendingApprovals: pendingResponse.count || 0,
      approved: approvedResponse.count || 0
    }

    activityCounts = activityCountsResult
    costStats = costStatsResult

  } catch (e) {
    console.error("Error fetching projects:", e)
  }

  if (tableMissing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-2xl mx-auto">
        <div className="p-3 bg-amber-50 rounded-full">
          <Search className="h-10 w-10 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Database Setup Required</h2>
          <p className="text-muted-foreground">
            The <code>projects</code> and <code>batches</code> tables were not found in your Supabase database.
            Please run the setup SQL in the Supabase SQL Editor to enable the dashboard.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          I&apos;ve run the SQL, Refresh Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <RealtimeProjectsListener />

      <div className="mb-8">
        <DiscoverySearch />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{getGreeting()}</h2>
        </div>
      </div>

      <StatsCards stats={stats} costStats={costStats} />

      <div className="space-y-3">
        {/* Quick-access date chips */}
        <QuickDateChips
          todayString={format(today, 'yyyy-MM-dd')}
          yesterdayString={format(subDays(today, 1), 'yyyy-MM-dd')}
          selectedDate={selectedDate}
        />

        {/* Month grid calendar */}
        <CalendarNav
          currentDate={selectedDate}
          initialCounts={activityCounts}
          initialMonth={initialMonth}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Projects for {format(parseISO(selectedDate), "MMMM d, yyyy")}
          </h3>
          <div className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </div>
        </div>

        <ProjectGrid projects={projects} batchesMap={batchesMap} />
      </div>
    </div>
  )
}
