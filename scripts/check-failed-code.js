require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFailed() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, status, generated_code')
    .ilike('business_data->>businessName', '%Haritha%')
    .order('updated_at', { ascending: false })
    .limit(1);
    
  if (projects && projects.length > 0) {
    const fs = require('fs');
    fs.writeFileSync('failed_code.txt', projects[0].generated_code || 'NULL');
    console.log('Saved to failed_code.txt');
    console.log('First 500 chars:', (projects[0].generated_code || '').substring(0, 500));
  } else {
    console.log('Project not found');
  }
}

checkFailed();
