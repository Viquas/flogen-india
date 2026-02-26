const Babel = require('@babel/standalone');
try {
  Babel.transform("\uFEFFfunction app() {}", { presets: ['react'] });
} catch(e) { console.log(e.message); }
