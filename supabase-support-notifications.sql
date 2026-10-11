-- Apply after supabase-support.sql. No backfill or change to existing messages.
begin;
create table if not exists public.support_reads (
  reader_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null,
  primary key(reader_id,customer_id)
);
alter table public.support_reads enable row level security;
revoke all on public.support_reads from public,anon,authenticated;
grant select,insert,update on public.support_reads to service_role;
create schema if not exists bren_security;
revoke all on schema bren_security from public,anon,authenticated;
create table if not exists bren_security.mail_notifications (
  key text primary key,
  kind text not null check(kind in ('admin_support','customer_reply','admin_contact')),
  group_key text not null,
  customer_id uuid references auth.users(id) on delete cascade,
  locale text not null check(locale in ('de','fr','en')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  lease_id uuid,
  leased_until timestamptz,
  attempts integer not null default 0,
  last_error text check(last_error in ('smtp','recipient'))
);
alter table bren_security.mail_notifications enable row level security;
revoke all on bren_security.mail_notifications from public,anon,authenticated;

create or replace function public.queue_message_notification() returns trigger
language plpgsql security definer set search_path='' as $$
declare notification_kind text; recipient uuid; notification_locale text; notification_group text;
begin
  if tg_table_name='support_messages' then
    notification_kind := case when new.sender_kind='customer' then 'admin_support' else 'customer_reply' end;
    recipient:=new.user_id; notification_locale:=new.locale;
    notification_group:=new.user_id::text;
  else
    notification_kind:='admin_contact'; recipient:=null; notification_locale:='de';
    notification_group:=md5(lower(new.email));
  end if;
  perform pg_advisory_xact_lock(hashtextextended(notification_kind||':'||notification_group,0));
  if exists(select 1 from bren_security.mail_notifications n where n.kind=notification_kind and n.group_key=notification_group and n.created_at>clock_timestamp()-interval '10 minutes') then return new; end if;
  insert into bren_security.mail_notifications(key,kind,group_key,customer_id,locale)
  values(notification_kind||':'||notification_group||':'||gen_random_uuid()::text,notification_kind,notification_group,recipient,notification_locale)
  on conflict(key) do nothing;
  return new;
end $$;
revoke all on function public.queue_message_notification() from public,anon,authenticated;
drop trigger if exists support_queue_notification on public.support_messages;
create trigger support_queue_notification after insert on public.support_messages for each row execute function public.queue_message_notification();
drop trigger if exists contact_queue_notification on public.contact_requests;
create trigger contact_queue_notification after insert on public.contact_requests for each row execute function public.queue_message_notification();

create or replace function public.support_notification_counts(p_reader uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare is_admin boolean; total integer; contacts integer:=0; threads jsonb;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  select exists(select 1 from public.admin_roles where user_id=p_reader and role in ('admin','super_admin','owner')) into is_admin;
  select count(*) into total from public.support_messages m
  left join public.support_reads r on r.reader_id=p_reader and r.customer_id=m.user_id
  where m.sender_kind=case when is_admin then 'customer' else 'admin' end
    and (is_admin or m.user_id=p_reader) and (r.read_at is null or m.created_at>r.read_at);
  select coalesce(jsonb_agg(t),'[]'::jsonb) into threads from (
    select m.user_id,count(*) as unread from public.support_messages m
    left join public.support_reads r on r.reader_id=p_reader and r.customer_id=m.user_id
    where m.sender_kind=case when is_admin then 'customer' else 'admin' end
      and (is_admin or m.user_id=p_reader) and (r.read_at is null or m.created_at>r.read_at)
    group by m.user_id
  ) t;
  if is_admin then select count(*) into contacts from public.contact_requests where status='new'; end if;
  return jsonb_build_object('support',total,'contacts',contacts,'threads',threads);
end $$;
revoke all on function public.support_notification_counts(uuid) from public,anon,authenticated;
grant execute on function public.support_notification_counts(uuid) to service_role;

create or replace function public.mark_support_read(p_reader uuid,p_customer uuid,p_message uuid) returns void
language plpgsql security definer set search_path='' as $$
declare message_at timestamptz;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  if p_reader<>p_customer and not exists(select 1 from public.admin_roles where user_id=p_reader and role in ('admin','super_admin','owner')) then raise exception 'forbidden' using errcode='42501'; end if;
  select created_at into message_at from public.support_messages where id=p_message and user_id=p_customer;
  if message_at is null then raise exception 'invalid_message' using errcode='22023'; end if;
  insert into public.support_reads(reader_id,customer_id,read_at) values(p_reader,p_customer,message_at)
  on conflict(reader_id,customer_id) do update set read_at=greatest(public.support_reads.read_at,excluded.read_at);
end $$;
revoke all on function public.mark_support_read(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.mark_support_read(uuid,uuid,uuid) to service_role;

create or replace function public.claim_mail_notification() returns jsonb
language plpgsql security definer set search_path='' as $$
declare job bren_security.mail_notifications%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  select * into job from bren_security.mail_notifications
    where sent_at is null and next_attempt_at<=clock_timestamp() and (leased_until is null or leased_until<clock_timestamp())
    order by created_at limit 1 for update skip locked;
  if job.key is null then return null; end if;
  update bren_security.mail_notifications set lease_id=gen_random_uuid(),leased_until=clock_timestamp()+interval '2 minutes',attempts=attempts+1
    where key=job.key returning * into job;
  return to_jsonb(job);
end $$;
revoke all on function public.claim_mail_notification() from public,anon,authenticated;
grant execute on function public.claim_mail_notification() to service_role;

create or replace function public.finish_mail_notification(p_key text,p_lease uuid,p_success boolean,p_error text default null) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  update bren_security.mail_notifications set sent_at=case when p_success then clock_timestamp() else null end,
    lease_id=null,leased_until=null,last_error=case when p_success then null when p_error='recipient' then 'recipient' else 'smtp' end,
    next_attempt_at=clock_timestamp()+interval '5 minutes'
    where key=p_key and lease_id=p_lease;
end $$;
revoke all on function public.finish_mail_notification(text,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.finish_mail_notification(text,uuid,boolean,text) to service_role;

create or replace function public.mail_notification_status() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  return (select jsonb_build_object('pending',count(*) filter(where sent_at is null),'failed',count(*) filter(where sent_at is null and last_error is not null)) from bren_security.mail_notifications);
end $$;
revoke all on function public.mail_notification_status() from public,anon,authenticated;
grant execute on function public.mail_notification_status() to service_role;
notify pgrst,'reload schema';
commit;
