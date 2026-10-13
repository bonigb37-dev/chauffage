-- PREPARATION ONLY: not applied to the remote database.
-- Existing order rows are not modified.
begin;
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
  -- Delivery metadata is supplied only by the server after signed-quote validation.
  -- Calls without delivery metadata retain their existing behavior.
  if p_customer ? 'delivery' then
    if jsonb_typeof(p_customer->'delivery') <> 'object'
      or coalesce((p_customer->'delivery'->>'feeCents')::integer, -1) < 0
      or coalesce((p_customer->'delivery'->>'distanceKm')::numeric, -1) < 0 then
      raise exception 'invalid_delivery' using errcode = '22023';
    end if;
    calculated_total := calculated_total + (p_customer->'delivery'->>'feeCents')::bigint;
  end if;
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

revoke all on function public.create_order_request_atomic(text,jsonb,jsonb,jsonb,integer,uuid) from public, anon, authenticated;
grant execute on function public.create_order_request_atomic(text,jsonb,jsonb,jsonb,integer,uuid) to service_role;
commit;
