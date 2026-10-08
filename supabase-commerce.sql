-- Run after supabase-forms.sql and supabase-admin.sql.
-- Public order creation is routed through the server; the service-role key must never be exposed to the browser.

alter table public.order_requests
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists payment_status text not null default 'pending';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'order_requests_payment_status_check' and conrelid = 'public.order_requests'::regclass) then
    alter table public.order_requests add constraint order_requests_payment_status_check
      check (payment_status in ('pending','confirmed','failed','refunded'));
  end if;
end $$;

create table if not exists public.order_request_lines (
  id bigint generated always as identity primary key,
  order_request_id bigint not null references public.order_requests(id) on delete cascade,
  product_id integer not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_payment_events (
  id bigint generated always as identity primary key,
  order_request_id bigint not null references public.order_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('bank_transfer_confirmed','bank_transfer_reversed')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Adresse',
  recipient_name text not null,
  street text not null,
  address_line2 text,
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  city text not null,
  state text,
  country_code text not null default 'DE' check (country_code = 'DE'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id);
alter table public.customer_addresses enable row level security;
drop policy if exists "customers manage own addresses" on public.customer_addresses;
create policy "customers manage own addresses" on public.customer_addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.customer_addresses to authenticated;
grant usage, select on sequence public.customer_addresses_id_seq to authenticated;

alter table public.order_request_lines enable row level security;
alter table public.order_payment_events enable row level security;

drop policy if exists "customers read own orders" on public.order_requests;
create policy "customers read own orders" on public.order_requests for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "customers read own order lines" on public.order_request_lines;
create policy "customers read own order lines" on public.order_request_lines for select to authenticated
  using (exists (select 1 from public.order_requests o where o.id = order_request_id and o.user_id = auth.uid()));
drop policy if exists "admins read order lines" on public.order_request_lines;
create policy "admins read order lines" on public.order_request_lines for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "customers read own payment events" on public.order_payment_events;
create policy "customers read own payment events" on public.order_payment_events for select to authenticated
  using (exists (select 1 from public.order_requests o where o.id = order_request_id and o.user_id = auth.uid()));
drop policy if exists "admins read payment events" on public.order_payment_events;
create policy "admins read payment events" on public.order_payment_events for select to authenticated
  using (public.current_user_is_admin());

revoke all on public.order_request_lines, public.order_payment_events from anon, authenticated;
grant select on public.order_request_lines, public.order_payment_events to authenticated;
grant usage, select on sequence public.order_request_lines_id_seq, public.order_payment_events_id_seq to service_role;

create or replace function public.create_order_request_atomic(
  p_reference text,
  p_customer jsonb,
  p_shipping jsonb,
  p_items jsonb,
  p_total_cents integer,
  p_user_id uuid default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  line jsonb;
  product_row record;
  product_id_value integer;
  quantity_value integer;
  stock_value integer;
  order_id bigint;
  calculated_total bigint := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_reference !~ '^TP-[A-F0-9]{12}$' or p_customer is null or jsonb_typeof(p_customer) <> 'object'
     or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50
     or p_total_cents <= 0 then
    raise exception 'invalid_order' using errcode = '22023';
  end if;

  for line in select value from jsonb_array_elements(p_items) loop
    product_id_value := (line->>'product_id')::integer;
    quantity_value := (line->>'quantity')::integer;
    if product_id_value <= 0 or quantity_value <= 0 or (line->>'unit_price_cents')::integer <= 0
       or length(coalesce(line->>'name','')) not between 1 and 200 then
      raise exception 'invalid_order_line' using errcode = '22023';
    end if;
    calculated_total := calculated_total + (line->>'unit_price_cents')::bigint * quantity_value;
    select data, is_deleted into product_row from public.product_overrides
      where product_id = product_id_value for update;
    if found and product_row.is_deleted then
      raise exception 'product_unavailable:%', product_id_value using errcode = 'P0001';
    end if;
    if found and product_row.data ? 'stock' and jsonb_typeof(product_row.data->'stock') = 'number' then
      stock_value := (product_row.data->>'stock')::integer;
      if stock_value < quantity_value then
        raise exception 'insufficient_stock:%', product_id_value using errcode = 'P0001';
      end if;
      update public.product_overrides set data = jsonb_set(data, '{stock}', to_jsonb(stock_value - quantity_value), true), updated_at = now()
        where product_id = product_id_value;
    end if;
  end loop;
  if calculated_total <> p_total_cents then
    raise exception 'total_mismatch' using errcode = '22023';
  end if;

  insert into public.order_requests(reference, customer, shipping, items, total_cents, accepted_terms, status, payment_status, user_id)
    values (p_reference, p_customer, p_shipping, p_items, p_total_cents, true, 'new', 'pending', p_user_id)
    returning id into order_id;
  insert into public.order_request_lines(order_request_id, product_id, product_name, quantity, unit_price_cents)
    select order_id, (item->>'product_id')::integer, item->>'name', (item->>'quantity')::integer, (item->>'unit_price_cents')::integer
      from jsonb_array_elements(p_items) item;
  return order_id;
end $$;

create or replace function public.confirm_bank_transfer(p_order_request_id bigint, p_note text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  select payment_status into current_status from public.order_requests where id = p_order_request_id for update;
  if current_status is null then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if current_status = 'confirmed' then return current_status; end if;
  update public.order_requests set payment_status = 'confirmed' where id = p_order_request_id;
  insert into public.order_payment_events(order_request_id, actor_user_id, event_type, note)
    values (p_order_request_id, auth.uid(), 'bank_transfer_confirmed', left(coalesce(p_note,''), 1000));
  return 'confirmed';
end $$;

revoke all on function public.create_order_request_atomic(text,jsonb,jsonb,jsonb,integer,uuid) from public, anon, authenticated;
grant execute on function public.create_order_request_atomic(text,jsonb,jsonb,jsonb,integer,uuid) to service_role;
revoke all on function public.confirm_bank_transfer(bigint,text) from public, anon;
grant execute on function public.confirm_bank_transfer(bigint,text) to authenticated;

-- Remove browser-side inserts; public form requests remain enabled.
drop policy if exists "Public can submit order requests" on public.order_requests;
revoke insert on public.order_requests from anon, authenticated;
