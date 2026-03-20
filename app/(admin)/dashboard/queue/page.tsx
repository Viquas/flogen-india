import { getQueueStats, getQueueJobs } from './actions'
import { QueueDashboard } from './queue-dashboard'

export const dynamic = 'force-dynamic'

export default async function QueuePage() {
  const [stats, jobs] = await Promise.all([
    getQueueStats(),
    getQueueJobs(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Queue Health</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor generation queue status, detect stuck jobs, and manage failures.
        </p>
      </div>

      <QueueDashboard initialStats={stats} initialJobs={jobs} />
    </div>
  )
}
