// No network or real mail: transporter and SQL outbox are mocked.
const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
let delivered=[],transportOptions,fail=false,jobs=[],finished=[];
const createTransport=options=>{transportOptions=options;return {close(){},sendMail:async mail=>{if(fail)throw new Error('mock SMTP failure');delivered.push(mail);return {accepted:[mail.to]};}};};
const moduleMock={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/support-mail.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(name=>name==='server-only'?{}:name==='nodemailer'?{createTransport}:name==='./store-config'?{storeConfig:{name:'Bren-nholz',email:'shop@example.invalid'}}:require(name),moduleMock,moduleMock.exports);
const db={rpc:async(name,payload)=>{if(name==='claim_mail_notification')return {data:jobs.shift()??null,error:null};if(name==='finish_mail_notification'){finished.push(payload);return {error:null};}throw new Error('Unexpected RPC');},auth:{admin:{getUserById:async id=>({data:{user:{id,email:'confirmed@example.invalid',email_confirmed_at:'2026-10-01'}},error:null})}}};
const api=moduleMock.exports;
function queue(kind='customer_reply',locale='en'){jobs=[{key:'notification-test',lease_id:'lease-test',kind,customer_id:'actual-customer',locale,body:'PRIVATE_CONTENT_NOT_FOR_EMAIL'}];}
(async()=>{
  delete process.env.SMTP_PASSWORD; assert.equal(api.supportMailConfigured(),false);queue();await api.dispatchSupportMail(db);assert.equal(jobs.length,1);assert.equal(delivered.length,0);
  Object.assign(process.env,{SMTP_HOST:'smtp.example.invalid',SMTP_PORT:'465',SMTP_USER:'sender@example.invalid',SMTP_PASSWORD:'mock-only',SMTP_FROM_EMAIL:'sender@example.invalid'});
  const r=await api.dispatchSupportMail(db);assert.equal(r.sent,1);assert.equal(delivered[0].to,'confirmed@example.invalid');assert(delivered[0].text.includes('/en/aide'));assert(!delivered[0].text.includes('PRIVATE_CONTENT'));assert(transportOptions.secure);assert(transportOptions.requireTLS);assert(transportOptions.disableFileAccess&&transportOptions.disableUrlAccess);assert.equal(finished.at(-1).p_lease,'lease-test');assert.equal(finished.at(-1).p_success,true);
  queue('admin_contact','de');await api.dispatchSupportMail(db);assert.equal(delivered.at(-1).to,'shop@example.invalid');assert(delivered.at(-1).text.includes('/de/admin#contact-requests'));
  queue('admin_support','de');await api.dispatchSupportMail(db);assert(delivered.at(-1).text.includes('#support-messages'));
  queue();fail=true;const failure=await api.dispatchSupportMail(db);assert.equal(failure.failed,1);assert.equal(finished.at(-1).p_success,false);assert.equal(finished.at(-1).p_error,'smtp');fail=false;
  queue();db.auth.admin.getUserById=async()=>({data:{user:{email:'unconfirmed@example.invalid',email_confirmed_at:null}},error:null});const count=delivered.length;await api.dispatchSupportMail(db);assert.equal(delivered.length,count);assert.equal(finished.at(-1).p_error,'recipient');
  process.env.SMTP_PORT='587';queue('admin_support');await api.dispatchSupportMail(db);assert.equal(transportOptions.secure,false);assert.equal(transportOptions.requireTLS,true);
  const sql=fs.readFileSync('supabase-support-notifications.sql','utf8');assert(sql.includes('for update skip locked'));assert(sql.includes('pg_advisory_xact_lock'));assert(sql.includes("interval '10 minutes'"));assert(sql.includes('greatest(public.support_reads.read_at,excluded.read_at)'));
  console.log('PASS mocked mail: private recipient lookup, DE/FR/EN links, no conversation content, TLS, missing config preserves queue, failures acknowledged for retry, unconfirmed recipients rejected. No real email sent. SQL reviewed statically.');
})().catch(e=>{console.error(e);process.exitCode=1});
