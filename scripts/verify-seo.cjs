const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const base = process.argv[2];
async function run() {
  for (const file of ['lib/reviews.ts', 'components/TopTrustBanner.tsx', 'components/AllReviewsModal.tsx']) {
    assert.equal(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), execFileSync('git', ['show', `08d9aee:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n'), `Avis modifiés : ${file}`);
  }
  const guard = fs.readFileSync('components/RoleAccessGuard.tsx', 'utf8');
  assert(guard.includes('if (!requiresSessionCheck && authLinkReady && !destination) return content;'));
  assert(guard.includes('isAdminPage || isSuperAdminPage'));
  if (!base) { console.log('OK : avis préservés, rendu public et protection des pages privées.'); return; }
  async function page(path, status = 200, redirect = 'follow') {
    const response = await fetch(`${base}${path}`, { redirect, signal: AbortSignal.timeout(30000) });
    const html = await response.text();
    assert.equal(response.status, status, `${path}: statut HTTP`);
    return { response, html };
  }
  const paths = ['/', '/produits', '/produits/categorie/bois-de-chauffage', '/produits/categorie/granules-de-bois', '/produits/categorie/briquettes-de-bois', '/produits/categorie/bois-allumage', '/guide-pellets', '/faq', '/services', '/a-propos', '/contact', '/devis', '/avis-juridique', '/agb', '/datenschutz', '/retractation'];
  for (const path of paths) {
    const { html } = await page(path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${path}: un H1 dans le HTML initial`);
    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    assert.equal(canonical?.[1].replace(/\/$/, ''), `https://bois-de-chauffage-de.vercel.app${path}`.replace(/\/$/, ''), `${path}: canonical`);
    assert(!/<meta name="robots" content="[^"]*noindex/.test(html), `${path}: indexabilité`);
    assert(html.includes('<a '), `${path}: liens internes rendus`);
  }
  const { html: sitemap } = await page('/sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert(urls.length > paths.length);
  assert(!urls.some((url) => /\/compte|\/admin|\/commande|\/panier|\/auswahlhilfe/.test(url)));
  const product = urls.find((url) => /\/produits\/2-/.test(url));
  assert(product, 'Produit de contrôle présent dans le sitemap');
  const { html: productHtml } = await page(new URL(product).pathname);
  const structured = [...productHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1])).find((data) => data['@type'] === 'Product');
  assert(structured, 'Product JSON-LD présent dans le HTML initial');
  assert.equal(structured.offers.priceCurrency, 'EUR');
  assert(Number(structured.offers.price) > 0);
  assert(structured.image.every((url) => /^https:\/\//.test(url)));
  assert.equal(structured.url, product);
  assert.equal((productHtml.match(/<h1\b/g) || []).length, 1);
  const { html: robots } = await page('/robots.txt');
  assert(robots.includes('Sitemap: https://bois-de-chauffage-de.vercel.app/sitemap.xml'));
  for (const path of ['/compte', '/panier', '/commande', '/commande/succes', '/admin', '/super-admin']) {
    const { html } = await page(path);
    assert(/<meta name="robots" content="[^"]*noindex/.test(html), `${path}: noindex`);
  }
  const { response: guideRedirect } = await page('/auswahlhilfe/holzpellets', 308, 'manual');
  assert.equal(guideRedirect.headers.get('location'), '/guide-pellets');
  await page('/produits/categorie/inexistante', 404);
  await page('/audit-seo-inexistante', 404);
  console.log(`OK : ${paths.length} pages publiques, 4 catégories, sitemap (${urls.length} URL), robots, canonical, H1, produit JSON-LD, pages privées noindex, redirection 308 et erreurs 404. Avis préservés.`);
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
