// Entire database and authentication mocked: no external requests or real writes.
const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('assert/strict');
const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ADMIN = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
let rows = [{ id: 'b-message', user_id: B, sender_kind: 'customer', body: 'Private B', locale: 'de', created_at: '2026-10-11T12:00:00Z' }];
let active, blocked = false, dbFailure = false;
const db = {
  auth: { getUser: async token => { active = ['A','UNCONFIRMED'].includes(token) ? A : token === 'B' ? B : token === 'ADMIN' ? ADMIN : null; return { data: { user: active ? { id: active, email_confirmed_at: token === 'UNCONFIRMED' ? null : '2026-10-01' } : null }, error: !active }; } },
  from: table => {
    let filters = [], max = Infinity;
    const query = {
      select() { return this; }, eq(key, value) { filters.push([key,value]); return this; }, order() { return this; }, limit(n) { max = n; return this; },
      maybeSingle: async () => ({ data: active === ADMIN ? { role: 'admin' } : null, error: null }),
      insert: async payload => { rows.push({ ...payload, id: 'new', created_at: '2026-10-11T13:00:00Z' }); return { error: dbFailure ? {} : null }; },
      then(resolve, reject) { return Promise.resolve({ data: rows.filter(row => filters.every(([k,v]) => row[k] === v)).slice(0,max), error: dbFailure ? {} : null }).then(resolve,reject); },
    }; return query;
  },
};
const moduleMock = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('app/api/support/route.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const localRequire = name => name === '@supabase/supabase-js' ? { createClient: () => db } : name === '@/lib/api-security' ? {
  BodyLimitError: class BodyLimitError extends Error {},
  protectApi: async req => blocked || req.headers.get('origin') === 'https://evil.invalid' ? new Response('{}', { status: 403 }) : null,
  readLimitedJson: req => req.json(),
} : require(name);
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(localRequire,moduleMock,moduleMock.exports);
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.invalid'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-only';
const api = moduleMock.exports;
function request(token, query = '', body) { return new Request('https://mock.invalid/api/support'+query, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: 'Bearer '+token } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
(async()=>{
  assert.equal((await api.GET(request())).status,401);
  assert.equal((await api.GET(request('invalid'))).status,401);
  assert.equal((await api.GET(request('UNCONFIRMED'))).status,401);
  assert.equal((await api.GET(request('A','?user_id='+B))).status,403,'A cannot read B');
  assert.equal((await api.POST(request('A','',{user_id:B,body:'overwrite',locale:'de'}))).status,403,'A cannot write to B');
  assert.equal((await api.GET(request('A','?inbox=1'))).status,403,'customer cannot access admin inbox');
  assert.deepEqual((await(await api.GET(request('A'))).json()).messages,[]);
  const before = rows.length;
  assert.equal((await api.POST(request('A','',{body:'<script>alert(1)</script>',locale:'fr',sender_kind:'admin',sender_id:ADMIN}))).status,201);
  assert.equal(rows.length,before+1); assert.equal(rows.at(-1).sender_kind,'customer'); assert.equal(rows.at(-1).sender_id,A); assert.equal(rows.at(-1).user_id,A);
  assert((await(await api.GET(request('A'))).json()).messages.every(row=>row.user_id===A));
  assert((await(await api.GET(request('B'))).json()).messages.every(row=>row.user_id===B));
  assert.equal((await api.GET(request('ADMIN','?inbox=1'))).status,200);
  assert((await (await api.GET(request('ADMIN','?inbox=1'))).json()).threads.some(row=>row.user_id===A),'Saved customer message appears in administrator inbox');
  assert.equal((await api.POST(request('ADMIN','',{user_id:B,body:'Reply',locale:'de'}))).status,201);
  assert.equal(rows.at(-1).sender_kind,'admin'); assert.equal(rows.at(-1).sender_id,ADMIN);
  for(const body of [{body:'',locale:'de'},{body:'x'.repeat(3001),locale:'de'},{body:'ok',locale:'xx'},{body:'ok',locale:['de']},{body:'ok',locale:'de',user_id:'invalid'}]) assert.equal((await api.POST(request('A','',body))).status,400);
  blocked=true; assert.equal((await api.POST(request('A','',{body:'ok',locale:'de'}))).status,403); blocked=false;
  dbFailure=true; assert.equal((await api.GET(request('A'))).status,503); dbFailure=false;
  const sql=fs.readFileSync('supabase-support.sql','utf8'); assert(sql.includes('enable row level security')); assert(sql.includes('revoke all on public.support_messages from public,anon,authenticated')); assert(sql.includes('user_id = auth.uid() or public.current_user_is_admin()'));
  console.log('Support API tests passed: A/B isolation, role checks, forged sender ignored, validation, unavailable service, quota rejection. SQL inspected statically; live RLS not tested.');
})().catch(e=>{console.error(e);process.exitCode=1});
