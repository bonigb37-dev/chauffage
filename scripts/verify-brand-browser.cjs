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
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
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

  const name='Bren-nholz \u2014 Leylines Park';
  const legalLabels={de:['Handelsname:','Betreiber:'],en:['Trading name:','Operator:'],fr:['Nom commercial :','Exploitant :']};
  for(const locale of ['de','en','fr']) {
    for(const route of ['','/contact','/a-propos','/avis-juridique','/agb','/datenschutz','/compte']) {
      await visit('/'+locale+route);
      assert(await evaluate('document.title.includes('+JSON.stringify(name)+')'),'Complete commercial name in page title '+locale+route);
      assert(await evaluate("[...document.querySelectorAll('a[href=\"/"+locale+"\"]')].some(a=>a.textContent.includes('Bren-nholz')&&a.textContent.includes('Leylines Park'))"),'Two-line logo '+locale+route);
      assert(await evaluate('document.querySelector(\"footer\").innerText.includes('+JSON.stringify(name)+')'),'Footer commercial name '+locale+route);
      if(route==='/contact'||route==='/a-propos'||route==='/agb'||route==='/datenschutz')assert(await evaluate('document.querySelector(\"main\").innerText.includes('+JSON.stringify(name)+')'),'Commercial name in content '+locale+route);
      if(route==='/avis-juridique') {
        assert(await evaluate('[...document.querySelectorAll(\"dt\")].some(dt=>dt.textContent==='+JSON.stringify(legalLabels[locale][0])+'&&dt.nextElementSibling.textContent==='+JSON.stringify(name)+')'),'Trading name separately labelled');
        assert(await evaluate('[...document.querySelectorAll(\"dt\")].some(dt=>dt.textContent==='+JSON.stringify(legalLabels[locale][1])+'&&dt.nextElementSibling.textContent===\"Leylines\")'),'Operator unchanged and separately labelled');
      }
    }
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await visit('/'+locale+'/contact');
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Mobile logo fits viewport');
    await send('Emulation.clearDeviceMetricsOverride');
    console.log('PASS '+locale+' branding, logos, operator labels and mobile layout');
  }
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS public branding consistency. Read-only browser checks; no form submissions or consent acceptance.');
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
