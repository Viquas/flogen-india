require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function requeue() {  
  // Find all projects that say "queued" but don't actually have a pending queue_job
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, status')
    .eq('status', 'queued')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Projects Error:', error);
    return;
  }
  
  console.log(`Found ${projects.length} stuck projects.`);
  
  if (projects.length > 0) {
    const jobs = projects.map(p => ({
        project_id: p.id,
        rules: null,
        status: 'pending',
        attempts: 0
    }));
    
    console.log(`Inserting ${jobs.length} jobs into the new queue_jobs table...`);
    const { error: insertError } = await supabase.from('queue_jobs').insert(jobs);
    
    if (insertError) {
        console.error('Insert Error:', insertError);
    } else {
        console.log('Successfully requeued all stuck projects! The background process will start immediately.');
    }
  }
}

requeue();
