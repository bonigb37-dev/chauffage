// Isolated database tests; never alters production orders.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('fs'),assert=require('assert/strict');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async()=>{
  const db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table admin_roles(user_id uuid primary key,role text);
    create function current_user_is_admin() returns boolean language sql stable security definer as $$ select exists(select 1 from admin_roles where user_id=auth.uid() and role in ('admin','super_admin','owner')) $$;
    create table order_requests(id bigint primary key,reference text,status text,payment_status text,created_at timestamptz default now());
    create table order_lines(order_id bigint references order_requests(id) on delete cascade);
    create table admin_audit_log(actor_user_id uuid,actor_role text,action text,entity text,entity_id text,details jsonb);
    grant usage on schema auth to authenticated;
    grant select on order_requests to authenticated;
    grant update(status) on order_requests to authenticated;
    insert into order_requests(id,reference,status,payment_status) values(1,'TEST-ORDER','done','confirmed');
    insert into order_lines values(1);`);
  const audit=fs.readFileSync('supabase-admin.sql','utf8').match(/create or replace function public\.write_admin_audit\(\)[\s\S]*?end \$\$;/)[0];
  await db.exec(audit);
  const migration=fs.readFileSync('supabase-order-archives.sql','utf8');
  await db.exec(migration);await db.exec(migration);
  for(let n=1;n<=4;n++)await db.query('insert into auth.users values($1)',[id(n)]);
  for(const [n,role] of [[1,'admin'],[2,'super_admin'],[3,'owner']])await db.query('insert into admin_roles values($1,$2)',[id(n),role]);
  await db.exec('set role anon');await assert.rejects(db.query('select set_order_archived(1,true)'),/permission denied/);
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id(4)]);
  await assert.rejects(db.query('select set_order_archived(1,true)'),/Administrator access required/);
  await assert.rejects(db.query('update order_requests set archived_at=now() where id=1'),/permission denied/);
  for(const n of [1,2,3]) {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id(n)]);
    assert.equal((await db.query('select set_order_archived(1,true) as ok')).rows[0].ok,true);
    let order=(await db.query('select * from order_requests where id=1')).rows[0];assert(order.archived_at);assert.equal(order.archived_by,id(n));assert.equal(order.payment_status,'confirmed');
    await db.query('select set_order_archived(1,true)');
    await db.query('select set_order_archived(1,false)');
    order=(await db.query('select * from order_requests where id=1')).rows[0];assert.equal(order.archived_at,null);assert.equal(order.archived_by,null);
  }
  await assert.rejects(db.query('select set_order_archived(999,true)'),/Order not found/);
  await assert.rejects(db.query('select set_order_archived(1,null)'),/Invalid order archive request/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*) as n from order_lines')).rows[0].n,1);
  assert.equal((await db.query('select count(*) as n from admin_audit_log')).rows[0].n,6);
  await db.close();console.log('PASS migration/idempotency, admin/super-admin/owner archive and restore, denied customer/public access, restricted direct updates, preserved payments/lines and audit trail.');
})().catch(error=>{console.error(error);process.exit(1)});
