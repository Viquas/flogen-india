const Babel = require('@babel/standalone');
const result = Babel.transform("```tsx\nfunction App() {}\n```", { presets: ['react'] });
console.log(result.code);
