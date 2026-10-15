/* All database, authentication and Storage operations below are mocked. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const cache = new Map();
let mockDb;
const persistentQuotas = new Map();
let quotaFailure = false;
async function mockQuota(payload) {
  if (quotaFailure) return { data: null, error: new Error('mock unavailable') };
  const used = (persistentQuotas.get(payload.p_key) ?? 0) + 1;
  persistentQuotas.set(payload.p_key, used);
  return { data: [{ allowed: used <= payload.p_limit, retry_after: payload.p_window_seconds }], error: null };
}
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = name => name === 'server-only' ? {} : name === '@/lib/support-mail' ? { dispatchSupportMail:async()=>({configured:false,sent:0,failed:0}) } : name === '@supabase/supabase-js' ? { createClient: () => new Proxy(mockDb ?? {}, { get(target, key) {
    return key === 'rpc' ? (name, payload) => name === 'consume_api_rate_limit' ? mockQuota(payload) : target.rpc(name, payload) : target[key];
  } }) } : name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : name.startsWith('./') ? load(path.join(path.dirname(file), name) + '.ts') : require(name);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
}
async function run() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-private';
  const { protectApi, readLimitedJson, BodyLimitError } = load('lib/api-security.ts');
  const request = (headers = {}) => new Request('https://shop.invalid/api/security-test', { method: 'POST', headers, body: '{}' });
  assert.equal((await protectApi(request({ origin: 'https://evil.invalid' }), 2)).status, 403);
  assert.equal((await protectApi(request({ 'sec-fetch-site': 'cross-site' }), 2)).status, 403);
  assert.equal((await protectApi(request({ origin: 'null' }), 2)).status, 403);
  assert.equal(await protectApi(request({ origin: 'https://shop.invalid' }), 2), null);
  assert.equal(await protectApi(request({ 'x-forwarded-for': 'fake-1' }), 2), null);
  // A second loaded module represents a new serverless instance. It uses the
  // same mock database quota rather than resetting a module-local counter.
  cache.delete(path.resolve('lib/api-security.ts'));
  const otherInstance = load('lib/api-security.ts');
  const limited = await otherInstance.protectApi(request({ 'x-forwarded-for': 'fake-2' }), 2);
  assert.equal(limited.status, 429); assert(limited.headers.get('retry-after'));
  quotaFailure = true;
  assert.equal(await protectApi(request(), 2), null, 'Quota database outage falls back gracefully to in-memory rate limiting');
  quotaFailure = false;
  assert.deepEqual(await readLimitedJson(request(), 10), {});
  await assert.rejects(readLimitedJson(new Request('https://shop.invalid', { method: 'POST', body: 'x'.repeat(1000), headers: { 'content-length': '1' } }), 20), BodyLimitError);
  const { paymentProofToken, validPaymentProofToken, proofValidityMs } = load('lib/payment-proof-token.ts');
  const now = Date.now(), reference = 'TP-123456789ABC';
  const token = paymentProofToken(reference, 'mock-private', now);
  assert(validPaymentProofToken(reference, token, 'mock-private', now));
  assert(!validPaymentProofToken('TP-999999999999', token, 'mock-private', now));
  assert(!validPaymentProofToken(reference, token, 'wrong-key', now));
  assert(!validPaymentProofToken(reference, token, 'mock-private', now + proofValidityMs));
  assert(!validPaymentProofToken(reference, token.replace(/^\d+/, '9999999999'), 'mock-private', now));
  const configCode = ts.transpileModule(fs.readFileSync('next.config.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const checkConfig = env => vm.runInNewContext(configCode, { exports: {}, process: { env }, Buffer, require });
  assert.throws(() => checkConfig({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_mock_private' }));
  assert.throws(() => checkConfig({ NEXT_PUBLIC_SERVICE_ROLE_KEY: 'mock' }));
  const privateJwt = 'header.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.signature';
  assert.throws(() => checkConfig({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: privateJwt }));
  assert.doesNotThrow(() => checkConfig({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_mock' }));
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'mock-public';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-private';
  let saved;
  mockDb = { from: () => ({ insert: async value => { saved = value; return { error: null }; } }) };
  const contact = load('app/api/contact/route.ts');
  const submit = body => contact.POST(new Request('https://shop.invalid/api/contact', { method: 'POST', body: JSON.stringify(body) }));
  const body = { name: 'Test client', email: 'test@example.invalid', subject: 'quote', message: '<script>alert(1)</script>', status: 'done', id: 999 };
  assert.equal((await submit({ ...body, email: 'invalid' })).status, 400); assert.equal(saved, undefined);
  assert.equal((await submit({ ...body, subject: 'untrusted' })).status, 400); assert.equal(saved, undefined);
  assert.equal((await submit(body)).status, 201);
  assert.equal(saved.status, undefined); assert.equal(saved.id, undefined);
  assert.equal(saved.message, body.message, 'Stored as text; React renders messages escaped');
  const proof = load('app/api/payment-proof/route.ts');
  const getProof = () => proof.GET(new Request('https://shop.invalid/api/payment-proof?reference='+reference, { headers: { authorization: 'Bearer test' } }));
  let signed = false;
  mockDb = { auth: { getUser: async () => ({ error: new Error('invalid'), data: { user: null } }) } };
  assert.equal((await getProof()).status, 401);
  mockDb = { auth: { getUser: async () => ({ data: { user: { id: 'test-user' } } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }), storage: { from: () => ({ createSignedUrl: async () => { signed = true; return { data: { signedUrl: 'mock' } }; } }) } };
  assert.equal((await getProof()).status, 403); assert.equal(signed, false);
  mockDb.from = () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'owner' }, error: null }) }) }) });
  assert.equal((await getProof()).status, 200); assert.equal(signed, true);
  mockDb = { from: () => ({ select: field => ({ eq: () => ({ maybeSingle: async () => ({ data: field === 'id' ? { id: 1 } : { created_at: new Date(now - proofValidityMs - 1000).toISOString() }, error: null }) }) }) }) };
  const form = new FormData();
  form.set('reference', reference);
  form.set('token', require('node:crypto').createHmac('sha256', 'mock-private').update('payment-proof:'+reference).digest('hex'));
  form.set('file', new Blob([Buffer.from([137,80,78,71,13,10,26,10])], { type:'image/png' }), 'proof.png');
  assert.equal((await proof.POST(new Request('https://shop.invalid/api/payment-proof', { method:'POST',body:form }))).status, 403, 'Old legacy proof cannot overwrite storage');
  const checkout = load('app/api/checkout/route.ts');
  let written = false;
  mockDb = { from: () => ({ select: () => ({ in: async () => ({ data: [], error: null }) }) }), auth: { getUser: async () => ({ error: new Error('invalid token'), data: { user: null } }) }, rpc: async () => { written = true; } };
  const order = { customer: { firstName:'Test',lastName:'Client',street:'Teststrasse 1',postalCode:'66663',city:'Merzig',email:'test@example.invalid' }, acceptedTerms:true, userId:'forged', items:[{productId:2,quantity:1,unitPriceCents:49900}] };
  assert.equal((await checkout.POST(new Request('https://shop.invalid/api/checkout', { method:'POST',headers:{authorization:'Bearer forged'},body:JSON.stringify(order) }))).status, 401);
  assert.equal(written, false);
  const health = load('app/api/security-check/route.ts');
  let healthReads = 0;
  mockDb = { from: table => {
    assert.equal(table, 'order_requests');
    return { select: field => { assert.equal(field,'id'); return { limit: async size => {
      assert.equal(size,0); healthReads++; return { data: [], error: null };
    } }; } };
  } };
  const nonce = 'a'.repeat(32), stamp = String(Math.floor(Date.now()/1000));
  const checkRequest = (time, secret = 'mock-private') => new Request(`https://shop.invalid/api/security-check?timestamp=${time}&nonce=${nonce}`, {
    headers: { 'x-security-check-signature': require('node:crypto').createHmac('sha256',secret).update(`GET:/api/security-check:${time}:${nonce}`).digest('hex') },
  });
  assert.equal((await health.GET(checkRequest(stamp,'wrong-key'))).status,401); assert.equal(healthReads,0);
  assert.equal((await health.GET(checkRequest(String(Number(stamp)-120)))).status,401); assert.equal(healthReads,0);
  const matching = await health.GET(checkRequest(stamp));
  assert.equal(matching.status,200); assert.equal(healthReads,1);
  assert.deepEqual(await matching.json(),{ok:true,deploymentKeyMatches:true,backendReadVerified:true});
  const sql = fs.readFileSync('supabase-commerce.sql','utf8');
  assert(sql.includes('using (user_id = auth.uid()) with check (user_id = auth.uid())'));
  assert(sql.includes('using (user_id = auth.uid())'));
  assert(sql.includes('if not public.current_user_is_admin() then'));
  assert(sql.includes('from public, anon, authenticated'));
  console.log('OK security: cross-origin denial, burst limits, spoofed length/IP, expiring bound proof tokens, validated contact fields, forged session denied, admin proof authorization, SQL policy assertions. No live mutations.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
