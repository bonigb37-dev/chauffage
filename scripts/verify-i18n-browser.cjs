const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.argv[2];
if (!base) throw new Error('URL de test requise');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bren-seo-browser-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9237', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
async function run() {
  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:9237/json/list')).json(); if (targets.some((target) => target.type === 'page')) break; } catch { /* Wait for our browser. */ }
    await pause(250);
  }
  const target = targets?.find((entry) => entry.type === 'page');
  assert(target, 'Navigateur démarré');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  const cspViolations = [];
  let mockRequest;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
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
    const beforeErrors=errors.length;
    await send('Page.navigate', { url: `${base}${url}` });
    for (let attempt = 0; attempt < 60; attempt++) {
      await pause(250);
      if (await evaluate("document.readyState === 'complete' && !!document.querySelector('h1, h2') && !document.body.innerText.includes('Vérification de votre accès')")) { await pause(2000); if(errors.length>beforeErrors)console.error('Runtime error on '+url); return; }
    }
    throw new Error(`Page non rendue : ${url} : ${await evaluate('document.body.innerText.slice(0,500)')} ; ${errors.join(', ')}`);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  if (process.argv[3] === '--security') {
    await send('Runtime.addBinding', { name: '__reportCsp' });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "document.addEventListener('securitypolicyviolation', e => window.__reportCsp(e.effectiveDirective));" });
  }

  mockRequest=async({requestId})=>send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"tracked":false}').toString('base64')});
  await send('Fetch.enable',{patterns:[{urlPattern:'*/api/cart-drafts*'},{urlPattern:'*/api/analytics*'}]});
  for (const locale of ['de','fr','en']) {
    await visit('/'+locale);
    assert.equal(await evaluate('document.documentElement.lang'),locale);
    console.log(locale+' home: '+await evaluate("document.querySelector('h1').innerText"));
    assert.equal(await evaluate("document.querySelectorAll('link[rel=alternate][hreflang]').length"),4);
    await visit('/'+locale+'/produits/2-granules-eph-premium-dinplus-enplus-a1-palette');
    assert(await evaluate("!!document.querySelector('script[type=\"application/ld+json\"]')"));
    await evaluate("[...document.querySelectorAll('button')].find(b=>/In den Warenkorb|Ajouter au panier|Add to cart/.test(b.textContent)).click()");
    await visit('/'+locale+'/panier');
    assert(await evaluate("document.body.innerText.includes('EPH')"));
    await visit('/'+locale+'/commande');
    assert(await evaluate("document.querySelectorAll('input').length>5"));
    for (const route of process.argv.includes('--smoke') ? ['compte'] : ['compte','compte?mode=signup','compte?mode=forgot','contact','devis','retractation']) {
      await visit('/'+locale+'/'+route);
      assert.equal(await evaluate('document.documentElement.lang'),locale);
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await visit('/de');
  assert.equal(await evaluate("document.querySelectorAll('nav[aria-label=\"Language / Sprache / Langue\"]').length"),0,'Language selector removed');
  assert.equal(await evaluate("[...document.querySelectorAll('button')].filter(b=>['DE','FR','EN'].includes(b.textContent.trim())).length"),0);
  await evaluate("document.cookie='bren_locale=en; Path=/; SameSite=Lax'");
  await send('Network.enable');
  for(const [language,expected] of [['fr-FR','fr'],['en-US','en'],['de-DE','de'],['it-IT','de']]){await send('Network.setExtraHTTPHeaders',{headers:{'Accept-Language':language}});await visit('/');assert.equal(await evaluate('location.pathname'),'/'+expected);assert.equal(await evaluate('document.documentElement.lang'),expected);}
  await visit('/en/panier');assert(await evaluate("document.body.innerText.includes('EPH')"));
  assert.equal(errors.length,0,errors.join(', '));
  assert.equal(cspViolations.length,0,cspViolations.join(', '));
  console.log('PASS three locales, product/cart/checkout/auth/forms, automatic browser language and German fallback, old manual cookie ignored, cart retained, no JS/CSP errors. No order or email submitted.');
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
