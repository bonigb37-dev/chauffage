// Isolated in-memory PostgreSQL test. No remote database or customer records.
const assert=require('node:assert/strict');const fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
(async()=>{const db=new PGlite();try{
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create function auth.role() returns text language sql as $$ select 'service_role'::text $$;
create table public.product_overrides(product_id integer primary key,data jsonb,is_deleted boolean default false,updated_at timestamptz);
create table public.order_requests(id bigint generated always as identity primary key,reference text,customer jsonb,shipping jsonb,items jsonb,total_cents integer,accepted_terms boolean,status text,payment_status text,user_id uuid);
create table public.order_request_lines(id bigint generated always as identity primary key,order_request_id bigint,product_id integer,product_name text,quantity integer,unit_price_cents integer);
insert into product_overrides(product_id,data) values (1,'{"stock":10}');`);
await db.exec(fs.readFileSync('supabase-delivery.sql','utf8'));
const items=JSON.stringify([{product_id:1,name:'Test product',quantity:2,unit_price_cents:10000}]);
async function order(ref,customer,total){return db.query('select public.create_order_request_atomic($1,$2::jsonb,null,$3::jsonb,$4,null) as id',[ref,JSON.stringify(customer),items,total]);}
await order('TP-AAAAAAAAAAAA',{firstName:'Test',delivery:{feeCents:4500,distanceKm:60}},24500);
let rows=(await db.query('select total_cents,customer from order_requests')).rows;assert.equal(rows[0].total_cents,24500);assert.equal(rows[0].customer.delivery.feeCents,4500);
assert.equal((await db.query("select (data->>'stock')::int as stock from product_overrides")).rows[0].stock,8);
await assert.rejects(order('TP-BBBBBBBBBBBB',{delivery:{feeCents:4500,distanceKm:60}},20000),/total_mismatch/);
assert.equal((await db.query("select (data->>'stock')::int as stock from product_overrides")).rows[0].stock,8,'Rejected order restores stock');
await assert.rejects(order('TP-CCCCCCCCCCCC',{delivery:{feeCents:-1,distanceKm:60}},20000),/invalid_delivery/);
await order('TP-DDDDDDDDDDDD',{firstName:'Legacy'},20000);rows=(await db.query('select total_cents,customer from order_requests order by id')).rows;assert.equal(rows.length,2);assert.equal(rows[1].total_cents,20000);assert.equal(rows[0].total_cents,24500);
console.log('PASS isolated SQL: separate delivery metadata, product-plus-delivery totals, invalid fees rejected, mismatches roll back stock, legacy calls unchanged. No remote migration applied.');
}finally{await db.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
