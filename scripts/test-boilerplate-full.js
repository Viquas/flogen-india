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

const htmlBoilerplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
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
  </style>
</head>
<body>
  <div id="root"></div>
  <script id="user-code-data" type="application/json">${safeCodeJson}</script>
  <script>
    (function() {
      window.onerror = function(message, source, lineno, colno, error) {
        console.error("Runtime error:", message, error);
        var rootEl = document.getElementById('root');
        if (rootEl && rootEl.innerHTML === '') {
          rootEl.innerHTML = '<div class="error-container"><b>Runtime Error:</b><br/>' + String(message) + '</div>';
        }
      };

      function makeIcon(name) {
        return function IconComponent(props) {
          props = props || {};
          var cn = 'w-5 h-5';
          if (props.className) cn = cn + ' ' + props.className;
          return React.createElement('svg', {
            className: cn, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
            strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-label': name
          }, React.createElement('circle', { cx: '12', cy: '12', r: '10' }));
        };
      }

      var iconList = [ 'AlignLeft','AlignCenter','AlignRight','AlignJustify','AlignHorizontalDistributeCenter','AlignVerticalDistributeCenter' ];
      var reserved = ['Map','Set','Object','Array','Function','Symbol','Number','String','Boolean','Date','Error','Promise','Proxy','Reflect','Image','File','Navigator','Screen','Window','Document','Node','Event','Location','History','Storage','Math','JSON','RegExp','Infinity','NaN','undefined','console','alert','confirm','prompt'];

      iconList.forEach(function(name) {
        if (reserved.indexOf(name) === -1 && typeof window[name] === 'undefined') {
          window[name] = makeIcon(name);
        }
      });

      function runWhenReady() {
        if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
          setTimeout(runWhenReady, 50);
          return;
        }

        window.useState = React.useState;
        window.useEffect = React.useEffect;
        
        try {
          var codeDataEl = document.getElementById('user-code-data');
          var userCode = JSON.parse(codeDataEl.textContent);
          
          var allIdPattern = /\\b([A-Z][a-zA-Z0-9]+)\\b/g;
          var match;
          var foundIcons = [];
          while ((match = allIdPattern.exec(userCode)) !== null) {
            var iconName = match[1];
            if (iconName && typeof window[iconName] === 'undefined' && reserved.indexOf(iconName) === -1) {
              if (foundIcons.indexOf(iconName) === -1) {
                foundIcons.push(iconName);
              }
            }
          }
          console.log("Found missing components:", foundIcons);
          foundIcons.forEach(function(name) {
            if (typeof window[name] === 'undefined') {
              console.log('Auto-creating component:', name);
              window[name] = makeIcon(name);
            }
          });
          
          var mountCode = ';(function mount(){var target=typeof GeneratedPage!=="undefined"?GeneratedPage:(typeof App!=="undefined"?App:null);if(target){ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(target));}else{document.getElementById("root").innerHTML="<div class=\\"error-container\\"><b>Error:</b> No GeneratedPage component found.</div>";}})();';
          var fullCode = userCode + mountCode;
          
          var result = Babel.transform(fullCode, { presets: ['react'] });
          var fn = new Function(result.code);
          fn();
        } catch (err) {
          console.error('Build Error:', err);
          document.getElementById('root').innerHTML = '<div class="error-container"><b>Build Error:</b><br/>' + String(err.message || err) + '</div>';
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runWhenReady);
      } else {
        runWhenReady();
      }
    })();
  </script>
</body>
</html>`;

fs.writeFileSync('public/test-full.html', htmlBoilerplate);
