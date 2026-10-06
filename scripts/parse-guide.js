const fs = require('fs');

async function main() {
  const url = 'https://www.brennholzgigant.de/auswahlhilfe/holzpellets';
  const res = await fetch(url);
  const html = await res.text();

  // Extract all text content inside main or article tags
  // Clean up HTML tags
  const textClean = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[\s\S]*?<\/style>/gi, '');

  fs.writeFileSync('scripts/guide-raw.html', textClean);

  // Search for key headings, accordions, interactive steps or sections
  const headings = [];
  const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let m;
  while ((m = hRegex.exec(textClean)) !== null) {
    const title = m[1].replace(/<[^>]+>/g, '').trim();
    if (title) headings.push(title);
  }

  console.log('Found headings:', headings);
}

main();
