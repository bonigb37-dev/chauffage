const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.argv[2];
if (!base) throw new Error('URL de test requise');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bren-seo-browser-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9242', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
async function run() {
  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:9242/json/list')).json(); if (targets.some((target) => target.type === 'page')) break; } catch { /* Wait for our browser. */ }
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



﻿  const user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',aud:'authenticated',email:'admin@example.invalid',email_confirmed_at:'2026-10-01',app_metadata:{provider:'email'},user_metadata:{full_name:'Test Admin'},created_at:'2026-10-01T00:00:00Z'};
  const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.mock';
  const session={access_token:token,refresh_token:'mock-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
  let activeRole='admin',deleted=false;const updates=[];
  const fixture={id:'a'.repeat(64),createdAt:new Date().toISOString(),updatedAt:new Date(Date.now()-3600000).toISOString(),email:null,userId:null,items:[{productId:8305,name:'Buchenscheitholz, ofenfertig - 33 cm',quantity:2,unitPrice:19200}],totalCents:38400};
  mockRequest=async({requestId,request})=>{
    let data=[];const u=new URL(request.url);
    if(request.method==='OPTIONS')data={};
    else if(u.pathname==='/api/cart-drafts'){
      if(request.method==='POST'){updates.push(JSON.parse(request.postData));data={ok:true};}
      else if(request.method==='DELETE'){assert.equal(JSON.parse(request.postData).id,fixture.id);deleted=true;data={ok:true};}
      else data={drafts:deleted?[]:[fixture],more:false};
    }
    else if(u.pathname.includes('/auth/v1/user'))data=user;
    else if(u.pathname.includes('admin_roles'))data=[{user_id:user.id,role:activeRole,created_at:user.created_at}];
    else if(u.pathname.includes('site_settings'))data=[];
    else if(u.pathname.includes('/api/support'))data={messages:[],threads:[],unread:0};
    else if(u.pathname.includes('/api/analytics'))data={ok:true};
    else if(!u.hostname.includes('supabase.co')){await send('Fetch.continueRequest',{requestId});return;}
    await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'GET,POST,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify(data)).toString('base64')});
  };
  await send('Fetch.enable',{patterns:[{urlPattern:'*supabase.co/*'},{urlPattern:'*/api/cart-drafts*'},{urlPattern:'*/api/support*'},{urlPattern:'*/api/analytics*'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await visit('/fr/produits');
  await evaluate("document.querySelector('#acheter-produit-8305').click()");await pause(1600);
  assert(updates.some(x=>x.items.some(i=>i.productId===8305&&i.quantity===1)),'Product addition synced');
  await visit('/fr/panier');
  await evaluate("document.querySelector('button[aria-label^=\"Augmenter la quantit\"]').click()");await pause(1400);
  assert(updates.some(x=>x.items.some(i=>i.productId===8305&&i.quantity===2)),'Quantity change synced');
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Retirer').click()");await pause(1400);
  assert.equal(updates.at(-1).items.length,0,'Empty cart synced');
  await evaluate('localStorage.setItem('+JSON.stringify('sb-ykmwooejlvcsalobjopl-auth-token')+','+JSON.stringify(JSON.stringify(session))+')');
  for(const route of ['/fr/admin','/fr/super-admin']){
    activeRole=route.includes('super-admin')?'super_admin':'admin';deleted=false;
    await visit(route);await pause(2000);
    await evaluate("[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('Paniers non')).click()");await pause(1500);
    assert(await evaluate("document.body.innerText.includes('Buchenscheitholz, ofenfertig - 33 cm')"),'Draft visible in '+route);
    assert(await evaluate("document.body.innerText.includes('384')"),'Server total shown');
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Mobile carts fit viewport');
    acceptArchiveDialog=true;
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Retirer du suivi')).click()");await pause(1500);
    assert(deleted,'Admin removal called');assert(!await evaluate("document.body.innerText.includes('Buchenscheitholz, ofenfertig - 33 cm')"),'Removed draft gone');
  }
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS browser: product addition, quantity updates, cart clearing, draft list and removal in admin/super-admin, mobile layout. All customer and administrator records mocked; no real writes.');

}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
