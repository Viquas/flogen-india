require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateRules() {
    console.log('Fetching rules...');
    const { data, error } = await supabase
        .from('configurations')
        .select('value')
        .eq('key', 'rules.md')
        .single();

    let rules = data?.value || '';

    if (!rules.includes('Lucide') && !rules.includes('Phosphor') && !rules.includes('Feather')) {
        rules += `

## Icons
You MUST use Lucide React icons (\`lucide-react\`), Phosphor icons, or Feather icons.
Do NOT attempt to use arbitrary icons or icons that don't exist in standard libraries.
`;
        const { error: updateError } = await supabase
            .from('configurations')
            .upsert({ key: 'rules.md', value: rules, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (updateError) {
            console.error('Failed to update rules:', updateError);
        } else {
            console.log('Successfully updated rules.md to include icon instructions.');
        }
    } else {
        console.log('Rules already contain icon instructions.');
    }
}

updateRules();
