// Isolated PostgreSQL and API tests: no production connection or real visitor data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
function load(file, imports = {}) {
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',code)(name=>imports[name]??require(name),module,module.exports);
  return module.exports;
}
const analytics = load('lib/analytics.ts');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const event = (n, session=1, kind='page_view', extra={})=>({id:id(n),session_id:id(session),page_id:id(session+100),kind,path:'/produits',section:'',seconds:0,locale:'de',device:'mobile',source:'direct',...extra});
(async()=>{
  assert.equal(analytics.analyticsPath('/de/produits?email=private@example.invalid'),'/produits');
  for(const path of ['/de/admin','/fr/super-admin','/api/support','/en/compte','/aide']) assert.equal(analytics.analyticsPath(path),null);
  assert.equal(analytics.validateAnalyticsEvents([{...event(1),path:'/produits?email=secret'}]),null);
  assert.equal(analytics.validateAnalyticsEvents([{...event(1),path:'/admin'}]),null);
  assert.equal(analytics.validateAnalyticsEvents([{...event(1),kind:'unknown'}]),null);
  assert.equal(analytics.validateAnalyticsEvents([event(1,1),event(2,2)]),null);
  assert.equal(analytics.validateAnalyticsEvents([{...event(1),seconds:30}]),null);
  assert(!Object.hasOwn(analytics.validateAnalyticsEvents([{...event(1),user_id:id(999),body:'secret'}])[0],'user_id'));

  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create table public.client_accounts(user_id uuid primary key,full_name text,email text);');
  const migration=fs.readFileSync('supabase-analytics.sql','utf8');
  await db.exec(migration); await db.exec(migration);
  await db.query('insert into auth.users(id) values($1)',[id(999)]);
  await db.query('insert into client_accounts values($1,$2,$3)',[id(999),'Consenting Customer','test@example.invalid']);
  const batch = [event(1),event(2,1,'section_view',{section:'products'}),event(3,1,'engagement',{seconds:30}),event(4,1,'cart_add')];
  await db.query('select record_analytics_events($1::jsonb,$2,$3)',[JSON.stringify(batch),id(999),analytics.analyticsConsentVersion]);
  await db.query('select record_analytics_events($1::jsonb,$2,$3)',[JSON.stringify(batch),id(999),analytics.analyticsConsentVersion]);
  await db.query('select record_analytics_events($1::jsonb,null,$2)',[JSON.stringify([event(5,2),event(6,2,'page_view',{path:'/contact'})]),analytics.analyticsConsentVersion]);
  let report=(await db.query('select analytics_dashboard(30,0) as report')).rows[0].report;
  assert.equal(report.totals.visits,2); assert.equal(report.totals.views,3); assert.equal(report.totals.customers,1); assert.equal(report.totals.seconds,30);
  assert.equal(report.daily.length,30); assert.equal(report.pages.find(row=>row.path==='/produits').views,2); assert.equal(report.sections[0].section,'products');
  assert.equal(report.actions[0].total,1); assert.equal(report.funnel.cart,1); assert.equal(report.sessions.find(row=>row.user_id).customer_name,'Consenting Customer');
  assert.equal((await db.query('select analytics_dashboard(30,50) as report')).rows[0].report.sessions.length,0);
  const journey=(await db.query('select analytics_session_journey($1,30) as journey',[id(1)])).rows[0].journey;
  assert.equal(journey.events.length,3); assert(!journey.events.some(row=>row.kind==='engagement'));
  await db.exec('update analytics_events set created_at=now()-interval \'91 days\'; update analytics_maintenance set purged_at=\'-infinity\';');
  await db.query('select record_analytics_events($1::jsonb,null,$2)',[JSON.stringify([event(7,3)]),analytics.analyticsConsentVersion]);
  assert.equal((await db.query('select count(*) as total from analytics_events')).rows[0].total,1);
  await db.exec('set role anon');
  await assert.rejects(db.query('select * from analytics_events'),/permission denied/);
  await assert.rejects(db.query('select analytics_dashboard(30,0)'),/permission denied/);
  await db.exec('reset role; set role authenticated');
  await assert.rejects(db.query('select * from analytics_events'),/permission denied/);
  await db.exec('reset role'); await db.close();

  let writes = 0, rpcArgs, activeRole = null;
  const apiDb = {auth:{getUser:async token=>({data:{user:token==='valid'?{id:id(999),email_confirmed_at:'2026-01-01'}:null},error:token!=='valid'})},from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:activeRole?{role:activeRole}:null,error:null})}),rpc:async(name,args)=>{if(name==='record_analytics_events'){writes++;rpcArgs=args}return {data:{totals:{}},error:null}}};
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://mock.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
  const api=load('app/api/analytics/route.ts',{'@supabase/supabase-js':{createClient:()=>apiDb},'@/lib/analytics':analytics,'@/lib/api-security':{protectApi:async()=>null,readLimitedJson:request=>request.json(),BodyLimitError:class extends Error{}}});
  const request=(method='GET',body,token)=>new Request('https://test.invalid/api/analytics',{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal((await api.GET(request())).status,401);
  assert.equal((await api.GET(request('GET',null,'valid'))).status,403);
  assert.equal((await api.POST(request('POST',{events:[event(1)]}))).status,400);
  assert.equal((await api.POST(request('POST',{consent:analytics.analyticsConsentVersion,events:[event(1)]}))).status,200);
  assert.equal(rpcArgs.p_user_id,null);
  assert.equal((await api.POST(request('POST',{consent:analytics.analyticsConsentVersion,events:[{...event(2),user_id:id(888)}]},'valid'))).status,200);
  assert.equal(rpcArgs.p_user_id,id(999),'Linked identity is verified, never taken from payload');
  activeRole='owner'; const previousWrites=writes;
  assert.equal((await api.POST(request('POST',{consent:analytics.analyticsConsentVersion,events:[event(3)]},'valid'))).status,200);
  assert.equal(writes,previousWrites,'Administrator visits are excluded');
  assert.equal((await api.GET(request('GET',null,'valid'))).status,200);
  console.log('PASS analytics: PostgreSQL migration/idempotency, complete aggregates, journeys, pagination, deduplication, retention, database permissions, consent, role checks, verified account identity and admin exclusion.');
})().catch(error=>{console.error(error);process.exitCode=1});
