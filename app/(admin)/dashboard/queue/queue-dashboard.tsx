'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, RefreshCw, XCircle, ChevronDown, ChevronRight, Clock, CheckCircle2, Loader2, AlertCircle, Inbox } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { retryJob, cancelJob } from './actions'
import type { QueueStats, QueueJobDetail } from './types'

// --- Status Card ---

function StatusCard({
  title,
  count,
  icon,
  variant,
  subtitle,
}: {
  title: string
  count: number
  icon: React.ReactNode
  variant: 'default' | 'warning' | 'destructive' | 'success'
  subtitle?: string
}) {
  const bgMap = {
    default: '',
    warning: count > 0 ? 'border-amber-300 dark:border-amber-700' : '',
    destructive: count > 0 ? 'border-red-300 dark:border-red-700' : '',
    success: '',
  }

  return (
    <Card className={bgMap[variant]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// --- Job Row ---

function JobRow({ job, onRetry, onCancel }: {
  job: QueueJobDetail
  onRetry: (id: string) => void
  onCancel: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const statusBadgeVariant = (status: string, isStuck: boolean) => {
    if (isStuck) return 'outline' as const
    switch (status) {
      case 'pending': return 'secondary' as const
      case 'processing': return 'default' as const
      case 'completed': return 'outline' as const
      case 'failed': return 'destructive' as const
      default: return 'secondary' as const
    }
  }

  const canRetry = job.status === 'failed' || job.is_stuck
  const canCancel = job.status === 'pending' || job.status === 'processing'

  const duration = (() => {
    if (!job.started_at) return null
    const start = new Date(job.started_at)
    const end = job.completed_at ? new Date(job.completed_at) : new Date()
    const diffMs = end.getTime() - start.getTime()
    if (diffMs < 1000) return '<1s'
    if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`
    return `${Math.round(diffMs / 60000)}m`
  })()

  return (
    <div className="border-b last:border-b-0">
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
          job.is_stuck ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-5 text-muted-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </div>

        <div className="w-28 shrink-0">
          <Badge variant={statusBadgeVariant(job.status, job.is_stuck)}>
            {job.is_stuck ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Stuck
              </span>
            ) : (
              job.status
            )}
          </Badge>
        </div>

        <div className="flex-1 min-w-0 font-mono text-sm text-muted-foreground truncate">
          {job.project_id ? job.project_id.substring(0, 8) + '...' : 'N/A'}
        </div>

        <div className="w-16 text-center text-sm text-muted-foreground">
          {job.attempts}
        </div>

        <div className="w-28 text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </div>

        <div className="w-16 text-sm text-muted-foreground text-center">
          {duration ?? '-'}
        </div>

        <div className="w-44 text-sm text-muted-foreground truncate">
          {job.error_message ? job.error_message.substring(0, 40) + (job.error_message.length > 40 ? '...' : '') : '-'}
        </div>

        <div className="w-36 flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          {canRetry && (
            <Button
              variant="outline"
              size="xs"
              disabled={isPending}
              onClick={() => startTransition(() => onRetry(job.id))}
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              Retry
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="xs"
              disabled={isPending}
              onClick={() => startTransition(() => onCancel(job.id))}
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3" />}
              Cancel
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 pl-12 bg-muted/30 border-t text-sm space-y-2">
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <span className="text-muted-foreground">Job ID:</span>
              <span className="ml-2 font-mono text-xs">{job.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Project ID:</span>
              <span className="ml-2 font-mono text-xs">{job.project_id ?? 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2">{job.status}{job.is_stuck ? ' (stuck)' : ''}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Attempts:</span>
              <span className="ml-2">{job.attempts}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">{new Date(job.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <span className="ml-2">{new Date(job.updated_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Started:</span>
              <span className="ml-2">{job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Completed:</span>
              <span className="ml-2">{job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Not completed'}</span>
            </div>
            {job.model_id && (
              <div>
                <span className="text-muted-foreground">Model:</span>
                <span className="ml-2">{job.model_id}</span>
              </div>
            )}
            {duration && (
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2">{duration}</span>
              </div>
            )}
          </div>
          {job.error_message && (
            <div className="mt-3">
              <span className="text-muted-foreground">Error:</span>
              <pre className="mt-1 p-3 rounded-md bg-destructive/10 text-destructive text-xs whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {job.error_message}
              </pre>
            </div>
          )}
          {job.rules && (
            <div className="mt-2">
              <span className="text-muted-foreground">Rules:</span>
              <pre className="mt-1 p-3 rounded-md bg-muted text-xs whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {job.rules}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Dashboard ---

export function QueueDashboard({
  initialStats,
  initialJobs,
}: {
  initialStats: QueueStats
  initialJobs: QueueJobDetail[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const stats = initialStats
  const jobs = initialJobs

  const filteredJobs = activeTab === 'all'
    ? jobs
    : activeTab === 'stuck'
      ? jobs.filter(j => j.is_stuck)
      : jobs.filter(j => j.status === activeTab)

  async function handleRetry(jobId: string) {
    const result = await retryJob(jobId)
    if (result.success) {
      router.refresh()
    }
  }

  async function handleCancel(jobId: string) {
    const result = await cancelJob(jobId)
    if (result.success) {
      router.refresh()
    }
  }

  return (
    <>
      {/* Status Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Pending"
          count={stats.pending}
          icon={<Inbox className="size-4 text-muted-foreground" />}
          variant="default"
          subtitle="Waiting in queue"
        />
        <StatusCard
          title="Processing"
          count={stats.processing}
          icon={<Loader2 className="size-4 text-blue-500" />}
          variant={stats.stuck > 0 ? 'warning' : 'default'}
          subtitle={stats.stuck > 0 ? `${stats.stuck} stuck (>10 min)` : 'Currently running'}
        />
        <StatusCard
          title="Completed"
          count={stats.completed}
          icon={<CheckCircle2 className="size-4 text-green-500" />}
          variant="success"
          subtitle="Successfully generated"
        />
        <StatusCard
          title="Failed"
          count={stats.failed}
          icon={<AlertCircle className="size-4 text-red-500" />}
          variant={stats.failed > 0 ? 'destructive' : 'default'}
          subtitle={stats.failed > 0 ? 'Need attention' : 'No failures'}
        />
      </div>

      {/* Stuck Jobs Alert */}
      {stats.stuck > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
          <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {stats.stuck} job{stats.stuck !== 1 ? 's' : ''} stuck (processing &gt; 10 min)
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              These jobs may have crashed or timed out. Use Retry to reset them or Cancel to mark as failed.
            </p>
          </div>
        </div>
      )}

      {/* Job Table with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">
              All ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing ({stats.processing})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({stats.failed})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
            {stats.stuck > 0 && (
              <TabsTrigger value="stuck">
                Stuck ({stats.stuck})
              </TabsTrigger>
            )}
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>

        {/* We use a single TabsContent for all since we filter client-side */}
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <div className="rounded-lg border-0">
              {/* Table Header */}
              <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="w-5" />
                <div className="w-28">Status</div>
                <div className="flex-1 min-w-0">Project</div>
                <div className="w-16 text-center">Tries</div>
                <div className="w-28">Created</div>
                <div className="w-16 text-center">Duration</div>
                <div className="w-44">Error</div>
                <div className="w-36 text-right">Actions</div>
              </div>

              {/* Job Rows */}
              {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Inbox className="size-8 mb-2" />
                  <p className="text-sm">No jobs found for this filter</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onRetry={handleRetry}
                    onCancel={handleCancel}
                  />
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
