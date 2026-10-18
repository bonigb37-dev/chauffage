const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} }; cache.set(file, module);
  const req = name => name.startsWith('@/') ? load(name.slice(2) + (name.endsWith('.json') ? '' : '.ts')) : name.startsWith('./') ? load(path.resolve(path.dirname(file), name) + '.ts') : require(name);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports;
}
const { localizedPath, internalPath } = load('i18n/routing.ts');
const routes = [
  ['/produits', '/de/produkte'],
  ['/produits/categorie/granules-de-bois', '/de/produkte/kategorie/holzpellets'],
  ['/produits/categorie/bois-de-chauffage', '/de/produkte/kategorie/brennholz'],
  ['/produits/categorie/briquettes-de-bois', '/de/produkte/kategorie/holzbriketts'],
  ['/produits/categorie/bois-allumage', '/de/produkte/kategorie/anzuendholz'],
  ['/panier', '/de/warenkorb'], ['/compte', '/de/konto'],
  ['/commande/succes', '/de/kasse/bestaetigung'],
  ['/frais-livraison', '/de/versandkosten'], ['/contact', '/de/kontakt'],
];
const { middleware } = load('middleware.ts');
const { NextRequest } = require('next/server');
for (const [internal, german] of routes) {
  assert.equal(localizedPath(internal, 'de'), german);
  assert.equal(localizedPath(german, 'de'), german, 'idempotent');
  assert.equal(internalPath(german), internal);
  const legacy = middleware(new NextRequest('http://localhost/de' + internal + '?gclid=test'));
  assert.equal(legacy.status, 308);
  assert.equal(new URL(legacy.headers.get('location')).pathname, german);
  assert.equal(new URL(legacy.headers.get('location')).search, '?gclid=test');
  const current = middleware(new NextRequest('http://localhost' + german + '?gclid=test'));
  const rewrite = new URL(current.headers.get('x-middleware-rewrite'));
  assert.equal(rewrite.pathname, internal);
  assert.equal(rewrite.search, '?gclid=test');
}
assert.equal(localizedPath('/api/checkout', 'de'), '/api/checkout');
assert.equal(localizedPath('https://example.com/produits', 'de'), 'https://example.com/produits');
const { products, productPathSegment } = load('lib/products.ts');
const { buildMerchantFeed } = load('lib/merchant-feed.ts');
for (const p of products) {
  const slug = productPathSegment(p);
  assert(slug.startsWith(p.id + '-'));
  assert(!/granules|buches|chauffage|briquettes|paquet/.test(slug), slug);
  if (p.image) assert(buildMerchantFeed([p], 'https://www.brennholz-direk.de').xml.includes('/de/produkte/' + slug));
}
assert.equal(load('lib/analytics.ts').analyticsPath('/de/konto'), null);
assert.equal(load('lib/analytics.ts').analyticsPath('/de/hilfe'), null);
console.log('PASS German URLs: all product slugs, Merchant links, categories, legacy redirects, internal rewrites, query preservation, idempotence and private analytics exclusions.');
async function live(base) {
  if (!base) return;
  for (const route of ['/de/produkte', '/de/produkte/kategorie/holzpellets', '/de/warenkorb', '/de/konto', '/de/kasse', '/de/versandkosten', '/de/pellet-ratgeber']) {
    const response = await fetch(base + route, { redirect: 'manual' });
    assert.equal(response.status, 200, route);
  }
  let url = base + '/de/produits/2-granules-eph-premium-dinplus-enplus-a1-palette?gclid=url-check&utm_source=merchant';
  let reached = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status === 308) {
      const next = new URL(response.headers.get('location'), url);
      assert.equal(next.searchParams.get('gclid'), 'url-check');
      assert.equal(next.searchParams.get('utm_source'), 'merchant');
      url = next.href;
    } else {
      assert.equal(response.status, 200);
      assert.equal(new URL(url).pathname, '/de/produkte/' + productPathSegment(products.find(p => p.id === 2)));
      reached = true; break;
    }
  }
  assert(reached, 'Legacy product reaches canonical page without redirect loop');
  const response = await fetch(base + '/sitemap.xml');
  assert.equal(response.status, 200);
  const sitemap = await response.text();
  assert(!/\/de\/(?:produits|livraison|frais-livraison|contact|avis-juridique|retractation)(?:\/|<)/.test(sitemap));
  console.log('PASS live German catalogue, category, cart, account, checkout, guide, legacy product tracking parameters and sitemap.');
}
live(process.argv[2]).catch(error => { console.error(error); process.exitCode = 1; });
