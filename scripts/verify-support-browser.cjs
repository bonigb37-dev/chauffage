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
  if (process.argv[3] === '--security') {
    await send('Runtime.addBinding', { name: '__reportCsp' });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "document.addEventListener('securitypolicyviolation', e => window.__reportCsp(e.effectiveDirective));" });
  }


  for (const locale of ['de','fr','en']) {
    await visit('/'+locale+'/aide');
    assert.equal(await evaluate('document.documentElement.lang'),locale);
    assert(await evaluate("[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/'+document.documentElement.lang+'/compte')"));
    assert(await evaluate("[...document.querySelectorAll('footer a')].some(a=>a.getAttribute('href')==='/'+document.documentElement.lang+'/aide')"));
    assert.equal(await evaluate("document.querySelector('meta[name=robots]').content"),'noindex, follow');
    console.log(locale+' help guest page OK');
  }
  await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:2,mobile:true});
  await visit('/de/aide');
  assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Mobile page fits viewport');
  const user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',aud:'authenticated',email:'test@example.invalid',email_confirmed_at:'2026-10-01',app_metadata:{provider:'email'},user_metadata:{full_name:"Test Customer"},created_at:'2026-10-01T00:00:00Z'};
  const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.mock';
  const session={access_token:token,refresh_token:'mock-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
  let messages=[{id:'mock1',user_id:user.id,sender_kind:'admin',body:'Test reply <script>window.__injected=1</script>',locale:'de',created_at:'2026-10-11T12:00:00Z'}];
  let delayRefresh=false, failSend=false, unread=2;
  mockRequest=async ({requestId,request})=>{
    let data;
    if(request.url.includes('/api/support')){
      if(new URL(request.url).searchParams.has('notifications')) { await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify({support:unread,contacts:0})).toString('base64')});return; }
      if(request.method==='PATCH') { unread=0; await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify({success:true})).toString('base64')});return; }
      if(delayRefresh) await pause(1200);
      if(failSend && request.method==='POST') { await send('Fetch.fulfillRequest',{requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify({error:'unavailable'})).toString('base64')});return; }
      if(request.method==='POST'){const p=JSON.parse(request.postData);messages.push({id:'mock2',user_id:user.id,sender_kind:'customer',body:p.body,locale:p.locale,created_at:'2026-10-11T13:00:00Z'});data={success:true};}else data={messages};
    }else if(request.url.includes('/auth/v1/user'))data=user;
    else if(request.url.includes('/rest/v1/'))data=[];
    else {await send('Fetch.continueRequest',{requestId});return;}
    await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'*'},{name:'Access-Control-Allow-Methods',value:'GET,POST,OPTIONS'}],body:Buffer.from(JSON.stringify(data)).toString('base64')});
  };
  await send('Fetch.enable',{patterns:[{urlPattern:'*supabase.co/*'},{urlPattern:'*/api/support*'}]});
  await evaluate('localStorage.setItem('+JSON.stringify('sb-ykmwooejlvcsalobjopl-auth-token')+','+JSON.stringify(JSON.stringify(session))+')');
  await visit('/de/aide');
  for(let i=0;i<40;i++){if(await evaluate('!!document.querySelector("textarea")'))break;await pause(250);}
  assert(await evaluate('!!document.querySelector("textarea")'),'Authenticated messaging form visible: '+await evaluate('document.body.innerText.slice(-1200)'));
  assert(await evaluate('document.body.innerText.includes("Test reply <script>")'),'Reply is literal text');
  assert(!await evaluate('window.__injected'),'Message HTML cannot execute');
  assert(await evaluate("document.querySelector('input[type=file]').accept.includes('application/pdf')"),'Attachment picker visible with supported formats');
  await evaluate("(()=>{const input=document.querySelector('input[type=file]');const dt=new DataTransfer();dt.items.add(new File(['bad'], 'test.exe', {type:'application/x-msdownload'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await pause(300);assert(await evaluate("!!document.querySelector('[role=alert]')"),'Unsupported attachment rejected');
  await evaluate("(()=>{const t=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,'Browser test message');t.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await pause(300);
  await evaluate("document.querySelector('textarea').closest('form').requestSubmit()");
  await pause(1500);
  assert(await evaluate('document.body.innerText.includes("Browser test message")'),'Message shown after saved response');
  assert(await evaluate("[...document.querySelectorAll('[role=log] strong')].some(el=>el.textContent==='Test Customer')"),'Client message displays account name');
  delayRefresh=true;
  await evaluate("document.querySelector('button[aria-busy]').click()");
  await pause(200);
  assert(await evaluate("document.querySelector('button[aria-busy]').disabled && document.querySelector('button[aria-busy]').getAttribute('aria-busy')==='true'"),'Refresh visibly busy');
  await pause(1800);
  assert(await evaluate("!document.querySelector('button[aria-busy]').disabled"),'Refresh reenabled');
  assert(await evaluate("[...document.querySelectorAll('[role=status]')].some(el => el.textContent.includes('aktualisiert'))"),'Refresh completion visible');
  delayRefresh=false; failSend=true;
  await evaluate("(()=>{const t=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,'Unsent draft');t.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await pause(300); await evaluate("document.querySelector('textarea').closest('form').requestSubmit()"); await pause(1500);
  assert(await evaluate("!!document.querySelector('[role=alert]')"),'Send failure visible');
  assert.equal(await evaluate("document.querySelector('textarea').value"),'Unsent draft','Failed send preserves draft');
  failSend=false;
  messages.push({id:'mock-live',user_id:user.id,sender_kind:'admin',body:'Automatic incoming reply',locale:'de',created_at:'2026-10-11T14:00:00Z'});
  for(let i=0;i<60;i++){if(await evaluate('document.body.innerText.includes("Automatic incoming reply")'))break;await pause(250);}
  assert(await evaluate('document.body.innerText.includes("Automatic incoming reply")'),'Incoming message appears without refresh click');
  assert.equal(await evaluate("document.querySelector('textarea').value"),'Unsent draft','Automatic refresh preserves draft');
  assert(await evaluate("!!document.querySelector('[role=log]')"),'Accessible chat log');
  unread=2;
  await visit('/de');
  for(let i=0;i<40;i++){if(await evaluate("!!document.querySelector('a.fixed .bg-red-600')"))break;await pause(250);}
  assert.equal(await evaluate("document.querySelector('a.fixed .bg-red-600')?.textContent"),'2','Unread badge visible to client');
  await visit('/de/aide'); await pause(500);
  assert.equal(unread,0,'Reading conversation acknowledges notifications');
  await visit('/de');
  assert(!await evaluate("document.querySelector('a.fixed .bg-red-600')"),'Read badge cleared');
  assert.equal(errors.length,0,errors.join(', '));
  assert.equal(cspViolations.length,0,cspViolations.join(', '));
  console.log('PASS multilingual guest/mobile and mocked authenticated read/send, HTML text safe, no real messages sent.');
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
