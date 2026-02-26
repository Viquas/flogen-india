const fs = require('fs');

const code = fs.readFileSync('failed_code.txt', 'utf8');

function preprocessCode(code) {
  let processed = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*/gm, '')
  processed = processed.replace(/import\s+['"][^'"]+['"];?\s*/gm, '')

  const defaultFnMatch = processed.match(/export\s+default\s+function\s+([a-zA-Z0-9_$]+)/);
  if (defaultFnMatch) {
    const fnName = defaultFnMatch[1];
    processed = processed.replace(/export\s+default\s+function\s+[a-zA-Z0-9_$]+/g, `function ${fnName}`);
    if (fnName !== 'GeneratedPage') {
      processed += `\nvar GeneratedPage = ${fnName};`;
    }
  }

  processed = processed.replace(/export\s+(function|const|class|let|var)\s+/g, '$1 ')
  processed = processed.replace(/export\s+{[^}]*};?\s*/gm, '')
  processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gm, '')

  return processed.trim()
}

const safeCodeStr = preprocessCode(code);
const safeCodeJson = JSON.stringify(safeCodeStr).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

// Simulate Browser
const parsedCode = JSON.parse(safeCodeJson.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')); // Wait, in browser JSON.parse handles \u natively.
const userCode = JSON.parse(safeCodeJson);

const allIdPattern = /\b([A-Z][a-zA-Z0-9]+)\b/g;
let match;
const foundIcons = [];
const reserved = ['React', 'ReactDOM', 'Babel']; // simplified

while ((match = allIdPattern.exec(userCode)) !== null) {
  const iconName = match[1];
  if (iconName && reserved.indexOf(iconName) === -1) {
    if (foundIcons.indexOf(iconName) === -1) {
      foundIcons.push(iconName);
    }
  }
}

console.log("Found icons in full code:", foundIcons.filter(x => x.includes('Align')));

