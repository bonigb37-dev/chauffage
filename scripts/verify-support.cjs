// Entire database and authentication mocked: no external requests or real writes.
const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('assert/strict');
const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ADMIN = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
let rows = [{ id: 'b-message', user_id: B, sender_kind: 'customer', body: 'Private B', locale: 'de', created_at: '2026-10-11T12:00:00Z' }];
let active, blocked = false, dbFailure = false; const stored = new Map();
const db = {
  storage: {from:()=>({upload:async(path,bytes)=>{stored.set(path,bytes);return {error:null};},remove:async paths=>{paths.forEach(p=>stored.delete(p));return {error:null};},download:async path=>({data:stored.has(path)?new Blob([stored.get(path)]):null,error:!stored.has(path)}) })},
  rpc: async (name,payload) => name==='support_notification_counts' ? { data: {support:1,contacts:0,threads:[{user_id:A,unread:1}]},error:null } : {data:null,error:null},
  auth: { getUser: async token => { active = ['A','UNCONFIRMED'].includes(token) ? A : token === 'B' ? B : token === 'ADMIN' ? ADMIN : null; return { data: { user: active ? { id: active, email_confirmed_at: token === 'UNCONFIRMED' ? null : '2026-10-01' } : null }, error: !active }; } },
  from: table => {
    let filters = [], max = Infinity;
    const query = {
      select() { return this; }, eq(key, value) { filters.push([key,value]); return this; }, order() { return this; }, limit(n) { max = n; return this; },
      maybeSingle: async () => ({ data: table === 'admin_roles' ? (active === ADMIN ? { role: 'admin' } : null) : rows.find(row=>filters.every(([k,v])=>row[k]===v)) ?? null, error: null }),
      insert: async payload => { rows.push({ ...payload, id: 'new', created_at: '2026-10-11T13:00:00Z' }); return { error: dbFailure ? {} : null }; },
      then(resolve, reject) { return Promise.resolve({ data: rows.filter(row => filters.every(([k,v]) => row[k] === v)).slice(0,max), error: dbFailure ? {} : null }).then(resolve,reject); },
    }; return query;
  },
};
const moduleMock = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('app/api/support/route.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const attachmentModule = {exports:{}}; const attachmentCode = ts.transpileModule(fs.readFileSync('lib/support-attachments.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; vm.runInThisContext(`(function(require,module,exports){${attachmentCode}\n})`)(require,attachmentModule,attachmentModule.exports);
const localRequire = name => name === '@/lib/support-attachments' ? attachmentModule.exports : name === '@/lib/support-mail' ? { dispatchSupportMail: async()=>({configured:false,sent:0,failed:0}), supportMailConfigured:()=>false } : name === '@supabase/supabase-js' ? { createClient: () => db } : name === '@/lib/api-security' ? {
  BodyLimitError: class BodyLimitError extends Error {},
  protectApi: async req => blocked || req.headers.get('origin') === 'https://evil.invalid' ? new Response('{}', { status: 403 }) : null,
  readLimitedJson: req => req.json(), readLimitedBody: async req => new Uint8Array(await req.arrayBuffer()),
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
  assert.equal((await api.POST(request('A','',{action:'retry_mail'}))).status,403,'customer cannot dispatch notifications');
  const deniedRead=request('A','',{user_id:B,message_id:'dddddddd-dddd-dddd-dddd-dddddddddddd'});
  assert.equal((await api.PATCH(new Request(deniedRead,{method:'PATCH'}))).status,403,'customer cannot mark another conversation read');
  assert.equal((await api.GET(request('A','?notifications=1'))).status,200);
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
  const multipart = (token,bytes,type='application/pdf',target) => { const form = new FormData();form.set('body','Attached document');form.set('locale','de');form.set('file',new Blob([bytes],{type}),'document.pdf');if(target)form.set('user_id',target);return new Request('https://mock.invalid/api/support',{method:'POST',headers:{Authorization:'Bearer '+token},body:form});};
  assert.equal((await api.POST(multipart('A','%PDF-1.7 test'))).status,201,'Valid PDF saved');
  const attached=rows.at(-1);assert.equal(attached.user_id,A);assert.equal(stored.size,1);assert.equal(attached.attachment_type,'application/pdf');
  attached.id='eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const download=await api.GET(request('A','?attachment='+attached.id));assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/^attachment;/);assert.equal(await download.text(),'%PDF-1.7 test');
  assert.equal((await api.GET(request('B','?attachment='+attached.id))).status,403,'B cannot download A file');
  assert.equal((await api.GET(request('ADMIN','?attachment='+attached.id))).status,200,'Admin can download');
  assert.equal((await api.GET(request('', '?attachment='+attached.id))).status,401);
  assert.equal((await api.POST(multipart('A','<script>bad</script>'))).status,400,'Forged PDF rejected');
  assert.equal((await api.POST(multipart('A','%PDF-1.7','image/png'))).status,400,'MIME mismatch rejected');
  assert.equal((await api.POST(multipart('A','%PDF-1.7','application/pdf',B))).status,403,'Cannot attach to B');
  assert.equal((await api.POST(multipart('A',Buffer.alloc(3145729)))).status,400,'Oversize file rejected');
  const count=stored.size;dbFailure=true;assert.equal((await api.POST(multipart('A','%PDF-1.7 orphan'))).status,503);assert.equal(stored.size,count,'Upload cleaned when message save fails');dbFailure=false;
  blocked=true; assert.equal((await api.POST(request('A','',{body:'ok',locale:'de'}))).status,403); blocked=false;
  dbFailure=true; assert.equal((await api.GET(request('A'))).status,503); dbFailure=false;
  const sql=fs.readFileSync('supabase-support.sql','utf8'); assert(sql.includes('enable row level security')); assert(sql.includes('revoke all on public.support_messages from public,anon,authenticated')); assert(sql.includes('user_id = auth.uid() or public.current_user_is_admin()'));
  console.log('Support API tests passed: A/B isolation, role checks, forged sender ignored, validation, unavailable service, quota rejection. SQL inspected statically; live RLS not tested.');
})().catch(e=>{console.error(e);process.exitCode=1});
