const fs = require('fs');
const Babel = require('@babel/standalone');

const code = fs.readFileSync('failed_code.txt', 'utf8');

function preprocessCode(code) {
  let processed = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, '');
  processed = processed.replace(/import\s+['"][^'"]+['"];?\s*/gm, '');
  
  const defaultFnMatch = processed.match(/export\s+default\s+function\s+([a-zA-Z0-9_$]+)/);
  if (defaultFnMatch) {
    const fnName = defaultFnMatch[1];
    processed = processed.replace(/export\s+default\s+function\s+[a-zA-Z0-9_$]+/g, `function ${fnName}`);
    if (fnName !== 'GeneratedPage') {
      processed += `\nvar GeneratedPage = ${fnName};`;
    }
  }
  
  processed = processed.replace(/export\s+(function|const|class|let|var)\s+/g, '$1 ');
  processed = processed.replace(/export\s+{[^}]*};?\s*/gm, '');
  processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gm, '');
  return processed.trim();
}

const safeCodeStr = preprocessCode(code);
const safeCodeJson = JSON.stringify(safeCodeStr).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
const userCode = JSON.parse(safeCodeJson);
const mountCode = ';(function mount(){...})();';
const fullCode = userCode + mountCode;

try {
  Babel.transform(fullCode, { presets: ['react'] });
  console.log('Babel perfectly fine.');
} catch (e) {
  console.log('Babel error: ' + e.message);
}
