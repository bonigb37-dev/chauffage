const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.argv[2];
if (!base) throw new Error('URL de test requise');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bren-seo-browser-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9244', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
async function run() {
  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:9244/json/list')).json(); if (targets.some((target) => target.type === 'page')) break; } catch { /* Wait for our browser. */ }
    await pause(250);
  }
  const target = targets?.find((entry) => entry.type === 'page');
  assert(target, 'Navigateur démarré');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  let acceptArchiveDialog=false;
  const cspViolations = [];
  let mockRequest;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if(message.method==='Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog',{accept:acceptArchiveDialog});
    if (message.method === 'Fetch.requestPaused' && mockRequest) void mockRequest(message.params).catch((error) => errors.push(error.message));
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.bindingCalled' && message.params.name === '__reportCsp') cspViolations.push(message.params.payload);
    const request = pending.get(message.id);
    if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Délai dépassé : ${method}`)); }, 20000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function visit(url) {
    await send('Page.navigate', { url: `${base}${url}` });
    for (let attempt = 0; attempt < 60; attempt++) {
      await pause(250);
      if (await evaluate("document.readyState === 'complete' && !!document.querySelector('h1, h2') && !document.body.innerText.includes('Vérification de votre accès')")) { await pause(2000); return; }
    }
    throw new Error(`Page non rendue : ${url} : ${await evaluate('document.body.innerText.slice(0,500)')} ; ${errors.join(', ')}`);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  if (process.argv[3] === '--security') {
    await send('Runtime.addBinding', { name: '__reportCsp' });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "document.addEventListener('securitypolicyviolation', e => window.__reportCsp(e.effectiveDirective));" });
  }



﻿
﻿﻿  const products=JSON.parse(fs.readFileSync('reference/ttc-price-baseline.json','utf8'));const p2=products.find(p=>p.id===2),p17=products.find(p=>p.id===17);const gross=p2.priceAmount+p17.priceAmount;
  let checkoutCalls=0,quoteCalls=0;
  const tax={included:true,rounding:'per_rate_total',breakdown:[{grossCents:p2.priceAmount,vatCents:Math.round(p2.priceAmount*7/107),netCents:p2.priceAmount-Math.round(p2.priceAmount*7/107),rate:7},{grossCents:p17.priceAmount,vatCents:Math.round(p17.priceAmount*19/119),netCents:p17.priceAmount-Math.round(p17.priceAmount*19/119),rate:19}],pendingGrossCents:0,complete:true};
  mockRequest=async({requestId,request})=>{const url=new URL(request.url);let status=200,body={};if(url.pathname==='/api/delivery-quote'){quoteCalls++;status=410;}else if(url.pathname==='/api/checkout'){checkoutCalls++;const data=JSON.parse(request.postData);assert(!data.deliveryToken);assert(data.acceptedTerms);assert.equal(data.items.reduce((a,l)=>a+l.unitPriceCents*l.quantity,0),gross);body={reference:'TP-TESTFIXTURE',totalCents:gross,subtotalCents:gross,delivery:{feeCents:0},vat:tax};status=201;}else if(url.pathname==='/api/address-suggestions'){body={suggestions:[]};}else if(url.pathname==='/api/cart-drafts'){body={tracked:false};}await send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});};
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/checkout*'},{urlPattern:'*/api/delivery-quote*'},{urlPattern:'*/api/address-suggestions*'},{urlPattern:'*/api/cart-drafts*'},{urlPattern:'*/api/analytics*'}]});
  async function noOverflow(){const layout=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert(layout.scroll<=layout.width+1,JSON.stringify(layout));}
  for(const locale of ['fr','de']){
   await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
   await visit('/'+locale+'/produits');const catalogue=await evaluate('document.querySelector("main").innerText');assert(!/Livraison gratuite|Kostenlose Lieferung|frais calculés selon|Lieferkosten nach Entfernung/.test(catalogue));assert(catalogue.includes(locale==='de'?'inkl. 7 % MwSt.':'TVA 7 % incluse'));assert(catalogue.includes(locale==='de'?'inkl. 19 % MwSt.':'TVA 19 % incluse'));await noOverflow();
   await evaluate('localStorage.setItem("thermopro-cart-v1",JSON.stringify([{productId:2,quantity:1},{productId:17,quantity:1}]))');
   const amount=new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(gross/100);const zero=new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(0);
   for(const width of [390,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});await visit('/'+locale+'/panier');let text=await evaluate('document.querySelector("main aside").innerText');assert(text.includes(amount),text);assert(text.includes(zero));assert(text.includes(locale==='de'?'davon 7 % MwSt.':'dont TVA 7 %'));assert(text.includes(locale==='de'?'davon 19 % MwSt.':'dont TVA 19 %'));await noOverflow();await visit('/'+locale+'/commande');text=await evaluate('document.querySelector("main aside").innerText');assert(text.includes(amount)&&text.includes(zero),text);await noOverflow();}
   await evaluate("(()=>{for(const [name,value] of Object.entries({firstName:'Test',lastName:'Fixture',street:'Teststrasse 1',postalCode:'66663',city:'Merzig',email:'test@example.invalid'})){const el=document.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}document.querySelector('[name=terms]').click();document.querySelector('form').requestSubmit();})()");
   for(let i=0;i<70;i++){if(await evaluate('location.pathname.includes("/commande/succes") && !!document.querySelector("main h1") && document.body.innerText.includes("TP-TESTFIXTURE")'))break;await pause(200);}
   const receipt=await evaluate('JSON.parse(sessionStorage.getItem("thermopro-pending-order"))');assert(receipt&&receipt.total===gross);assert.equal(receipt.delivery.feeCents,0);assert.deepEqual(receipt.vat,tax);const success=await evaluate('document.querySelector("main").innerText');assert(success.includes(amount)&&success.includes(zero),success);assert(success.includes(locale==='de'?'davon 19 % MwSt.':'dont TVA 19 %'));
   await visit('/'+locale+'/frais-livraison');const policy=await evaluate('document.querySelector("main").innerText');assert(policy.includes('0,00'));assert(!policy.includes('64 €'));assert(policy.includes(locale==='de'?'Lieferbedingungen':'Conditions de livraison'));console.log('PASS '+locale+': catalogue 7/19%, cart and checkout at 390/1440px, exact gross total, zero delivery, mixed VAT, simulated confirmation, translated delivery terms');
  }
  assert.equal(checkoutCalls,2);assert.equal(quoteCalls,0);assert.equal(errors.length,0,errors.join('\n'));console.log('PASS no delivery-calculator request; all checkout/cart-draft/analytics writes intercepted, no real orders or database edits.');

}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
