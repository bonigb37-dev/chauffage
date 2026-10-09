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
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
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
    throw new Error(`Page non rendue : ${url}`);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await visit('/');
  assert((await evaluate("document.querySelector('h1').innerText")).includes('livraison en Allemagne'));
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Consultez nos différentes zones')).click()");
  assert(await evaluate("!!document.querySelector('[role=dialog]') && document.querySelector('[role=dialog]').innerText.includes('Schleswig-Holstein')"));
  await evaluate("document.querySelector('[role=dialog] button[aria-label=\"Fermer la fenêtre\"]').click()");
  assert(await evaluate("!document.querySelector('[role=dialog]')"));
  await visit('/produits/categorie/granules-de-bois');
  assert.equal(await evaluate("document.querySelector('h1').innerText"), 'Granulés de bois');
  assert((await evaluate("document.querySelectorAll('[id^=produit-]').length")) > 0);
  assert(await evaluate("[...document.querySelectorAll('button')].some(b => b.getAttribute('aria-pressed') === 'true' && b.textContent === 'Granulés')"));
  await evaluate("document.querySelector('input[aria-label=\"Rechercher un produit\"]').focus()");
  await send('Input.insertText', { text: 'EPH' });
  await pause(500);
  assert(await evaluate("[...document.querySelectorAll('[id^=produit-] article')].every(a => a.textContent.includes('EPH')) && document.querySelectorAll('[id^=produit-] article').length > 0"));
  await visit('/produits/2-granules-eph-premium-dinplus-enplus-a1-palette');
  assert(await evaluate("!!document.querySelector('script[type=\"application/ld+json\"]')"));
  assert(await evaluate("document.querySelector('h1').innerText.includes('EPH')"));
  await visit('/compte');
  assert(await evaluate("document.querySelector('meta[name=robots]').content.includes('noindex')"));
  assert.equal(errors.length, 0, `Exceptions navigateur : ${errors.join(', ')}`);
  console.log('OK navigateur : accueil, ouverture/fermeture des zones, catégorie filtrée, recherche EPH, fiche produit, compte et absence d’exception JavaScript. Aucun achat ni e-mail envoyé.');
}
run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
