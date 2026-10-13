const fs=require('fs');
const base=process.argv[2] || 'https://www.brennholz-direk.de';
const cache=new Map(), failures=[], links=new Set(), anchors=[], contacts=new Set();
async function get(url){if(!cache.has(url))cache.set(url,fetch(url,{signal:AbortSignal.timeout(45000)}).then(async r=>({status:r.status,text:await r.text(),url:r.url})).catch(e=>({status:0,text:'',error:e.message})));return cache.get(url);}
async function pool(list,fn){let i=0;await Promise.all(Array.from({length:8},async()=>{while(i<list.length){const item=list[i++];await fn(item);}}));}
(async()=>{const sitemap=await get(base+'/sitemap.xml');const pages=[...new Set([...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&')))];if(!pages.length)throw Error('Empty sitemap');
await pool(pages,async url=>{const page=await get(url);if(page.status!==200){failures.push({url,status:page.status});return;}for(const m of page.text.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)){const href=m[1].replace(/&amp;/g,'&');if(/^(mailto:|tel:)/.test(href)){contacts.add(href);continue;}let link;try{link=new URL(href,url);}catch{failures.push({url,href});continue;}if(link.origin!==new URL(base).origin)continue;if(link.hash)anchors.push({from:url,url:link.origin+link.pathname+link.search,hash:decodeURIComponent(link.hash.slice(1))});link.hash='';links.add(link.href);}});
await pool([...links],async url=>{const r=await get(url);if(r.status!==200)failures.push({url,status:r.status,error:r.error});});
for(const a of anchors){const r=await get(a.url);if(r.status===200&&!r.text.includes('id="'+a.hash+'"')&&!r.text.includes('name="'+a.hash+'"'))failures.push({anchor:a.hash,url:a.url,from:a.from});}
const result={pages:pages.length,internalLinks:links.size,anchors:anchors.length,contacts:[...contacts],failures};fs.writeFileSync('reference/link-audit-20261013.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
