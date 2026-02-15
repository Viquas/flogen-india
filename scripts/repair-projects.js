
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function extractJsxFromHtml(html) {
    if (!html.includes('<html')) return html;

    // Try new format: <script id="user-code-data" type="application/json">"jsx code"</script>
    const jsonScriptMatch = html.match(/<script id="user-code-data"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonScriptMatch) {
        try {
            const jsonText = jsonScriptMatch[1].trim();
            // This is usually a JSON-encoded string
            return JSON.parse(jsonText);
        } catch (e) {
            console.log('Failed to parse JSON script');
        }
    }

    // Try old format: <script type="text/babel" data-presets="react"> jsx code </script>
    const babelScriptMatch = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
    if (babelScriptMatch) {
        return babelScriptMatch[1].trim();
    }

    // Try pre tag
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    if (preMatch) {
        return preMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    }

    return html;
}

function extractDataFromCode(code, existingData) {
    // Un-HTML it first
    const jsx = extractJsxFromHtml(code);

    const data = { ...existingData };

    // 1. Extract services
    let servicesFound = false;

    // Format A: const services = [ { title: "..." }, ... ]
    const servicesMatch = jsx.match(/const services = \s*\[([\s\S]*?)\]/);
    if (servicesMatch) {
        const servicesBlock = servicesMatch[1];
        const titleMatches = servicesBlock.match(/title:\s*["'](.*?)["']/g);
        if (titleMatches) {
            data.services = titleMatches.map(m => m.match(/["'](.*?)["']/)[1]);
            servicesFound = true;
        }
    }

    // Format B: Inline array in .map()
    if (!servicesFound) {
        const inlineMatch = jsx.match(/\[\s*\{[\s\S]*?\}\s*\]\s*\.map/);
        if (inlineMatch) {
            const block = inlineMatch[0];
            const titleMatches = block.match(/title:\s*["'](.*?)["']/g);
            if (titleMatches) {
                data.services = titleMatches.map(m => m.match(/["'](.*?)["']/)[1]);
                servicesFound = true;
            }
        }
    }

    // 2. Extract description from <p> tags
    const pMatches = jsx.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
    if (pMatches) {
        const validTexts = pMatches
            .map(p => p.replace(/<[^>]*>/g, '').trim())
            .filter(text => text.length > 25 && text.length < 500 && !text.includes('©') && !text.includes('reserved'));

        if (validTexts.length > 0) {
            data.description = validTexts[0];
        }
    }

    // 3. Extract contact info
    const emailMatch = jsx.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
        data.contactInfo = data.contactInfo || {};
        data.contactInfo.email = emailMatch[0];
    }

    const phoneMatch = jsx.match(/(\+?\d{1,4}[-.\s]?)?\(?\d{2,5}?\)?[-.\s]?\d{2,5}[-.\s]?\d{2,5}[-.\s]?\d{1,9}/);
    if (phoneMatch && phoneMatch[0].length > 8) {
        data.contactInfo = data.contactInfo || {};
        data.contactInfo.phone = phoneMatch[0].trim();
    }

    return data;
}

async function repair() {
    const { data: projects, error } = await supabase.from('projects').select('*');
    if (error) { console.error(error); return; }

    let repairedCount = 0;
    for (const project of projects) {
        const currentData = project.business_data || {};
        const code = project.generated_code || '';
        if (!code) continue;

        const enrichedData = extractDataFromCode(code, currentData);

        // Force update if truncated
        const isTruncated = !currentData.services || currentData.services.length === 0 || currentData.description === 'Migrated from local storage';
        const hasBetterData = enrichedData.services?.length > 0 || (enrichedData.description && enrichedData.description !== 'Migrated from local storage');

        if (isTruncated && hasBetterData) {
            console.log(`Repairing ${project.id} (${enrichedData.businessName}):`);
            console.log(`  New Services: [${enrichedData.services?.join(', ')}]`);

            const { error: updateError } = await supabase
                .from('projects')
                .update({ business_data: enrichedData })
                .eq('id', project.id);

            if (!updateError) repairedCount++;
        }
    }

    console.log(`Done. ${repairedCount} projects repaired.`);
}

repair();
