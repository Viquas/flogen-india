import fs from 'fs'
import path from 'path'

const SAVED_DIR = path.join(process.cwd(), 'saved.html')

export async function saveCodeToDisk(projectId: string, code: string, filename?: string) {
    try {
        if (!fs.existsSync(SAVED_DIR)) {
            fs.mkdirSync(SAVED_DIR, { recursive: true })
        }

        const safeFilename = filename || `${projectId}.html`
        const filePath = path.join(SAVED_DIR, safeFilename)

        // Ensure code is wrapped in basic HTML structure if it's just a component
        const fileContent = wrapCodeInHtml(code)

        fs.writeFileSync(filePath, fileContent)
        console.log(`Saved generated code to ${filePath}`)
        return true
    } catch (error) {
        console.error('Failed to save code to disk:', error)
        return false
    }
}

function wrapCodeInHtml(code: string): string {
    // Basic wrapper to make it viewable/debuggable
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        // Note: This is a raw React component dump. 
        // For full preview, use the dashboard.
        console.log("Generated Code:", ${JSON.stringify(code)});
    </script>
    <pre class="p-4 bg-gray-100 overflow-auto h-screen font-mono text-xs">
${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </pre>
</body>
</html>`
}
