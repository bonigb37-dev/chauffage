const assert = require('node:assert/strict');
const base = process.argv[2];
if (!base) throw Error('Usage: node scripts/verify-search-indexability.cjs https://www.brennholz-direk.de');
const canonicalBase = 'https://www.brennholz-direk.de';
async function get(path) {
  const response = await fetch(base + path, { redirect: 'manual', headers: { 'User-Agent': 'Googlebot' }, signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  assert.equal(response.status, 200, path);
  assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), path + ' response header');
  return text;
}
async function run() {
  const robots = await get('/robots.txt');
  assert(robots.includes('Allow: /'));
  assert(!/Disallow:\s*\/(?:\s|$)/m.test(robots));
  assert(robots.includes('Sitemap: ' + canonicalBase + '/sitemap.xml'));
  const sitemap = await get('/sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert(urls.length > 70);
  assert.equal(new Set(urls).size, urls.length);
  assert(!urls.some(url => /\/de\/(?:konto|warenkorb|kasse|admin|super-admin)(?:\/|$)/.test(url)));
  const home = await get('/de');
  assert(/<title>Brennholz-direk\s*\|/.test(home));
  assert(home.includes('Bei Brennholz-direk finden Sie'));
  const structured = [...home.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => {
    const data = JSON.parse(m[1]); return data['@graph'] || [data];
  });
  const website = structured.find(node => node['@type'] === 'WebSite');
  const org = structured.find(node => node['@type'] === 'Organization');
  assert.equal(website?.name, 'Brennholz-direk');
  assert.equal(website?.url, canonicalBase + '/');
  assert.equal(website?.publisher['@id'], org?.['@id']);
  assert.equal(org?.name, website.name);
  let next = 0, checked = 0;
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      assert(url.startsWith(canonicalBase + '/de'));
      const html = await get(new URL(url).pathname);
      assert(!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html), url);
      assert.equal(html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1], url);
      assert.equal((html.match(/<h1\b/g) || []).length, 1, url + ' H1');
      checked++;
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));
  console.log('PASS search indexability: ' + checked + ' sitemap pages accessible with canonical URLs, no noindex, one H1, robots permission and home-page WebSite/Organization identity. This does not confirm Google indexing.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
