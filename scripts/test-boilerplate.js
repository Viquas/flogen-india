const fs = require('fs');
const code = fs.readFileSync('failed_code.txt', 'utf8');

function preprocessCode(code) {
  // 1. Remove all import statements
  let processed = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, '')
  processed = processed.replace(/import\s+['"][^'"]+['"];?\s*/gm, '')

  // 2. Handle default export
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

  // 3. Remove other export keywords
  processed = processed.replace(/export\s+(function|const|class|let|var)\s+/g, '$1 ')
  processed = processed.replace(/export\s+{[^}]*};?\s*/gm, '')

  processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gm, '')

  return processed.trim()
}

const out = preprocessCode(code);
fs.writeFileSync('processed_output.txt', out);
console.log('first 50 chars:', JSON.stringify(out.substring(0, 50)));
