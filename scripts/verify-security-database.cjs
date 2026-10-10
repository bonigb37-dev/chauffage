/* Real PostgreSQL engine, synthetic identities, local temporary database only.
 * auth.uid/role/jwt emulate Supabase claims; no real Auth accounts or emails. */
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const location = fs.mkdtempSync(path.join(os.tmpdir(), 'bren-security-db-'));
let db;
const users = {
  A: '00000000-0000-4000-8000-000000000001', B: '00000000-0000-4000-8000-000000000002',
  admin: '00000000-0000-4000-8000-000000000003', super: '00000000-0000-4000-8000-000000000004',
};
async function identity(name, role = 'authenticated') {
  await db.exec('reset role');
  const uid = users[name] ?? '';
  await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claim.role',$2,false), set_config('request.jwt.claims',$3,false)", [uid, role, JSON.stringify({ sub: uid, role, email: name ? `${name.toLowerCase()}@example.invalid` : '' })]);
  await db.exec(`set role ${role}`); // role is a fixed harness constant, not input.
}
async function root() { await db.exec('reset role'); }
async function denied(sql, values = []) {
  try { await db.query(sql, values); } catch (e) { assert.equal(e.code, '42501', e.message); return; }
  assert.fail('Unexpectedly allowed: ' + sql);
}
async function rows(sql, values = []) { return (await db.query(sql, values)).rows; }
async function run() {
  db = new PGlite(location);
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, created_at timestamptz default now(), raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true),'') $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create table storage.buckets(id text primary key, public boolean default false);
    create table storage.objects(id bigint generated always as identity primary key, bucket_id text references storage.buckets(id), name text);
    alter table storage.objects enable row level security;
    insert into storage.buckets(id,public) values('payment-proofs',true);
  `);
  for (const file of ['supabase-forms.sql','supabase-admin.sql','supabase-commerce.sql','supabase-security.sql']) await db.exec(fs.readFileSync(file,'utf8'));
  await db.exec(fs.readFileSync('supabase-security.sql','utf8')); // idempotence
  const metadata = await db.exec(fs.readFileSync('supabase-security-check.sql','utf8'));
  assert(metadata[0].rows.every(row => row.rls_enabled));
  assert(Object.values(metadata[1].rows[0]).every(value => value === true));
  // Supabase's privileged service role has table/sequence privileges. Recreate
  // that infrastructure grant in this disposable local harness only.
  await db.exec('grant all on all tables in schema public, storage to service_role; grant all on all sequences in schema public, storage to service_role; grant usage on schema storage to service_role');
  for (const [name,id] of Object.entries(users)) await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [id,`${name.toLowerCase()}@example.invalid`,JSON.stringify({ full_name: `Synthetic ${name}` })]);
  await db.query("insert into public.admin_roles(user_id,role) values($1,'admin'),($2,'super_admin')", [users.admin,users.super]);
  const orders = {}, addresses = {};
  for (const name of ['A','B']) {
    orders[name] = (await rows("insert into public.order_requests(reference,customer,items,total_cents,accepted_terms,user_id) values($1,'{}','[]',100,true,$2) returning id",[`TP-00000000000${name === 'A' ? '1' : '2'}`,users[name]]))[0].id;
    addresses[name] = (await rows("insert into public.customer_addresses(user_id,recipient_name,street,postal_code,city) values($1,$2,'Teststrasse 1','12345','Teststadt') returning id",[users[name],`Synthetic ${name}`]))[0].id;
    await db.query("insert into public.order_request_lines(order_request_id,product_id,product_name,quantity,unit_price_cents) values($1,2,'Synthetic product',1,100)",[orders[name]]);
    await db.query("insert into public.order_payment_events(order_request_id,event_type,note) values($1,'bank_transfer_reversed','Synthetic historical event')",[orders[name]]);
  }
  await db.exec("insert into public.contact_requests(name,email,subject,message) values('Synthetic','test@example.invalid','other','Local fixture')");
  for (const [name, other] of [['A','B'],['B','A']]) {
    await identity(name);
    assert.equal((await rows('select id from public.order_requests')).length,1);
    assert.equal((await rows('select id from public.order_requests where id=$1',[orders[other]])).length,0);
    assert.equal((await rows('select id from public.order_request_lines where order_request_id=$1',[orders[other]])).length,0);
    assert.equal((await rows('select id from public.order_payment_events where order_request_id=$1',[orders[other]])).length,0);
    assert.equal((await rows('select id from public.customer_addresses where user_id=$1',[users[other]])).length,0);
    assert.equal((await rows('select user_id from public.client_accounts')).length,1);
    assert.equal((await rows('select user_id from public.client_accounts where user_id=$1',[users[other]])).length,0);
    assert.equal((await rows('select id from public.contact_requests')).length,0);
    assert.equal((await rows("update public.customer_addresses set city='Forbidden' where id=$1 returning id",[addresses[other]])).length,0);
    assert.equal((await rows('delete from public.customer_addresses where id=$1 returning id',[addresses[other]])).length,0);
    await denied('update public.customer_addresses set user_id=$1 where id=$2',[users[other],addresses[name]]);
    await denied("insert into public.customer_addresses(user_id,recipient_name,street,postal_code,city) values($1,'Bad','Test','12345','Test')",[users[other]]);
    assert.equal((await rows("update public.customer_addresses set city='Allowed' where id=$1 returning id",[addresses[name]])).length,1);
    assert.equal((await rows("update public.order_requests set status='done' where id=$1 returning id",[orders[other]])).length,0);
    await denied("update public.order_requests set payment_status='confirmed' where id=$1",[orders[name]]);
    await denied("update public.order_requests set total_cents=1 where id=$1",[orders[name]]);
    await denied("insert into public.order_requests(reference,customer,items,total_cents,accepted_terms,user_id) values('TP-999999999999','{}','[]',1,true,$1)",[users[name]]);
    await denied("insert into public.contact_requests(name,email,subject,message) values('Bad','bad@example.invalid','other','Bypass API')");
    await denied('select public.confirm_bank_transfer($1,$2)',[orders[other],'Forged payment']);
    await denied("insert into public.admin_roles(user_id,role) values($1,'super_admin')",[users[name]]);
    await denied("insert into public.product_overrides(product_id,data) values(999,'{}')");
    assert.equal((await rows("update public.site_settings set value='{}' where key='bank_transfer' returning key")).length,0);
    await denied("select public.create_order_request_atomic('TP-999999999999','{}',null,'[]',100,null)");
    await denied('select * from public.consume_api_rate_limit($1,2,60)',['a'.repeat(64)]);
    await denied('select * from bren_security.api_rate_limits');
    console.log(`OK SQL ${name}: own reads/edits allowed; ${other}'s orders, lines, events, address/account blocked; admin/payment/API bypass refused.`);
  }
  await identity(null,'anon');
  await denied('select * from public.order_requests');
  await denied('select * from public.admin_roles');
  await denied('select * from public.consume_api_rate_limit($1,2,60)',['a'.repeat(64)]);
  await identity('admin');
  assert.equal((await rows('select id from public.order_requests')).length,2);
  assert.equal((await rows("update public.order_requests set status='in_progress' where id=$1 returning id",[orders.B])).length,1);
  await denied("update public.order_requests set payment_status='confirmed' where id=$1",[orders.B]);
  await denied("insert into public.admin_roles(user_id,role) values($1,'super_admin')",[users.A]);
  // Simulate a proof object stored by the privileged backend. No payment
  // mutation occurs; confirm_bank_transfer is the sole tested confirmation.
  await identity(null,'service_role');
  await db.query("insert into storage.objects(bucket_id,name) values('payment-proofs',$1)",[`TP-000000000002/proof`]);
  assert.equal((await rows('select payment_status from public.order_requests where id=$1',[orders.B]))[0].payment_status,'pending');
  await identity('admin');
  await db.query('select public.confirm_bank_transfer($1,$2)',[orders.B,'Synthetic verified receipt of funds']);
  await db.query('select public.confirm_bank_transfer($1,$2)',[orders.B,'Repeat request']);
  assert.equal((await rows('select payment_status from public.order_requests where id=$1',[orders.B]))[0].payment_status,'confirmed');
  assert.equal((await rows("select id from public.order_payment_events where order_request_id=$1 and event_type='bank_transfer_confirmed'",[orders.B])).length,1);
  await identity('super');
  await denied("insert into public.admin_roles(user_id,role) values($1,'owner')",[users.A]);
  await db.query("insert into public.admin_roles(user_id,role) values($1,'admin')",[users.A]);
  console.log('OK SQL admin/super: status editing and role-controlled confirmation preserved; uploaded proof stays pending; confirmation audited/idempotent; owner escalation denied.');
  await identity(null,'service_role');
  const key = 'a'.repeat(64);
  const quota = async (hash=key, limit=2) => (await rows('select * from public.consume_api_rate_limit($1,$2,600)',[hash,limit]))[0];
  assert.equal((await quota()).allowed,true); assert.equal((await quota()).allowed,true); assert.equal((await quota()).allowed,false);
  await db.close(); db = new PGlite(location); await identity(null,'service_role');
  assert.equal((await quota()).allowed,false,'Quota persists after database/application restart');
  await root(); await db.query("update bren_security.api_rate_limits set expires_at=now()-interval '1 second' where key_hash=$1",[key]);
  await identity(null,'service_role'); assert.equal((await quota()).allowed,true,'Expired quota resets');
  const attempts = await Promise.all(Array.from({length:8},()=>quota('b'.repeat(64),3)));
  assert.equal(attempts.filter(x=>x.allowed).length,3);
  assert.equal(attempts.filter(x=>!x.allowed).length,5);
  await root();
  assert.equal((await rows("select public from storage.buckets where id='payment-proofs'"))[0].public,false);
  console.log('OK persistent quota: server-only RPC, atomic accounting, window reset and restart persistence. Real local PostgreSQL; claims emulated; no live Supabase accounts/data.');
}
run().catch(e=>{ console.error(e.message);process.exitCode=1; }).finally(async()=>{
  if(db) await db.close();
  const resolved=path.resolve(location);
  if(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('bren-security-db-'))fs.rmSync(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:500});
});
