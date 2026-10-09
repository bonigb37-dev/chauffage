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
  let mockRequest;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Fetch.requestPaused' && mockRequest) void mockRequest(message.params).catch((error) => errors.push(error.message));
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
    throw new Error(`Page non rendue : ${url} : ${await evaluate('document.body.innerText.slice(0,500)')} ; ${errors.join(', ')}`);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  if (process.argv[3] === '--admin') {
    const configuredUrl = fs.readFileSync('.env.local', 'utf8').match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
    assert(configuredUrl, 'Projet de test configuré');
    const project = new URL(configuredUrl).hostname.split('.')[0];
    const userId = '00000000-0000-4000-8000-000000000001';
    const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'admin-test@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {} };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt, role: 'authenticated' })).toString('base64url'), 'simulation'].join('.');
    const session = { access_token: token, refresh_token: 'simulation', token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, user };
    let testRole = 'admin';
    let roleChecks = 0;
    let secondaryPending = 0;
    mockRequest = async ({ requestId, request }) => {
      const url = new URL(request.url);
      let data = [];
      if (request.method === 'OPTIONS') data = [];
      else if (url.pathname.endsWith('/admin_roles') && url.searchParams.get('select') === 'role') { roleChecks++; data = testRole ? [{ role: testRole }] : []; await pause(200); }
      else if (url.pathname.endsWith('/admin_roles')) data = [{ user_id: userId, role: testRole, created_at: '2026-01-01T00:00:00Z' }];
      else if (/\/(user_activity|client_accounts|admin_audit_log)$/.test(url.pathname)) { secondaryPending++; await pause(6000); secondaryPending--; }
      else if (url.pathname.endsWith('/site_settings')) data = [{ value: { details: 'Compte de test, aucune transaction' } }];
      else if (url.pathname.endsWith('/user')) data = user;
      const requestedHeaders = Object.entries(request.headers).find(([name]) => name.toLowerCase() === 'access-control-request-headers')?.[1];
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: new URL(base).origin }, { name: 'Access-Control-Allow-Headers', value: requestedHeaders ?? 'authorization,apikey,x-client-info,content-type,prefer,accept,x-supabase-api-version' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }], body: Buffer.from(JSON.stringify(data)).toString('base64') });
    };
    await send('Network.enable');
    await send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 200000, uploadThroughput: 100000 });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await send('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co/*', requestStage: 'Request' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem(${JSON.stringify(`sb-${project}-auth-token`)}, ${JSON.stringify(JSON.stringify(session))});` });
    await visit('/admin');
    assert(await evaluate("document.body.innerText.includes('Demandes de commande')"), 'Commandes affichées');
    assert(secondaryPending > 0, 'Les listes secondaires ne bloquent pas les commandes');
    assert.equal(roleChecks, 1, 'Une seule vérification de rôle au chargement admin');
    await pause(6500);
    testRole = 'super_admin'; roleChecks = 0;
    await visit('/super-admin');
    assert(await evaluate("document.body.innerText.includes('Ouvrir l’espace boutique')"), 'Espace super admin affiché');
    assert(secondaryPending > 0, 'Les journaux ne bloquent pas l’espace super admin');
    assert.equal(roleChecks, 1, 'Une seule vérification de rôle au chargement super admin');
    await pause(6500);
    testRole = 'admin';
    await visit('/super-admin');
    assert.equal(await evaluate('location.pathname'), '/admin', 'Admin redirigé hors de la page super admin');
    assert(await evaluate("!document.body.innerText.includes('Ouvrir l’espace boutique')"));
    await pause(6500);
    testRole = null;
    await visit('/admin');
    assert(await evaluate("document.body.innerText.includes('Accès administrateur requis') && !document.body.innerText.includes('Demandes de commande')"), 'Compte sans rôle refusé');
    assert.equal(errors.length, 0, errors.join(', '));
    console.log('OK mobile simulé : admin et super admin avec une seule vérification de rôle, affichage avant les listes secondaires lentes, compte sans rôle refusé. API interceptée, aucune connexion ni écriture réelle.');
    return;
  }
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
