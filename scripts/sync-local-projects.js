
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Since we can't easily import from @/lib in a plain node script without setup, 
// we'll re-implement the admin client logic here or just use env vars directly.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL is set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SAVED_DIR = path.join(process.cwd(), 'saved_html');

async function sync() {
    console.log('Starting sync from', SAVED_DIR);

    if (!fs.existsSync(SAVED_DIR)) {
        console.log('No saved_html directory found.');
        return;
    }

    const files = fs.readdirSync(SAVED_DIR).filter(f => f.endsWith('.html'));
    console.log(`Found ${files.length} files to sync.`);

    // 1. Ensure we have a batch for the sync
    const { data: batch, error: batchError } = await supabase
        .from('batches')
        .insert({
            source: 'migration',
            status: 'completed',
            metadata: { label: 'Local Files Migration' }
        })
        .select()
        .single();

    if (batchError) {
        console.error('Failed to create migration batch:', batchError);
        return;
    }

    for (const file of files) {
        console.log(`Syncing ${file}...`);
        const filePath = path.join(SAVED_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract the actual JSX from the HTML boilerplate if it exists
        function extractJsx(html) {
            // New format: id="user-code-data"
            const jsonScriptMatch = html.match(/<script id="user-code-data"[^>]*>([\s\S]*?)<\/script>/);
            if (jsonScriptMatch) {
                try { return JSON.parse(jsonScriptMatch[1].trim()); } catch (e) { }
            }
            // Old format: type="text/babel"
            const babelScriptMatch = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
            if (babelScriptMatch) return babelScriptMatch[1].trim();
            // Pre tag
            const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
            if (preMatch) return preMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
            return html;
        }

        const code = extractJsx(content);

        // Try to extract project name from filename
        const namePart = file.split('-').slice(0, -1).join(' ');
        const name = namePart.charAt(0).toUpperCase() + namePart.slice(1) || 'Migrated Project';

        // Extract timestamp if possible
        const timePart = file.split('-').pop().replace('.html', '');
        const createdAt = !isNaN(timePart) ? new Date(parseInt(timePart)).toISOString() : new Date().toISOString();

        // --- ENHANCED METADATA EXTRACTION ---
        const businessData = {
            businessName: name,
            industry: 'Migrated',
            description: 'Migrated from local storage'
        };

        // 1. Extract services
        const servicesMatch = code.match(/const services = \s*\[([\s\S]*?)\]/);
        if (servicesMatch) {
            const servicesBlock = servicesMatch[1];
            const titleMatches = servicesBlock.match(/title:\s*["'](.*?)["']/g);
            if (titleMatches) {
                businessData.services = titleMatches.map(m => m.match(/["'](.*?)["']/)[1]);
            }
        }

        // 2. Extract description (from hero paragraph)
        const pMatches = code.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
        if (pMatches) {
            const descriptions = pMatches
                .map(p => p.replace(/<[^>]*>/g, '').trim())
                .filter(text => text.length > 30 && text.length < 300);
            if (descriptions.length > 0) {
                businessData.description = descriptions[0];
            }
        }

        // 3. Extract contact info
        const emailMatch = code.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = code.match(/\+?\d{1,4}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);
        if (emailMatch || phoneMatch) {
            businessData.contactInfo = {};
            if (emailMatch) businessData.contactInfo.email = emailMatch[0];
            if (phoneMatch) businessData.contactInfo.phone = phoneMatch[0];
        }
        // ------------------------------------

        const { error } = await supabase
            .from('projects')
            .insert({
                batch_id: batch.id,
                business_data: businessData,
                generated_code: code,
                status: 'approved',
                created_at: createdAt,
                updated_at: createdAt
            });

        if (error) {
            console.error(`Failed to sync ${file}:`, error.message);
        } else {
            console.log(`Successfully synced ${file}`);
        }
    }

    console.log('Sync complete.');
}

sync();
