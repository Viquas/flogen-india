import { createClient } from '@/lib/supabase/server'
import { CalendarNav } from '@/components/dashboard/calendar-nav'
import { ProjectGrid } from '@/components/dashboard/project-grid'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { RealtimeProjectsListener } from '@/components/dashboard/realtime-listener'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { SidebarNav } from "@/components/dashboard/sidebar-nav"

// Mock stats removed - fetching real DB counts below

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  // Handle date selection
  // Default to today if no date param
  const today = new Date()
  const selectedDate = params.date || format(today, 'yyyy-MM-dd')

  // Date range for "This Month" stats
  const monthStart = startOfMonth(today).toISOString()
  const monthEnd = endOfDay(today).toISOString()
  const monthEndFull = endOfMonth(today).toISOString()

  // Fetch projects for selected date (Daily View)
  let projects: any[] = []

  // Stats storage
  let stats = {
    totalCreated: 0,
    pendingApprovals: 0,
    approved: 0
  }

  let tableMissing = false
  try {
    // Daily View Range
    const dayStart = startOfDay(parseISO(selectedDate)).toISOString()
    const dayEnd = endOfDay(parseISO(selectedDate)).toISOString()

    const [
      projectsResponse,
      totalCreatedResponse,
      pendingResponse,
      approvedResponse
    ] = await Promise.all([
      // 1. Fetch Projects for the Grid (Selected Date)
      supabase
        .from('projects')
        .select('*')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false }),

      // 2. Total Created (This Month)
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart)
        .lte('created_at', monthEndFull),

      // 3. Pending Approvals (This Month) - Status: 'review'
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'review')
        .gte('created_at', monthStart)
        .lte('created_at', monthEndFull),

      // 4. Approved (This Month) - Status: 'approved' or 'deployed'
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'deployed'])
        .gte('created_at', monthStart)
        .lte('created_at', monthEndFull)
    ])

    if (projectsResponse.error?.code === 'PGRST204' || projectsResponse.error?.code === 'PGRST205' || projectsResponse.error?.message?.includes('schema cache')) {
      tableMissing = true
    } else if (projectsResponse.data) {
      projects = projectsResponse.data
    }

    stats = {
      totalCreated: totalCreatedResponse.count || 0,
      pendingApprovals: pendingResponse.count || 0,
      approved: approvedResponse.count || 0
    }

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
        <div className="w-full bg-zinc-900 rounded-lg p-4 text-left overflow-auto max-h-[300px]">
          <pre className="text-zinc-400 text-xs font-mono">
            {`-- Run this in Supabase SQL Editor
create extension if not exists "uuid-ossp";

create table if not exists batches (
  id uuid default uuid_generate_v4() primary key,
  source text not null default 'open-claw',
  created_at timestamp with time zone default now(),
  status text check (status in ('processing', 'completed', 'failed')) default 'processing',
  metadata jsonb
);

create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  batch_id uuid references batches(id) on delete cascade,
  business_data jsonb not null,
  generated_code text,
  status text check (status in ('queued', 'generating', 'review', 'approved', 'deployed', 'error')) default 'queued',
  version int default 1,
  thumbnail_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table batches enable row level security;
alter table projects enable row level security;
create policy "Allow all access to batches" on batches for all using (true) with check (true);
create policy "Allow all access to projects" on projects for all using (true) with check (true);
`}
          </pre>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          I've run the SQL, Refresh Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-[180px] bg-[#f5f5f5] border-r border-gray-200">
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 pl-3">
            <h1 className="text-sm font-semibold text-gray-800">WebGen v1</h1>
          </div>
          <SidebarNav />
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[180px] flex-1 min-h-screen bg-white">
        <div className="p-8">
          <div className="space-y-8">
            <RealtimeProjectsListener />
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Good morning, Rupam</h2>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search for dates, industries, or client name"
                    className="h-9 w-[300px] rounded-md border border-input bg-transparent pl-9 pr-4 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Calendar Navigation */}
            <div>
              <CalendarNav currentDate={selectedDate} />
            </div>

            {/* Projects Grid */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Projects for {format(parseISO(selectedDate), "MMMM d, yyyy")}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {projects.length} project{projects.length !== 1 ? 's' : ''} found
                </div>
              </div>

              <ProjectGrid projects={projects} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
