-- Apply after supabase-forms.sql, supabase-admin.sql and supabase-commerce.sql.
-- Permissions and a dedicated quota store only: no customer record is changed.
begin;

-- Require the existing client and administrator policies. Refuse an incomplete
-- deployment instead of silently installing a migration over missing RLS.
do $$
declare target text;
begin
  foreach target in array array['contact_requests','order_requests','customer_addresses','order_request_lines','order_payment_events','admin_roles'] loop
    if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = target and c.relrowsecurity) then
      raise exception 'Missing RLS prerequisite: %', target;
    end if;
  end loop;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_requests' and policyname = 'customers read own orders')
    or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_addresses' and policyname = 'customers manage own addresses') then
    raise exception 'Apply supabase-commerce.sql first';
  end if;
end $$;

-- Contact and quote requests now use the validated /api/contact server endpoint.
-- Remove the direct Data API path that would bypass its validation and quotas.
drop policy if exists "Public can submit contact requests" on public.contact_requests;
revoke insert on public.contact_requests from anon, authenticated;
revoke usage on sequence public.contact_requests_id_seq from anon, authenticated;
grant insert on public.contact_requests to service_role;
grant usage on sequence public.contact_requests_id_seq to service_role;

-- Prevent rerunning the older forms setup from reopening browser order inserts.
drop policy if exists "Public can submit order requests" on public.order_requests;
revoke insert on public.order_requests from anon, authenticated;

-- No direct update of totals, ownership or payment status, even for admins.
-- Preserve the existing administration status selector; payment confirmation
-- continues to use the role-checked confirm_bank_transfer RPC.
revoke update on public.order_requests from anon, authenticated;
revoke update(payment_status, total_cents, customer, shipping, items, user_id, reference, accepted_terms)
  on public.order_requests from anon, authenticated;
grant update(status) on public.order_requests to authenticated;

-- A persistent, atomic quota shared by every serverless instance. Its store is
-- outside the exposed public API schema. Only the server may call the RPC.
create schema if not exists bren_security;
revoke all on schema bren_security from public, anon, authenticated;
create table if not exists bren_security.api_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  hits integer not null check (hits > 0),
  expires_at timestamptz not null
);
create index if not exists api_rate_limits_expiry_idx on bren_security.api_rate_limits(expires_at);
alter table bren_security.api_rate_limits enable row level security;
revoke all on bren_security.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, retry_after integer)
language plpgsql security definer set search_path = '' as $$
declare now_at timestamptz := clock_timestamp(); used integer; until_at timestamptz;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_key is null or p_key !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit not between 1 and 1000
    or p_window_seconds is null or p_window_seconds not between 1 and 3600 then
    raise exception 'invalid_rate_limit' using errcode = '22023';
  end if;
  insert into bren_security.api_rate_limits as quota(key_hash, hits, expires_at)
    values (p_key, 1, now_at + make_interval(secs => p_window_seconds))
    on conflict (key_hash) do update set
      hits = case when quota.expires_at <= now_at then 1 else least(quota.hits + 1, p_limit + 1) end,
      expires_at = case when quota.expires_at <= now_at then excluded.expires_at else quota.expires_at end
    returning hits, expires_at into used, until_at;
  -- Bound maintenance work; never touch any order/customer table here.
  delete from bren_security.api_rate_limits where key_hash in (
    select key_hash from bren_security.api_rate_limits where expires_at < now_at - interval '1 day'
    order by expires_at limit 200
  );
  return query select used <= p_limit, greatest(1, ceil(extract(epoch from until_at - now_at))::integer);
end $$;
revoke all on function public.consume_api_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,integer,integer) to service_role;

-- Payment proofs are served only through short-lived administrator signed URLs.
update storage.buckets set public = false where id = 'payment-proofs';
notify pgrst, 'reload schema';
commit;
