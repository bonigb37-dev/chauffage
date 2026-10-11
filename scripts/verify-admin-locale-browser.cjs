const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.argv[2];
if (!base) throw new Error('URL de test requise');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bren-seo-browser-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9238', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
async function run() {
  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:9238/json/list')).json(); if (targets.some((target) => target.type === 'page')) break; } catch { /* Wait for our browser. */ }
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



  await visit('/fr/compte');
  const user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',aud:'authenticated',email:'test@example.invalid',email_confirmed_at:'2026-10-01',app_metadata:{provider:'email'},user_metadata:{full_name:'Test Admin'},created_at:'2026-10-01T00:00:00Z'};
  const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.mock';
  const session={access_token:token,refresh_token:'mock-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
  const inboxWords = require('typescript').transpileModule(require('fs').readFileSync('lib/support-copy.ts','utf8'), {compilerOptions:{module:require('typescript').ModuleKind.CommonJS}}).outputText;
  const inboxModule = {exports:{}}; new Function('module','exports',inboxWords)(inboxModule,inboxModule.exports);
  const fixtures = [
    {user_id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',customer_name:'Alice Inbox',body:'Delivery question',sender_kind:'customer',locale:'de',unread:2,created_at:user.created_at},
    {user_id:'dddddddd-dddd-dddd-dddd-dddddddddddd',customer_name:'Bob Inbox',body:'Order confirmed',sender_kind:'admin',locale:'en',unread:0,created_at:user.created_at},
  ];
  mockRequest=async({requestId,request})=>{
    let data=[];const u=new URL(request.url);
    if(u.pathname.includes('/auth/v1/user'))data=user;
    else if(u.pathname.includes('admin_roles')) data=u.searchParams.has('user_id')?[{role:'owner'}]:[{user_id:user.id,role:'owner',created_at:user.created_at},{user_id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',role:'super_admin',created_at:user.created_at}];
    else if(u.pathname.includes('admin_audit_log'))data=[{id:'audit-test',action:'update',entity:'products',entity_id:'1',actor_user_id:user.id,actor_role:'owner',details:{price:100},created_at:user.created_at}];
    else if(u.pathname.includes('client_accounts'))data=[{user_id:user.id,full_name:'Test Admin',email:user.email,created_at:user.created_at}];
    else if(u.pathname.includes('user_activity'))data=[{user_id:user.id,email:user.email,last_seen_at:user.created_at,first_seen_at:user.created_at,sign_in_count:1}];
    else if(u.pathname.includes('contact_requests'))data=[{id:1,name:'Enregistrer',email:user.email,message:'Attribuer un rôle',subject:'product',status:'new',created_at:user.created_at}];
    else if(u.pathname.includes('order_requests'))data=[{id:1,reference:'TEST-ORDER',customer:{firstName:'Enregistrer',lastName:'Test',email:user.email,street:'Teststrasse 1',postalCode:'10115',city:'Berlin'},items:[],total_cents:1000,status:'new',payment_status:'pending',created_at:user.created_at}];
    else if(u.pathname.includes('support')) {
      if(request.method==='PATCH') data={success:true};
      else if(request.method==='POST') data={success:true};
      else data=u.searchParams.has('notifications')?{support:2,contacts:0,mail:{pending:0,failed:0,configured:false}}:u.searchParams.has('inbox')?{threads:fixtures}:{messages:u.searchParams.has('user_id')?[{...fixtures.find(row=>row.user_id===u.searchParams.get('user_id')),id:'fixture-message',body:'Literal <script>test</script>'}]:[]};
    }
    else if(!u.hostname.includes('supabase.co')){await send('Fetch.continueRequest',{requestId});return;}
    await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'GET,POST,OPTIONS'}],body:Buffer.from(JSON.stringify(data)).toString('base64')});
  };
  await send('Fetch.enable',{patterns:[{urlPattern:'*supabase.co/*'},{urlPattern:'*/api/support*'}]});
  await evaluate('localStorage.setItem('+JSON.stringify('sb-ykmwooejlvcsalobjopl-auth-token')+','+JSON.stringify(JSON.stringify(session))+')');
  for(const route of process.argv.includes('--admin-only') ? ['admin'] : ['super-admin','admin']) {
  await visit('/fr/'+route);
  for(const mobile of [false,true]) {
  await send('Emulation.setDeviceMetricsOverride',{width:mobile ? 390 : 1280,height:844,deviceScaleFactor:1,mobile});
  for(const locale of ['de','en','fr']){
    await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='"+locale.toUpperCase()+"').click()");
    await pause(4500);
    console.log(locale,await evaluate('location.pathname'),mobile ? 'mobile' : 'desktop');
    assert(!await evaluate("document.body.innerText.includes('Application error') || document.body.innerText.includes('Erreur d?application')"));
    const copy = require('../translations/'+locale+'.json');
    for (const source of route === 'super-admin' ? ['Attribuer un rôle','Ouvrir l’espace boutique','Adresse e-mail utilisateur','Comptes inscrits','Activité des comptes','Journal des actions'] : ['Demandes de commande','Demandes de contact','Catalogue et stock','Coordonnées de virement']) {
      assert(await evaluate('document.body.innerText.includes('+JSON.stringify(copy[source] || source)+')'),locale+' translated '+source);
      if(locale !== 'fr') assert(!await evaluate('document.body.innerText.includes('+JSON.stringify(source)+')'),locale+' no French '+source);
    }
    if(route === 'admin') assert(await evaluate("!![...document.querySelectorAll('[data-original-content]')].find(el=>el.textContent==='Attribuer un rôle')"),'Customer message is not translated');
    const inboxCopy = inboxModule.exports.supportCopy[locale];
    const inboxLabels = inboxModule.exports.supportInboxCopy[locale];
    await evaluate("[...document.querySelectorAll('nav button')].find(b=>b.textContent.startsWith("+JSON.stringify(inboxCopy.inbox)+")).click()");
    await pause(1500);
    assert(await evaluate("!!document.querySelector('#support-messages input[type=search]')"),'Inbox opens from top navigation');
    assert(await evaluate("document.querySelector('#support-messages').innerText.includes('Alice Inbox')"));
    await evaluate("[...document.querySelectorAll('#support-messages button')].find(b=>b.textContent==="+JSON.stringify(inboxLabels.answered)+").click()");
    assert(await evaluate("document.querySelector('#support-messages aside').innerText.includes('Bob Inbox') && !document.querySelector('#support-messages aside').innerText.includes('Alice Inbox')"),'Answered filter');
    await evaluate("[...document.querySelectorAll('#support-messages button')].find(b=>b.textContent==="+JSON.stringify(inboxLabels.all)+").click()");
    await evaluate("[...document.querySelectorAll('#support-messages aside button')].find(b=>b.textContent.includes('Alice Inbox')).click()");
    await pause(1500);
    assert(await evaluate("!!document.querySelector('#support-messages textarea')"),'Reply composer');
    assert(await evaluate("document.querySelector('#support-messages [role=log]').textContent.includes('Literal <script>test</script>')"),'Messages remain literal');
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Inbox fits viewport');
    if(mobile) {
      assert(await evaluate("getComputedStyle(document.querySelector('#support-messages aside')).display==='none'"),'Mobile conversation replaces list');
      await evaluate("document.querySelector('#support-messages button[aria-label="+JSON.stringify(inboxLabels.back)+"]').click()");
      assert(await evaluate("getComputedStyle(document.querySelector('#support-messages aside')).display!=='none'"),'Back to mobile conversation list');
    }
    if(route === 'admin') {
      await evaluate("[...document.querySelectorAll('#support-messages a')].find(a=>a.getAttribute('href').includes('#contact-requests')).click()");
      await pause(1000);
      assert(await evaluate("!document.querySelector('#support-messages') && !!document.querySelector('#contact-requests')"),'Contact requests return to workspace');
    } else {
      await evaluate("[...document.querySelectorAll('nav button')].find(b=>b.textContent==="+JSON.stringify(inboxLabels.workspace)+").click()");
    }
  }
  }
  }
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS administration and inbox: locale switching, filters, replies, mobile navigation and contact requests with mocked records. No real writes.');

}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
