
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check(id) {
    const { data: project, error } = await supabase
        .from('projects')
        .select('id, generated_code, business_data')
        .eq('id', id)
        .single();

    if (error) { console.error(error); return; }

    console.log('ID:', project.id);
    console.log('Data:', JSON.stringify(project.business_data));
    console.log('Code length:', project.generated_code?.length);
    console.log('Code snippet:', project.generated_code?.substring(0, 500));
}

check(process.argv[2] || '0f642592-f5fb-4690-ba3a-661799cddb38');
