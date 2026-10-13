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
﻿
  let orderCount=0;
  mockRequest=async params=>{const pathname=new URL(params.request.url).pathname;let payload;
    if(pathname==='/api/cart-drafts')payload={ok:true};else if(pathname==='/api/analytics')payload={ok:true};else if(pathname==='/api/checkout'){orderCount++;const body=JSON.parse(params.request.postData);assert(body.deliveryToken);payload={reference:'TP-ABCDEF123456',totalCents:54400,proofToken:'mock-test'};}else{await send('Fetch.continueRequest',{requestId:params.requestId});return;}
    await send('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:pathname==='/api/checkout'?201:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:btoa(JSON.stringify(payload))});
  };
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/cart-drafts*'},{urlPattern:'*/api/analytics*'},{urlPattern:'*/api/checkout'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await visit('/fr/frais-livraison');assert.equal(await evaluate("document.querySelectorAll('#frais-livraison table').length"),2);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  await evaluate("localStorage.setItem('thermopro-cart-v1',JSON.stringify([{productId:2,quantity:1}]))");
  await visit('/fr/commande');
  await evaluate(`(()=>{for(const [name,value] of Object.entries({firstName:'Test',lastName:'Browser',email:'test@example.invalid',street:'Römerberg 23',postalCode:'60311',city:'Frankfurt am Main'})){const input=document.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  for(let i=0;i<100;i++){await pause(250);if(await evaluate("document.querySelector('button[type=submit]').textContent.includes('Commander avec')"))break;}
  assert.equal(orderCount,0,'Calculation never creates an order');
  assert(await evaluate("document.querySelector('main aside').innerText.includes('45,00')"),'Actual road route fee visible');assert(await evaluate("document.querySelector('main aside').innerText.includes('544,00')"),'Products plus fee visible');
  await evaluate("const t=document.querySelector('[name=terms]');t.click()");
  assert(await evaluate("document.querySelector('button[type=submit]').textContent.includes('Commander avec')"),'Terms do not invalidate quote');
  await evaluate("document.querySelector('button[type=submit]').click()");
  for(let i=0;i<50;i++){await pause(250);if(await evaluate("location.pathname.includes('/succes')"))break;}
  assert.equal(orderCount,1);for(let i=0;i<60;i++){await pause(250);if(await evaluate("document.body.innerText.includes('45,00')"))break;}assert(await evaluate("document.body.innerText.includes('45,00')"),'Delivery fee on confirmation');
  console.log('PASS mobile tables, actual 45 EUR road fee, 544 EUR checkout total, two-step confirmation, delivery metadata on success. Order and draft writes intercepted; no real order created.');

}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
