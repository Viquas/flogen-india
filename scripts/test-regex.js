
const fs = require('fs');
const code = fs.readFileSync('saved_html/ventures-1770637745121.html', 'utf8');

function test(code) {
    console.log('Testing Format A...');
    const servicesMatch = code.match(/const services = \s*\[([\s\S]*?)\]/);
    console.log('Format A Match:', !!servicesMatch);

    console.log('Testing Format B...');
    const inlineMatch = code.match(/\[\s*\{[\s\S]*?\}\s*\]\s*\.map/);
    console.log('Format B Match:', !!inlineMatch);
    if (inlineMatch) {
        console.log('Block:', inlineMatch[0].substring(0, 100));
        const titleMatches = inlineMatch[0].match(/title:\s*["'](.*?)["']/g);
        console.log('Titles found:', titleMatches);
    }
}

test(code);
