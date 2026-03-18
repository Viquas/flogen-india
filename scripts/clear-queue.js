require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearQueue() {
  console.log('=== Clearing Queue & Old Data ===\n');

  // 1. Cancel all pending queue jobs
  const { data: pending, count: pendingCount } = await supabase
    .from('queue_jobs')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');

  if (pendingCount > 0) {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'failed',
        error_message: 'Cancelled — bulk clear',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'pending');

    console.log(`Cancelled ${pendingCount} pending jobs`, error ? `(error: ${error.message})` : '✓');
  } else {
    console.log('No pending jobs to cancel');
  }

  // 2. Cancel any stuck processing jobs
  const { count: processingCount } = await supabase
    .from('queue_jobs')
    .select('id', { count: 'exact' })
    .eq('status', 'processing');

  if (processingCount > 0) {
    const { error } = await supabase
      .from('queue_jobs')
      .update({
        status: 'failed',
        error_message: 'Cancelled — bulk clear',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'processing');

    console.log(`Cancelled ${processingCount} processing jobs`, error ? `(error: ${error.message})` : '✓');
  } else {
    console.log('No processing jobs to cancel');
  }

  // 3. Delete all completed/failed queue jobs (cleanup)
  const { count: doneCount } = await supabase
    .from('queue_jobs')
    .select('id', { count: 'exact' })
    .in('status', ['completed', 'failed']);

  if (doneCount > 0) {
    const { error } = await supabase
      .from('queue_jobs')
      .delete()
      .in('status', ['completed', 'failed']);

    console.log(`Deleted ${doneCount} completed/failed job records`, error ? `(error: ${error.message})` : '✓');
  }

  // 4. Reset any queued/generating projects back to a clean state
  const { count: queuedProjects } = await supabase
    .from('projects')
    .select('id', { count: 'exact' })
    .in('status', ['queued', 'generating']);

  if (queuedProjects > 0) {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'error', generation_phase: null, updated_at: new Date().toISOString() })
      .in('status', ['queued', 'generating']);

    console.log(`Reset ${queuedProjects} queued/generating projects to error`, error ? `(error: ${error.message})` : '✓');
  }

  // 5. Summary
  const { count: remainingJobs } = await supabase
    .from('queue_jobs')
    .select('id', { count: 'exact' });

  console.log(`\n=== Done. ${remainingJobs || 0} queue_jobs remaining ===`);
}

clearQueue().catch(console.error);
