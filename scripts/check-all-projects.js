const { createClient } = require('@supabase/supabase-js');
const Babel = require('@babel/standalone');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error("Missing keys"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

// We need the same preprocessing as the frontend
function preprocessCode(code) {
    if (!code) return '';
    let processed = code.replace(/[\u200B-\u200D\uFEFF]/g, '');
    processed = processed.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '');
    processed = processed.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, '');
    processed = processed.replace(/import\s+['"][^'"]+['"];?\s*/gm, '');

    const defaultFnMatch = processed.match(/export\s+default\s+function\s+([a-zA-Z0-9_$]+)/);
    const defaultAnonMatch = processed.match(/export\s+default\s+function\s*\(/);
    const defaultArrowMatch = processed.match(/export\s+default\s+([a-zA-Z0-9_$]+)/);

    if (defaultFnMatch) {
        const fnName = defaultFnMatch[1];
        processed = processed.replace(/export\s+default\s+function\s+[a-zA-Z0-9_$]+/g, `function ${fnName}`);
        if (fnName !== 'GeneratedPage') {
            processed += `\nvar GeneratedPage = ${fnName};`;
        }
    } else if (defaultAnonMatch) {
        processed = processed.replace(/export\s+default\s+function\s*\(/, 'function GeneratedPage(');
    } else if (defaultArrowMatch) {
        const varName = defaultArrowMatch[1];
        if (varName !== 'GeneratedPage') {
            processed = processed.replace(/export\s+default\s+[a-zA-Z0-9_$]+/g, '');
            processed += `\nvar GeneratedPage = ${varName};`;
        } else {
            processed = processed.replace(/export\s+default\s+[a-zA-Z0-9_$]+/g, '');
        }
    } else {
        processed = processed.replace(/export\s+default\s+/g, 'var GeneratedPage = ');
    }

    processed = processed.replace(/export\s+(function|const|class|let|var)\s+/g, '$1 ');
    processed = processed.replace(/export\s+{[^}]*};?\s*/gm, '');
    return processed.trim();
}

function checkCode(code) {
    if (!code) return "No code generated";
    const processedCode = preprocessCode(code);
    const mountCode = `;(function mount(){var target=typeof GeneratedPage!=="undefined"?GeneratedPage:(typeof App!=="undefined"?App:null);if(target){ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(target));}else{throw new Error("No GeneratedPage component found");}})();`;
    const fullCode = processedCode + mountCode;
    try {
        Babel.transform(fullCode, {
            presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
            filename: 'generated.tsx'
        });

        // Also check if it's obviously HTML
        if (code.trim().toLowerCase().startsWith('<!doctype html>') || code.trim().toLowerCase().startsWith('<html')) {
            return "Generated raw HTML instead of a React component";
        }

        return null; // NO ERROR
    } catch (e) {
        return "Build Error: " + e.message;
    }
}

async function run() {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*');
    //.in('status', ['review', 'error']);

    if (error) {
        console.error("Error fetching projects:", error);
        return;
    }

    console.log(`Found ${projects.length} projects.`);

    const failingProjects = [];

    for (const project of projects) {
        if (!project.generated_code) continue;
        const err = checkCode(project.generated_code);
        if (err) {
            console.log(`❌ Project ${project.id} (${project.business_data?.businessName}) failed checking:\n   ${err.split('\n')[0]}`);
            failingProjects.push({ project, error: err });
        } else {
            console.log(`✅ Project ${project.id} (${project.business_data?.businessName}) is valid React.`);
        }
    }

    console.log(`\nFound ${failingProjects.length} projects with errors that need o3-mini fixing.`);

    // Write out the script to actually fix them using Next.js context
    const fs = require('fs');
    fs.writeFileSync('failing_projects.json', JSON.stringify(failingProjects.map(f => ({ id: f.project.id, error: f.error })), null, 2));
}

run();
