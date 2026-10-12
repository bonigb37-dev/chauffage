-- Run in Supabase SQL Editor after the existing administration scripts.
begin;
alter table public.order_requests add column if not exists archived_at timestamptz;
alter table public.order_requests add column if not exists archived_by uuid references auth.users(id) on delete set null;
create index if not exists order_requests_archive_created_idx on public.order_requests(archived_at,created_at desc);
create or replace function public.set_order_archived(p_order_id bigint,p_archived boolean)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not public.current_user_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_order_id is null or p_order_id < 1 or p_archived is null then raise exception 'Invalid order archive request' using errcode='22023'; end if;
  update public.order_requests set archived_at=case when p_archived then coalesce(archived_at,now()) else null end,
    archived_by=case when p_archived then coalesce(archived_by,auth.uid()) else null end where id=p_order_id;
  if not found then raise exception 'Order not found' using errcode='P0002'; end if;
  return true;
end $$;
revoke all on function public.set_order_archived(bigint,boolean) from public,anon;
grant execute on function public.set_order_archived(bigint,boolean) to authenticated;
drop trigger if exists audit_order_archive on public.order_requests;
create trigger audit_order_archive after update on public.order_requests for each row
  when (old.archived_at is distinct from new.archived_at) execute function public.write_admin_audit();
commit;
