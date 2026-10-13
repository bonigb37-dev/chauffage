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
﻿  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  for(const width of [390,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
    await visit('/fr');
    for(let i=0;i<40;i++){if(await evaluate("document.querySelector('[data-analytics-section=hero] video')?.readyState>=3"))break;await pause(250);}
    const info=await evaluate("(()=>{const v=document.querySelector('[data-analytics-section=hero] video');return {muted:v.muted,defaultMuted:v.defaultMuted,loop:v.loop,autoplay:v.autoplay,inline:v.playsInline,controls:v.controls,time:v.currentTime,paused:v.paused,width:v.videoWidth,height:v.videoHeight,audioBytes:v.webkitAudioDecodedByteCount||0};})()");
    assert(info.muted&&info.defaultMuted&&info.loop&&info.autoplay&&info.inline&&!info.controls);assert(!info.paused);assert.equal(info.width,1280);assert.equal(info.height,720);assert.equal(info.audioBytes,0);
    const before=info.time;await pause(900);assert(await evaluate("document.querySelector('video').currentTime")>before,'Video frames advance');
    await evaluate("document.querySelector('video').currentTime=11.7");await pause(1400);assert(await evaluate("document.querySelector('video').currentTime")<5,'Playback repeats at the end');
    await evaluate('window.scrollTo(0,document.body.scrollHeight)');await pause(500);assert(await evaluate("document.querySelector('video').paused"),'Offscreen video pauses');
    await evaluate('window.scrollTo(0,0)');await pause(600);assert(!await evaluate("document.querySelector('video').paused"),'Visible video resumes');
    console.log('PASS silent autoplay background video, real frames and looping at '+width+'px');
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await visit('/fr');assert(await evaluate("document.querySelector('video').paused"),'Reduced motion pauses the video');assert.equal(await evaluate("getComputedStyle(document.querySelector('video')).display"),'none');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS reduced-motion poster fallback. No customer/order interaction.');

}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser.pid) { try { execFileSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* Browser already stopped. */ } }
  await pause(500);
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('bren-seo-browser-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
});
