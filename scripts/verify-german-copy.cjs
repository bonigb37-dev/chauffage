const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));const m={exports:{}};cache.set(file,m);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;const req=n=>n.startsWith('@/')?load(n.slice(2)+(n.endsWith('.json')?'':fs.existsSync(n.slice(2)+'.tsx')?'.tsx':'.ts')):n.startsWith('./')?load(path.join(path.dirname(file),n)+'.ts'):require(n);vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(req,m,m.exports);return m.exports;}
const {translate}=load('i18n/copy.tsx'),products=load('lib/products.ts').products;
assert.equal(translate('Choisir mes produits','de'),'Produkte auswählen');assert.equal(translate('Régions','de'),'Regionen');assert.equal(translate('Mon panier (3) · 1497,00 €','de'),'Mein Warenkorb (3) · 1497,00 €');assert.equal(translate('Compte client · Jean Client','de'),'Kundenkonto · Jean Client');assert.equal(translate('Compte client · Jean  Client','de'),'Kundenkonto · Jean  Client');assert.equal(translate('En stock · 1 unité disponible','de'),'Auf Lager · 1 Einheit verfügbar');assert.equal(translate('En stock · 3 unités disponibles','de'),'Auf Lager · 3 Einheiten verfügbar');assert.equal(translate('au panier','de'),'im Warenkorb');
for(const p of products){const name=translate(p.name,'de');assert.equal(translate(p.name+' — photo 2','de'),name+' — Foto 2');assert.equal(translate('Ajouter '+p.name+' aux favoris','de'),name+' zu den Favoriten hinzufügen');assert.equal(translate('Retirer '+p.name+' des favoris','de'),name+' aus den Favoriten entfernen');assert.equal(translate('Ajouter '+p.name+' au panier','de'),name+' in den Warenkorb legen');assert.equal(translate('Diminuer la quantité de '+p.name,'de'),'Menge für '+name+' verringern');assert.equal(translate('Augmenter la quantité de '+p.name,'de'),'Menge für '+name+' erhöhen');}
// Audit every displayed catalogue field, including packaging from imported products.
// Palette is German too; French packaging words must never leak into the UI.
const frenchProductWords = /\b(?:sacs?|paquets?|pièces?|boîtes?|bûches?|granulés?|chauffage|allumage|nouveau|produit|palettes|filets?|carton de|env\.)\b|[œç]|stère|rangée|filetée/iu;
const report = products.map(product => {
  const translated = {};
  for (const field of ['name', 'description', 'quantity', 'type', 'section', 'badge']) {
    if (!product[field]) continue;
    translated[field] = translate(product[field], 'de');
    assert(!frenchProductWords.test(translated[field]), `French copy in product ${product.id} ${field}: ${translated[field]}`);
  }
  return { id: product.id, ...translated };
});
for (const category of load('lib/product-categories.ts').productCategories) {
  for (const field of ['title', 'description']) assert(!frenchProductWords.test(translate(category[field], 'de')), `French category ${category.slug} ${field}`);
}
for (const [source, expected] of [
  ['Palette · 96 paquets · 960 kg', 'Palette · 96 Pakete · 960 kg'],
  ['Palette · 66 sacs · 990 kg', 'Palette · 66 Säcke · 990 kg'],
  ['Palette · 65 sacs · 975 kg', 'Palette · 65 Säcke · 975 kg'],
  ['Palette · 48 paquets · 480 kg', 'Palette · 48 Pakete · 480 kg'],
]) assert.equal(translate(source, 'de'), expected);
if (process.argv.includes('--report')) fs.writeFileSync('docs/german-product-copy-checks.json', JSON.stringify({ productCount: products.length, products: report }, null, 2) + '\n');
console.log('PASS German copy: '+products.length+' products audited across names, descriptions, packaging, types, sections and badges; all categories and product-name templates checked.');
