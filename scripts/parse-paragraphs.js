const fs = require('fs');
const html = fs.readFileSync('scripts/guide-raw.html', 'utf8');

// Strip HTML tags to see the text structure
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
  .filter(l => l.length > 25);

console.log('Total text blocks:', textBlocks.length);
console.log('\n--- FIRST 30 BLOCKS ---');
textBlocks.slice(0, 35).forEach((b, i) => console.log(`${i+1}. ${b}`));
