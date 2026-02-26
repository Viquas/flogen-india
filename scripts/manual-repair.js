const { createClient } = require('@supabase/supabase-js');
const { generateText } = require('ai');
const { openai } = require('@ai-sdk/openai');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const model = openai('o3-mini'); // Using o3-mini directly

const failing = [
    "58af7dd1-85d7-4a33-b7b2-1c251ed226f0", // Hans Raj
    "881356dc-5250-42db-8c3d-b8eb8e1676a3", // Mysore Manu
    "bb7069d6-2e26-47ec-9dcc-cd3c464d64c9", // Maurya
    "2e1e8c80-a59d-4789-a120-816f97895429", // Bangalore Dental
    "1ded73bc-67aa-461b-8a57-c5d3e13bdd5f", // SMR SPORTS
    "f6290100-12b7-40d0-83a9-7a0474d64b71"  // ZLASH
];

async function repair(id) {
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
    if (!project) return;

    console.log(`\n🛠️  Repairing ${project.business_data?.businessName} (${id})...`);

    const prompt = `The following code was generated but it is invalid. It looks like it might be raw HTML or has syntax errors. 
    PLEASE REWRITE IT AS A CLEAN REACT JSX COMPONENT. 
    Return ONLY the code. No markdown fences.
    
    BROKEN CODE:
    ${project.generated_code}`;

    try {
        const { text } = await generateText({
            model: model,
            prompt: prompt,
            system: "You are an expert React developer. Convert malformed HTML or broken JSX into a production-ready React component using Tailwind CSS. Use lucide-react for icons. Return ONLY the raw code."
        });

        let code = text.trim();
        if (code.startsWith('```')) {
            code = code.replace(/^\`\`\`(?:tsx|typescript|jsx|javascript)?\n?/, '');
            code = code.replace(/\n?\`\`\`$/, '');
        }

        if (code.length < 100) {
            console.error("❌ Generated code too short, skipping safeguard.");
            return;
        }

        // Snapshot
        await supabase.from('project_revisions').insert({
            project_id: id,
            business_data: project.business_data,
            generated_code: project.generated_code,
            version: project.version || 1
        });

        // Update
        await supabase.from('projects').update({
            generated_code: code,
            version: (project.version || 1) + 1,
            status: 'review',
            updated_at: new Date().toISOString()
        }).eq('id', id);

        console.log(`✅ Fixed ${id}`);
    } catch (e) {
        console.error(`❌ Error repairing ${id}:`, e.message);
    }
}

async function run() {
    for (const id of failing) {
        await repair(id);
    }
    console.log("\nBatch repair finished.");
}

run();
