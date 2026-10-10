-- Read-only verification AFTER applying supabase-security.sql.
-- Returns only permission/policy/trigger metadata, never customer records.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'contact_requests','order_requests','customer_addresses','order_request_lines',
  'order_payment_events','admin_roles','client_accounts','user_activity','admin_audit_log'
) order by c.relname;

select
  not has_table_privilege('anon','public.contact_requests','INSERT') as anon_contact_insert_denied,
  not has_table_privilege('authenticated','public.contact_requests','INSERT') as client_contact_insert_denied,
  not has_table_privilege('authenticated','public.order_requests','INSERT') as client_order_insert_denied,
  not has_column_privilege('authenticated','public.order_requests','payment_status','UPDATE') as direct_payment_update_denied,
  not has_column_privilege('authenticated','public.order_requests','user_id','UPDATE') as direct_owner_update_denied,
  has_column_privilege('authenticated','public.order_requests','status','UPDATE') as admin_status_privilege_preserved,
  has_function_privilege('service_role','public.consume_api_rate_limit(text,integer,integer)','EXECUTE') as server_quota_rpc_allowed,
  not has_function_privilege('anon','public.consume_api_rate_limit(text,integer,integer)','EXECUTE') as anon_quota_rpc_denied,
  not has_function_privilege('authenticated','public.consume_api_rate_limit(text,integer,integer)','EXECUTE') as client_quota_rpc_denied,
  not has_schema_privilege('authenticated','bren_security','USAGE') as quota_schema_private;

-- Review all policies, including any unknown legacy permissive policy.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename in (
  'order_requests','customer_addresses','order_request_lines','order_payment_events','admin_roles'
) order by tablename,policyname;

select id, not public as private_bucket from storage.buckets where id='payment-proofs';

-- Names only; a custom storage trigger mentioning payment requires review.
select n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name,
  p.proname as function_name,
  lower(pg_get_functiondef(p.oid)) ~ 'payment_status|confirm_bank_transfer' as payment_reference_requires_review
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid
where not t.tgisinternal and ((n.nspname='storage' and c.relname='objects') or (n.nspname='public' and c.relname='order_requests'))
order by schema_name,table_name,trigger_name;
