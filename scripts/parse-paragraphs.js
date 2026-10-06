const fs = require('fs');
const html = fs.readFileSync('scripts/guide-raw.html', 'utf8');
const textBlocks = html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n\n')
  .replace(/<\/h[1-6]>/gi, '\n\n')
  .replace(/<\/li>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 20);

fs.writeFileSync('scripts/guide-extracted.txt', textBlocks.join('\n\n'));
console.log('Saved extracted guide text to scripts/guide-extracted.txt');
