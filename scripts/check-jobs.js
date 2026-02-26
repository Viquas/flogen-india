require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('queue_jobs').select('status, id, project_id, error_message, updated_at');
  if (error) {
    console.error(error);
  } else {
    const counts = data.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    console.log("Job Status Counts:");
    console.dir(counts);

    const nonPending = data.filter(j => j.status !== 'pending');
    console.log("\nNon-Pending Jobs:");
    console.dir(nonPending, { depth: null });
  }
}
check();
