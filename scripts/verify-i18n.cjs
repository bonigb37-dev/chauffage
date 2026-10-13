const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const routing = {exports:{}};
vm.runInThisContext('(function(module,exports){'+ts.transpileModule(fs.readFileSync('i18n/routing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText+'})')(routing,routing.exports);
const {detectLocale, localizedPath, locales, isLocale} = routing.exports;
assert.equal(detectLocale(undefined,'fr-FR,fr;q=0.9,en;q=0.8'),'de');
assert.equal(detectLocale(undefined,'en-US,en;q=0.9'),'de');
assert.equal(detectLocale(undefined,'es-ES,en;q=0.8'),'de');
assert.equal(detectLocale('en','de-DE'),'de');
assert.equal(detectLocale(undefined,null),'de');
assert.equal(localizedPath('/fr/produits?search=EPH','de'),'/de/produits?search=EPH');
assert.equal(localizedPath('/api/checkout','de'),'/api/checkout');
assert.equal(localizedPath('https://example.com','de'),'https://example.com');
const base=process.argv[2];
async function run(){
 assert.deepEqual(locales,['de']);assert.equal(isLocale('fr'),false);assert.equal(isLocale('en'),false);assert.equal(localizedPath('/en/produits','en'),'/de/produits');
 if(!base){console.log('PASS locale detection and safe localized routing');return;}
 for(const [headers,expected] of [[{'accept-language':'fr-FR'},'de'],[{'accept-language':'en-US'},'de'],[{'accept-language':'it-IT'},'de'],[{'accept-language':'de',cookie:'bren_locale=en'},'de']]){
  const r=await fetch(base+'/',{headers,redirect:'manual'});assert.equal(r.status,308);assert.equal(new URL(r.headers.get('location'),base).pathname,'/'+expected);
 }
 const paths=['','/produits','/produits/categorie/granules-de-bois','/produits/2-granules-eph-premium-dinplus-enplus-a1-palette','/guide-pellets','/services','/faq','/a-propos','/contact','/avis-juridique','/agb','/datenschutz','/retractation','/compte','/panier','/commande'];
 for(const locale of locales){
  for(const path of paths){
   const r=await fetch(base+'/'+locale+path);assert.equal(r.status,200,locale+path);const html=await r.text();
   assert(html.includes('lang="'+locale+'"'),locale+path+' html lang');
   for(const lang of ['de','x-default']) assert(html.includes('hrefLang="'+lang+'"')||html.includes('hreflang="'+lang+'"'),locale+path+' hreflang '+lang);
   assert(html.includes('https://www.brennholz-direk.de/'+locale+path),locale+path+' canonical');
   assert(r.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
  }
  console.log('PASS '+locale+': '+paths.length+' pages, lang/canonical/hreflang/CSP');
 }
 const sitemap=await (await fetch(base+'/sitemap.xml')).text();for(const locale of locales)assert(sitemap.includes('https://www.brennholz-direk.de/'+locale+'/produits/'));
 for(const retired of ['fr','en']){assert(!sitemap.includes('https://www.brennholz-direk.de/'+retired+'/'));const r=await fetch(base+'/'+retired+'/produits?search=EPH',{redirect:'manual'});assert.equal(r.status,308);const target=new URL(r.headers.get('location'),base);assert.equal(target.pathname,'/de/produits');assert.equal(target.search,'?search=EPH');}
 console.log('PASS German-only pages, canonical links, sitemap and permanent legacy redirects. Read-only HTTP tests.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
