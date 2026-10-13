const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const ts = require('typescript');
const cache = new Map();
function load(file) {
 file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const requireLocal=name=>name.startsWith('@/') ? name.endsWith('.json') ? JSON.parse(fs.readFileSync(name.slice(2),'utf8')) : load(name.slice(2)+'.ts') : require(name);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(requireLocal,module,module.exports);return module.exports;
}
function parseXml(xml) {
 const ps="$ErrorActionPreference='Stop'; $utf8=New-Object System.Text.UTF8Encoding $false; [Console]::InputEncoding=$utf8; [Console]::OutputEncoding=$utf8; $OutputEncoding=$utf8; $doc=New-Object System.Xml.XmlDocument; $doc.XmlResolver=$null; $doc.LoadXml([Console]::In.ReadToEnd()); $ns=New-Object System.Xml.XmlNamespaceManager($doc.NameTable); $ns.AddNamespace('g','http://base.google.com/ns/1.0'); @($doc.SelectNodes('/rss/channel/item') | ForEach-Object { $item=$_; $row=@{}; foreach($key in @('id','title','description','link','image_link','price','availability','condition','brand','gtin','mpn','identifier_exists','shipping_label')) { $node=$item.SelectSingleNode('g:'+$key,$ns); if($node){$row[$key]=$node.InnerText} }; $row.shipping=$item.SelectSingleNode('g:shipping/g:price',$ns).InnerText; $row }) | ConvertTo-Json -Compress";
 const parsed=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',ps],{input:xml,encoding:'utf8',windowsHide:true,maxBuffer:4000000}));
 return Array.isArray(parsed)?parsed:[parsed];
}
const {buildMerchantFeed}=load('lib/merchant-feed.ts');
const {mergeCatalog}=load('lib/catalog.ts');
const de=JSON.parse(fs.readFileSync('translations/de.json','utf8'));
const base='https://www.brennholz-direk.de';
const products=mergeCatalog([]);
assert(products.every(p => p.stock !== 0), "Current catalogue must be in stock");
const original=buildMerchantFeed(products,base);
const items=parseXml(original.xml);
const noPrice = products.filter(p => !Number.isSafeInteger(p.priceAmount) || p.priceAmount <= 0);
assert.deepEqual(original.omitted.map(p => p.id).sort((a,b)=>a-b), noPrice.map(p => p.id).sort((a,b)=>a-b));
assert.equal(items.length,products.length-noPrice.length);
assert.equal(new Set(items.map(item=>item.id)).size,items.length);
for (const [id, source, replacement] of [
 ['5', 'buches-chene.webp', 'buches-chene-20261012.webp'],
 ['14', 'bois-allumage.webp', 'bois-allumage-20261012.webp'],
 ['67', 'bois-chauffages-img-7.jpg', 'bois-chauffages-img-7-20261012.jpg'],
]) {
 assert.equal(items.find(item=>item.id===id).image_link,base+'/merchant-images/'+replacement);
 assert.deepEqual(fs.readFileSync('public/'+source),fs.readFileSync('public/merchant-images/'+replacement));
 const product=products.find(p=>String(p.id)===id);
 const edited=parseXml(buildMerchantFeed([{...product,image:'/new-photo.jpg',gallery:undefined}],base).xml);
 assert.equal(edited[0].image_link,base+'/new-photo.jpg');
}
for (const item of items.filter(item=>!['5','14','67'].includes(item.id))) {
 const product=products.find(p=>String(p.id)===item.id);
 assert.equal(item.image_link,new URL(product.gallery?.[0]??product.image,base).href);
}
for(const item of items){const p=products.find(p=>String(p.id)===item.id);assert.equal(item.title,de[p.name]);assert.equal(item.description,de[p.description]);assert.equal(item.price,(p.priceAmount/100).toFixed(2)+' EUR');assert.equal(item.availability,p.stock===0?'out_of_stock':'in_stock');assert(item.link.startsWith(base+'/de/produits/'));assert(item.image_link.startsWith('https://'));assert(!item.gtin&&!item.mpn&&!item.identifier_exists);assert.equal(item.shipping,'0.00 EUR');assert(!item.shipping_label);assert(item.title.length<=150&&item.description.length<=5000);}
const changed=mergeCatalog([{product_id:2,data:{priceAmount:12345,stock:0},is_deleted:false},{product_id:3,data:{},is_deleted:true}]);
const changedItems=parseXml(buildMerchantFeed(changed,base).xml);
assert.equal(changedItems.find(item=>item.id==='2').price,'123.45 EUR');
assert.equal(changedItems.find(item=>item.id==='2').availability,'out_of_stock');
assert(!changedItems.some(item=>item.id==='3'));
const p=products.find(product=>product.priceAmount>0 && !product.gallery?.length);
assert.equal(buildMerchantFeed([{...p,priceAmount:undefined}],base).count,0);
assert.equal(buildMerchantFeed([{...p,name:'Untranslated new product'}],base).count,0);
assert.equal(buildMerchantFeed([{...p,image:'javascript:alert(1)'}],base).count,0);
const escaped=parseXml(buildMerchantFeed([{...p,image:'/image.png?x=1&y=2'}],base).xml);
assert.equal(escaped[0].image_link,base+'/image.png?x=1&y=2');
const reference = JSON.parse(fs.readFileSync('reference/brennholzwerk/catalogue.json','utf8'));
const imported = products.filter(p => p.id >= 8301 && p.id <= 8322);
const variants = reference.products.flatMap(p => p.variants.filter(v => v.priceWithTax > 0).map(v => ({ product: p, variant: v })));
assert.equal(imported.length,16);
assert(imported.every(p => p.priceAmount > 0 && p.description.trim() && p.quantity.trim() && p.gallery.length));
assert.equal(variants.length,imported.length);
for (let i=0;i<imported.length;i++) {
 const p=imported[i], v=variants[i];
 assert.equal(p.priceAmount,v.variant.priceWithTax || undefined);
 assert.deepEqual(p.gallery,v.product.images.map(a=>a.publishedLocal ?? a.local));
 for(const image of p.gallery) assert(fs.statSync('public'+image).size>0);
 if (!p.priceAmount) assert(!items.some(item=>item.id===String(p.id)));
}
console.log('PASS '+items.length+' products: valid parsed XML, German copy, stable IDs, prices, stock/deletion overrides, escaping, invalid records omitted, no invented identifiers.');
async function live(){const endpoint=process.argv[2];if(!endpoint)return;
 let liveItems;
 for(const headers of [{},{'accept-language':'fr-FR',cookie:'bren_locale=fr'},{'accept-language':'en-US',cookie:'bren_locale=en'}]){const r=await fetch(endpoint+'/google-merchant.xml',{headers,redirect:'manual'});assert.equal(r.status,200);assert(r.headers.get('content-type')?.startsWith('application/xml'));assert(!r.headers.get('location'));const xml=await r.text();assert(!xml.includes('<html'));const rows=parseXml(xml);assert(rows.length>0);if(liveItems)assert.deepEqual(rows,liveItems);else liveItems=rows;}
 for(const item of liveItems){
  const url=new URL(item.link);const r=await fetch(endpoint+url.pathname);assert.equal(r.status,200);const html=await r.text();assert(html.includes('lang="de"'));
  const json=html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];assert(json,item.id+' structured data');const product=JSON.parse(json);
  assert.equal(item.title,product.name);assert.equal(item.description,product.description);assert.equal(item.price,product.offers.price+' '+product.offers.priceCurrency);
  assert.equal(product.offers.priceSpecification.valueAddedTaxIncluded,true);assert.equal(product.offers.shippingDetails.shippingRate.value,'0.00');assert.equal(product.offers.shippingDetails.shippingDestination.addressCountry,'DE');
  assert.equal(item.availability,product.offers.availability.endsWith('/OutOfStock')?'out_of_stock':'in_stock');
  const image=new URL(item.image_link);const imageResponse=await fetch(endpoint+image.pathname+image.search,{method:'HEAD'});assert.equal(imageResponse.status,200,item.id+' image');assert(imageResponse.headers.get('content-type')?.startsWith('image/'));
 }
 console.log('PASS public XML without auth/locale redirects; '+liveItems.length+' live products agree with German landing-page prices, availability, titles, descriptions and accessible images. Read-only checks.');
}
live().catch(error=>{console.error(error);process.exitCode=1;});
