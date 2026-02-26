const Babel = require('@babel/standalone');
const React = require('react');
const ReactDOM = require('react-dom/client'); // just to simulate

global.window = global;
global.React = React;

var userCode = `
function GeneratedPage() {
  return React.createElement(AlignVerticalSpaceAround);
}
`;

var reserved = ['React', 'ReactDOM', 'Babel'];
var allIdPattern = /\b([A-Z][a-zA-Z0-9]+)\b/g;
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

function makeIcon(name) { return function() { return name; } }

foundIcons.forEach(function(name) {
  if (typeof window[name] === 'undefined') {
    window[name] = makeIcon(name);
    console.log("Created", name);
  }
});

var fullCode = userCode + "; GeneratedPage();";
try {
  var result = Babel.transform(fullCode, { presets: ['react'] });
  var fn = new Function(result.code);
  fn();
  console.log("Success!");
} catch(e) {
  console.log("Error:", e.message);
}
