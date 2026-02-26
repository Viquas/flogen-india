require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNames() {  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, status, business_data')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log(`Projects error:`, error);
  projects.forEach(p => console.log(p.status, p.business_data?.businessName));
}

checkNames();
