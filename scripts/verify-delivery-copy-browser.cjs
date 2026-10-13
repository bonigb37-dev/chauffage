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
﻿﻿﻿  let blockedWrites=0;
  mockRequest=async({requestId})=>{blockedWrites++;await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"tracked":false}').toString('base64')});};
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/analytics*'},{urlPattern:'*/api/cart-drafts*'}]});
  const xml=await(await fetch(base+'/google-merchant.xml')).text();const productLinks=[2,17,56].map(id=>{const item=xml.match(new RegExp('<g:id>'+id+'</g:id>([\\s\\S]*?)</item>'))[1];return new URL(item.match(/<g:link>(.*?)<\/g:link>/)[1]).pathname.replace('/de/','/');});
  let pages=0;
  for(const locale of ['fr','de'])for(const route of ['/','/produits','/services','/contact','/faq','/agb','/retractation','/frais-livraison','/guide-pellets','/livraison/hessen',...productLinks]){
    await visit('/'+locale+(route==='/'?'':route));const text=await evaluate('document.body.innerText');
    assert(!/frais (?:de livraison )?(?:calculés|selon)|frais de livraison s’ajoutent|frais supplémentaires liés à un mode|Lieferkosten nach Entfernung|entfernungsabhängigen Kosten|Lieferkosten kommen zum Produktpreis|Les frais de livraison standard facturés figurent/.test(text),locale+route+' obsolete delivery text');
    if(route==='/faq'){assert(text.includes(locale==='de'?'Ist die Lieferung in Deutschland kostenlos?':'La livraison est-elle gratuite en Allemagne ?'));const allText=await evaluate('document.querySelector("main").textContent');assert(allText.includes(locale==='de'?'ohne Ausnahme':'sans exception'));}
    if(route==='/retractation')assert(text.includes(locale==='de'?'ohne Aufpreis: 0,00 €':'sans supplément : 0,00 €'));
    if(productLinks.includes(route)||route==='/produits')assert(!/Livraison gratuite|Kostenlose Lieferung/.test(text));
    pages++;
  }
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS '+pages+' pages/sections FR+DE: no distance-based fees or added transport charges, FAQ free delivery without exceptions, withdrawal terms zero delivery, product/catalogue promotional restrictions preserved. Tracking writes intercepted: '+blockedWrites);

}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
