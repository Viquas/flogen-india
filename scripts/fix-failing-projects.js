const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const failing = require('../failing_projects.json');

async function fixProject(projId, buildError) {
    const { data: project } = await supabase.from('projects').select('*').eq('id', projId).single();
    if (!project) return;

    console.log(`\n⏳ Fixing ${project.business_data?.businessName} (${projId})...`);
    console.log(`   Error: ${buildError.split('\n')[0]}`);

    let prompt = `The React code generated previously failed to compile or run. The runtime or build error is:\n\n${buildError}\n\nPlease fix the code. If the previous code was generating raw HTML pages, discard it entirely and write a fresh React functional component. MUST RETURN ONLY REACT JSX CODE.`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for o3-mini

        const res = await fetch('http://localhost:3000/api/generate/revision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                currentCode: project.generated_code,
                currentJson: project.business_data,
                rules: "Only return a default exported React functional component. Do NOT output a raw HTML wrapper. Use Tailwind CSS.",
                model: 'o3-mini'
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const text = await res.text();
            console.error(`❌ Server error (${res.status}): ${text.substring(0, 100)}...`);
            return;
        }

        const json = await res.json();

        if (json.success && json.code) {
            console.log(`   Fixed code received. Saving...`);

            // Snapshot old
            await supabase.from('project_revisions').insert({
                project_id: projId,
                business_data: project.business_data,
                generated_code: project.generated_code,
                version: project.version || 1
            });

            // Update new
            await supabase.from('projects').update({
                generated_code: json.code,
                version: (project.version || 1) + 1,
                updated_at: new Date().toISOString()
            }).eq('id', projId);

            console.log(`✅ Successfully fixed ${projId}`);
        } else {
            console.error(`❌ Failed to fix ${projId}:`, json.error || 'No code returned');
        }
    } catch (e) {
        console.error(`❌ Fetch error on ${projId}:`, e.message);
    }
}

async function run() {
    console.log(`Starting to fix ${failing.length} projects...`);
    for (const item of failing) {
        await fixProject(item.id, item.error);
    }
    console.log("\nComplete! All projects processed.");
}

run();
