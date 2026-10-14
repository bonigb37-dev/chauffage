// Inventory visible JSX copy, including placeholders and accessibility labels.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const dictionaries = ['de'].map(locale => require('../translations/' + locale + '.json'));
const missing = new Map();
function add(value, file) {
  const source = value.replaceAll('&apos;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&').replace(/\s+/g, ' ').trim();
  if (!source || !/[\p{L}]/u.test(source) || dictionaries.every(dictionary => Object.hasOwn(dictionary, source))) return;
  const files = missing.get(source) || new Set(); files.add(file); missing.set(source, files);
}
function scan(folder) {
  for (const entry of fs.readdirSync(folder, {withFileTypes: true})) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'api') scan(file); continue; }
    if (!file.endsWith('.tsx')) continue;
    const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isJsxText(node)) add(node.text, file);
      if (ts.isJsxAttribute(node) && ['title','description','label','placeholder','alt','aria-label','data-label'].includes(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) add(node.initializer.text, file);
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
}
scan('components'); scan('app');
if (process.argv.includes('--check')) {
  // Proper names, standards, legal references and technical units stay unchanged.
  const unchanged = new Set(['Bren','nholz','Bren-nholz — Leylines Park','In den Warenkorb','km','Max','Müller','Geoapify','© OpenStreetMap','UUID','Bren-nholz','Language / Sprache / Langue','⌘K','ENplus A1','DINplus','ENplus A1 & DINplus','KB)','e','§ 355 BGB','§ 356a BGB','§ 357 BGB']);
  for (const key of unchanged) missing.delete(key);
  if (missing.size) process.exitCode = 1;
}
console.log(JSON.stringify([...missing].map(([text, files]) => ({text, files:[...files]})), null, 2));
