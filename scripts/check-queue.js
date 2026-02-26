require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQueue() {
  const { data: queueJobs, error } = await supabase
    .from('queue_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('Queue jobs error:', error);
  console.log('Queue jobs:', queueJobs);
  
  const { data: projects, error2 } = await supabase
    .from('projects')
    .select('id, status, generation_phase')
    .eq('status', 'queued');
    
  console.log(`Projects error:`, error2);
  console.log(`There are ${projects?.length || 0} queued projects in DB. Data:`, projects);
}

checkQueue();
