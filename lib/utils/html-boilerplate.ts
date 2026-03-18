/**
 * Utility to wrap generated React component code into a full, self-contained HTML document
 * with Tailwind CSS, React, and Babel standalone for runtime transpilation.
 */

export function preprocessCode(code: string): string {
  if (!code) return ''

  // 0. Remove BOM and invisible characters that crash Babel
  let processed = code.replace(/[\u200B-\u200D\uFEFF]/g, '')

  // 1. Remove markdown code blocks if present
  processed = processed.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '')

  // 1.5 HTML RELAPSE PROTECTION: Strip full HTML document wrappers if the AI output a raw <html> page
  if (processed.includes('<!DOCTYPE') || processed.includes('<html')) {
    processed = processed.replace(/<!DOCTYPE\s+html>/gi, '')
    processed = processed.replace(/<html[^>]*>/gi, '')
    processed = processed.replace(/<\/html>/gi, '')
    processed = processed.replace(/<head>[\s\S]*?<\/head>/gi, '')
    processed = processed.replace(/<body[^>]*>/gi, '')
    processed = processed.replace(/<\/body>/gi, '')
    processed = processed.replace(/^html\s+/i, '')
  }

  // 2. Remove all import statements (including multi-line ones and namespace imports)
  processed = processed.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, '')
  processed = processed.replace(/import\s+['"][^'"]+['"];?\s*/gm, '')

  // 3. Handle default export to ensure we have a 'GeneratedPage' component to mount
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

  // 4. Remove other export keywords
  processed = processed.replace(/export\s+(function|const|class|let|var)\s+/g, '$1 ')
  processed = processed.replace(/export\s+{[^}]*};?\s*/gm, '')

  return processed.trim()
}

/**
 * Construct the HTML boilerplate for preview rendering.
 *
 * Uses an externalized runtime (public/preview-runtime.js) for shadcn/ui mocks,
 * icon fallbacks, and React bootstrap — reducing inline HTML by ~12KB per render.
 *
 * When used in an iframe (live preview), the runtime is loaded from /preview-runtime.js.
 * When used for export/screenshot, the runtime URL can be overridden.
 */
export function constructHtmlBoilerplate(code: string, options?: { runtimeUrl?: string }): string {
  const processedCode = preprocessCode(code)
  const safeCodeJson = JSON.stringify(processedCode).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  const runtimeUrl = options?.runtimeUrl || '/preview-runtime.js'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin="anonymous"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"><\/script>
  <script src="https://unpkg.com/lucide-react@0.469.0/dist/umd/lucide-react.js" crossorigin="anonymous"><\/script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/fill/style.css" />
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #fff; }
    #root { min-height: 100vh; }
    .error-container {
      padding: 20px;
      background: #fef2f2;
      color: #dc2626;
      font-family: monospace;
      white-space: pre-wrap;
      border: 1px solid #fee2e2;
      margin: 20px;
      border-radius: 8px;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    html { scroll-behavior: smooth; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script id="user-code-data" type="application/json">${safeCodeJson}<\/script>
  <script>
    // Resolve runtime URL — srcdoc iframes can't use relative paths
    (function() {
      var url = '${runtimeUrl}';
      if (url.charAt(0) === '/' && !url.startsWith('//')) {
        try { url = window.parent.location.origin + url; } catch(e) {
          try { url = window.location.origin + url; } catch(e2) {}
        }
      }
      var s = document.createElement('script');
      s.src = url;
      document.body.appendChild(s);
    })();
  <\/script>
</body>
</html>`
}
