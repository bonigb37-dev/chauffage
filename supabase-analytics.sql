-- Run once in the SQL Editor of the site's Supabase project.
-- Requires the existing admin_roles and client_accounts tables.
begin;
create table if not exists public.analytics_events (
  id uuid primary key,
  session_id uuid not null,
  page_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('page_view','section_view','engagement','cart_add','contact_sent','quote_sent','order_sent')),
  path text not null check (length(path) <= 220 and path ~ '^/[a-zA-Z0-9/-]*$' and path !~ '^/(admin|super-admin|api|compte|aide)(/|$)'),
  section text not null default '' check (section ~ '^[a-z0-9-]{0,80}$'),
  seconds integer not null default 0 check (seconds between 0 and 30),
  locale text not null check (locale in ('de','fr','en')),
  device text not null check (device in ('desktop','tablet','mobile')),
  source text not null check (source ~ '^[a-zA-Z0-9.-]{1,120}$'),
  consent_version text not null,
  created_at timestamptz not null default now(),
  check ((kind = 'engagement') = (seconds > 0))
);
create index if not exists analytics_events_created_idx on public.analytics_events(created_at);
create index if not exists analytics_events_session_idx on public.analytics_events(session_id, created_at);
create index if not exists analytics_events_user_idx on public.analytics_events(user_id, created_at) where user_id is not null;
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from public, anon, authenticated;
grant select, insert, delete on public.analytics_events to service_role;

create table if not exists public.analytics_maintenance (id boolean primary key default true check (id), purged_at timestamptz not null default '-infinity');
insert into public.analytics_maintenance(id) values(true) on conflict do nothing;
alter table public.analytics_maintenance enable row level security;
revoke all on public.analytics_maintenance from public, anon, authenticated;

create or replace function public.record_analytics_events(p_events jsonb, p_user_id uuid, p_consent_version text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_consent_version <> '2026-10-v1' or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) not between 1 and 20 then raise exception 'Invalid analytics batch'; end if;
  -- Purge once per day on the next collection, rather than on each event.
  update public.analytics_maintenance set purged_at = now() where id and purged_at < date_trunc('day',now());
  if found then delete from public.analytics_events where created_at < now() - interval '90 days'; end if;
  insert into public.analytics_events(id,session_id,page_id,user_id,kind,path,section,seconds,locale,device,source,consent_version)
  select e.id,e.session_id,e.page_id,p_user_id,e.kind,e.path,e.section,e.seconds,e.locale,e.device,e.source,p_consent_version
  from jsonb_to_recordset(p_events) as e(id uuid,session_id uuid,page_id uuid,kind text,path text,section text,seconds integer,locale text,device text,source text)
  on conflict(id) do nothing;
end $$;

create or replace function public.analytics_dashboard(p_days integer default 30, p_offset integer default 0)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
with bounds as (
  select ((now() at time zone 'Europe/Berlin')::date - (greatest(1,least(p_days,90))-1))::timestamp at time zone 'Europe/Berlin' as start_at
), events as (
  select e.* from public.analytics_events e, bounds b where e.created_at >= b.start_at and e.created_at <= now()
), sessions as (
  select session_id,min(created_at) as started_at,max(created_at) as last_at,
    (array_agg(user_id order by created_at) filter(where user_id is not null))[1] as user_id,
    (array_agg(path order by created_at) filter(where kind='page_view'))[1] as entry,
    (array_agg(path order by created_at desc) filter(where kind='page_view'))[1] as exit,
    (array_agg(device order by created_at))[1] as device,
    (array_agg(source order by created_at))[1] as source,
    count(*) filter(where kind='page_view') as views,sum(seconds) as seconds
  from events group by session_id
), daily as (
  select (created_at at time zone 'Europe/Berlin')::date as day,count(*) filter(where kind='page_view') as views,count(distinct session_id) as visits
  from events group by 1
), days as (
  select generate_series((now() at time zone 'Europe/Berlin')::date-(greatest(1,least(p_days,90))-1),(now() at time zone 'Europe/Berlin')::date,'1 day')::date as day
), pages as (
  select path,count(*) as views,count(distinct session_id) as visits from events where kind='page_view' group by path order by views desc limit 20
), sections as (
  select path,section,count(*) as views,count(distinct session_id) as visits from events where kind='section_view' group by path,section order by views desc limit 20
), actions as (
  select kind,count(*) as total,count(distinct session_id) as visits from events where kind in ('cart_add','contact_sent','quote_sent','order_sent') group by kind
), devices as (select device,count(*) as visits from sessions group by device),
sources as (select source,count(*) as visits from sessions group by source order by visits desc limit 10),
recent as (
  select s.*,a.full_name as customer_name,a.email as customer_email from sessions s left join public.client_accounts a on a.user_id=s.user_id
  order by last_at desc,session_id limit 50 offset greatest(0,least(p_offset,100000))
)
select jsonb_build_object(
  'totals',jsonb_build_object('visits',(select count(*) from sessions),'views',(select count(*) from events where kind='page_view'),
    'customers',(select count(distinct user_id) from sessions),'active',(select count(*) from sessions where last_at >= now()-interval '5 minutes'),
    'seconds',(select coalesce(sum(seconds),0) from events),'single_page',(select count(*) from sessions where views=1)),
  'daily',(select coalesce(jsonb_agg(jsonb_build_object('day',d.day,'views',coalesce(a.views,0),'visits',coalesce(a.visits,0)) order by d.day),'[]') from days d left join daily a using(day)),
  'pages',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from pages p),
  'sections',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from sections s),
  'actions',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from actions a),
  'devices',(select coalesce(jsonb_agg(to_jsonb(d)),'[]') from devices d),
  'sources',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from sources s),
  'sessions',(select coalesce(jsonb_agg(to_jsonb(r) order by last_at desc,session_id),'[]') from recent r),
  'funnel',jsonb_build_object('products',(select count(distinct session_id) from events where kind='page_view' and path like '/produits%'),
    'cart',(select count(distinct session_id) from events where kind='cart_add'),
    'checkout',(select count(distinct session_id) from events where kind='page_view' and path='/commande'),
    'orders',(select count(distinct session_id) from events where kind='order_sent')),
  'days',greatest(1,least(p_days,90)),'offset',greatest(0,least(p_offset,100000))
); $$;

create or replace function public.analytics_session_journey(p_session uuid,p_days integer default 30)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
select jsonb_build_object('events',coalesce(jsonb_agg(to_jsonb(e) order by created_at,id),'[]'),'truncated',(select count(*)>500 from public.analytics_events where session_id=p_session and kind<>'engagement' and created_at>=((now() at time zone 'Europe/Berlin')::date-(greatest(1,least(p_days,90))-1))::timestamp at time zone 'Europe/Berlin'))
from (select id,kind,path,section,seconds,locale,created_at from public.analytics_events
  where session_id=p_session and kind<>'engagement' and created_at>=((now() at time zone 'Europe/Berlin')::date-(greatest(1,least(p_days,90))-1))::timestamp at time zone 'Europe/Berlin'
  order by created_at,id limit 500) e;
$$;

revoke all on function public.record_analytics_events(jsonb,uuid,text) from public,anon,authenticated;
revoke all on function public.analytics_dashboard(integer,integer) from public,anon,authenticated;
revoke all on function public.analytics_session_journey(uuid,integer) from public,anon,authenticated;
grant execute on function public.record_analytics_events(jsonb,uuid,text) to service_role;
grant execute on function public.analytics_dashboard(integer,integer) to service_role;
grant execute on function public.analytics_session_journey(uuid,integer) to service_role;
commit;
