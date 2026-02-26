const Babel = require('@babel/standalone');
try {
  Babel.transform("```tsx\nfunction App() {}\n```", { presets: ['react'] });
  console.log("Passed 1");
} catch(e) {
  console.log("Error 1:\n", e.message);
}

try {
  Babel.transform(" \n```tsx\nfunction App() {}\n```", { presets: ['react'] });
  console.log("Passed 2");
} catch(e) {
  console.log("Error 2:\n", e.message);
}
