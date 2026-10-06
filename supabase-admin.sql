-- Exécuter supabase-forms.sql AVANT ce script dans Supabase SQL Editor.
-- Le premier super admin est créé à la fin, après avoir créé son compte client.

alter table public.contact_requests add column if not exists status text not null default 'new';
alter table public.order_requests add column if not exists status text not null default 'new';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contact_requests_status_check' and conrelid = 'public.contact_requests'::regclass) then
    alter table public.contact_requests add constraint contact_requests_status_check check (status in ('new','in_progress','done'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'order_requests_status_check' and conrelid = 'public.order_requests'::regclass) then
    alter table public.order_requests add constraint order_requests_status_check check (status in ('new','in_progress','done'));
  end if;
end $$;

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','super_admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.product_overrides (
  product_id integer primary key,
  data jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  check (product_id > 0)
);
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings(key,value) values ('bank_transfer','{"details":""}'::jsonb) on conflict (key) do nothing;
create table if not exists public.client_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  is_super_admin boolean not null default false
);
create table if not exists public.user_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  sign_in_count integer not null default 1 check (sign_in_count > 0),
  is_super_admin boolean not null default false
);
alter table public.user_activity add column if not exists is_super_admin boolean not null default false;
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  actor_role text,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.record_user_activity(is_sign_in boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare current_id uuid := auth.uid(); current_email text := auth.jwt()->>'email';
begin
  if current_id is null then return; end if;
  insert into public.user_activity(user_id, email, last_seen_at, sign_in_count, is_super_admin)
  values (current_id, current_email, now(), 1, exists(select 1 from public.admin_roles where user_id = current_id and role = 'super_admin'))
  on conflict (user_id) do update set
    email = excluded.email,
    last_seen_at = now(),
    sign_in_count = public.user_activity.sign_in_count + case when is_sign_in then 1 else 0 end,
    is_super_admin = excluded.is_super_admin;
end $$;
create or replace function public.register_client_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.client_accounts(user_id, email, full_name, created_at, is_super_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', coalesce(new.created_at, now()),
          exists(select 1 from public.admin_roles where user_id = new.id and role = 'super_admin'))
  on conflict (user_id) do update set email = excluded.email, full_name = coalesce(excluded.full_name, public.client_accounts.full_name);
  return new;
end $$;

alter table public.admin_roles enable row level security;
alter table public.product_overrides enable row level security;
alter table public.site_settings enable row level security;
alter table public.user_activity enable row level security;
alter table public.client_accounts enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.current_user_has_role(required_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_roles where user_id = auth.uid() and role = required_role);
$$;
create or replace function public.current_user_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.current_user_has_role('admin') or public.current_user_has_role('super_admin');
$$;
create or replace function public.write_admin_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); row_id text;
begin
  row_id := coalesce(to_jsonb(new)->>'product_id', to_jsonb(old)->>'product_id', to_jsonb(new)->>'user_id', to_jsonb(old)->>'user_id', to_jsonb(new)->>'key', to_jsonb(old)->>'key', to_jsonb(new)->>'id', to_jsonb(old)->>'id');
  insert into public.admin_audit_log(actor_user_id, actor_role, action, entity, entity_id, details)
  values (actor, (select role from public.admin_roles where user_id = actor), lower(tg_op), tg_table_name, row_id,
    jsonb_build_object('new', case when tg_op <> 'DELETE' then to_jsonb(new) else null end,
                       'old', case when tg_op <> 'INSERT' then to_jsonb(old) else null end));
  return coalesce(new,old);
end $$;
create or replace function public.sync_super_admin_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare changed_user uuid := coalesce(new.user_id, old.user_id);
begin
  update public.user_activity set is_super_admin = exists (
    select 1 from public.admin_roles where user_id = changed_user and role = 'super_admin'
  ) where user_id = changed_user;
  update public.client_accounts set is_super_admin = exists (
    select 1 from public.admin_roles where user_id = changed_user and role = 'super_admin'
  ) where user_id = changed_user;
  return coalesce(new, old);
end $$;
revoke all on function public.current_user_has_role(text) from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.record_user_activity(boolean) from public;
revoke all on function public.write_admin_audit() from public;
revoke all on function public.sync_super_admin_activity() from public;
revoke all on function public.register_client_account() from public;
grant execute on function public.current_user_has_role(text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.record_user_activity(boolean) to authenticated;

drop policy if exists "roles self or super admin" on public.admin_roles;
drop policy if exists "Users can read their own role; super admins can read all roles" on public.admin_roles;
drop policy if exists "Super admins can add roles" on public.admin_roles;
drop policy if exists "Super admins can change roles" on public.admin_roles;
drop policy if exists "Super admins can remove roles" on public.admin_roles;
create policy "roles self or super admin" on public.admin_roles for select to authenticated
  using (user_id = auth.uid() or public.current_user_has_role('super_admin'));
drop policy if exists "super admin manages roles" on public.admin_roles;
drop policy if exists "super admin inserts roles" on public.admin_roles;
create policy "super admin inserts roles" on public.admin_roles for insert to authenticated with check (public.current_user_has_role('super_admin'));
drop policy if exists "super admin updates roles" on public.admin_roles;
create policy "super admin updates roles" on public.admin_roles for update to authenticated
  using (public.current_user_has_role('super_admin'))
  with check (public.current_user_has_role('super_admin') and (user_id <> auth.uid() or role = 'super_admin'));
drop policy if exists "super admin deletes other roles" on public.admin_roles;
create policy "super admin deletes other roles" on public.admin_roles for delete to authenticated
  using (public.current_user_has_role('super_admin') and user_id <> auth.uid());

drop policy if exists "admins read product overrides" on public.product_overrides;
create policy "admins read product overrides" on public.product_overrides for select to authenticated using (public.current_user_is_admin());
drop policy if exists "public reads product overrides" on public.product_overrides;
create policy "public reads product overrides" on public.product_overrides for select to anon, authenticated using (true);
drop policy if exists "admins manage product overrides" on public.product_overrides;
create policy "admins manage product overrides" on public.product_overrides for all to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin());
drop policy if exists "public reads site settings" on public.site_settings;
create policy "public reads site settings" on public.site_settings for select to anon, authenticated using (key = 'bank_transfer');
drop policy if exists "admins update site settings" on public.site_settings;
create policy "admins update site settings" on public.site_settings for update to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin());

drop policy if exists "users record own activity" on public.user_activity;
drop policy if exists "users update own activity" on public.user_activity;
drop policy if exists "admins view standard user activity" on public.user_activity;
create policy "admins view standard user activity" on public.user_activity for select to authenticated using (
  public.current_user_is_admin() and not is_super_admin
);
drop policy if exists "super admin views all activity" on public.user_activity;
create policy "super admin views all activity" on public.user_activity for select to authenticated using (public.current_user_has_role('super_admin'));

drop policy if exists "admins view client accounts" on public.client_accounts;
create policy "admins view client accounts" on public.client_accounts for select to authenticated using (
  user_id = auth.uid() or (public.current_user_is_admin() and not is_super_admin) or public.current_user_has_role('super_admin')
);

drop policy if exists "super admin reads audit log" on public.admin_audit_log;
create policy "super admin reads audit log" on public.admin_audit_log for select to authenticated using (public.current_user_has_role('super_admin'));

drop policy if exists "admins read requests" on public.contact_requests;
drop policy if exists "Admins can read contact requests" on public.contact_requests;
create policy "admins read requests" on public.contact_requests for select to authenticated using (public.current_user_is_admin());
drop policy if exists "admins update contact requests" on public.contact_requests;
drop policy if exists "Admins can update contact requests" on public.contact_requests;
create policy "admins update contact requests" on public.contact_requests for update to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin());
drop policy if exists "admins read orders" on public.order_requests;
drop policy if exists "Admins can read order requests" on public.order_requests;
create policy "admins read orders" on public.order_requests for select to authenticated using (public.current_user_is_admin());
drop policy if exists "admins update order requests" on public.order_requests;
drop policy if exists "Admins can update order requests" on public.order_requests;
create policy "admins update order requests" on public.order_requests for update to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin());

revoke all on public.admin_roles, public.product_overrides, public.site_settings, public.user_activity, public.admin_audit_log, public.client_accounts from anon, authenticated;
grant select, insert, update, delete on public.admin_roles, public.product_overrides to authenticated;
grant select on public.admin_audit_log to authenticated;
grant select, update on public.site_settings to authenticated;
grant select on public.user_activity to authenticated;
grant select on public.client_accounts to authenticated;
grant select on public.contact_requests, public.order_requests to authenticated;
revoke update on public.contact_requests, public.order_requests from authenticated;
grant update(status) on public.contact_requests, public.order_requests to authenticated;
grant select on public.product_overrides, public.site_settings to anon;

drop trigger if exists audit_admin_roles on public.admin_roles;
create trigger audit_admin_roles after insert or update or delete on public.admin_roles for each row execute function public.write_admin_audit();
drop trigger if exists sync_super_admin_activity on public.admin_roles;
create trigger sync_super_admin_activity after insert or update or delete on public.admin_roles for each row execute function public.sync_super_admin_activity();
update public.user_activity activity set is_super_admin = exists (
  select 1 from public.admin_roles roles where roles.user_id = activity.user_id and roles.role = 'super_admin'
);
update public.client_accounts accounts set is_super_admin = exists (
  select 1 from public.admin_roles roles where roles.user_id = accounts.user_id and roles.role = 'super_admin'
);
drop trigger if exists thermopro_auth_user_to_client_account on auth.users;
create trigger thermopro_auth_user_to_client_account after insert on auth.users for each row execute function public.register_client_account();
insert into public.client_accounts(user_id, email, full_name, created_at, is_super_admin)
select users.id, users.email, users.raw_user_meta_data->>'full_name', coalesce(users.created_at, now()),
       exists(select 1 from public.admin_roles roles where roles.user_id = users.id and roles.role = 'super_admin')
from auth.users users
on conflict (user_id) do update set email = excluded.email, full_name = coalesce(excluded.full_name, public.client_accounts.full_name);
drop trigger if exists audit_product_overrides on public.product_overrides;
create trigger audit_product_overrides after insert or update or delete on public.product_overrides for each row execute function public.write_admin_audit();
drop trigger if exists audit_site_settings on public.site_settings;
create trigger audit_site_settings after insert or update or delete on public.site_settings for each row execute function public.write_admin_audit();
drop trigger if exists audit_contact_requests on public.contact_requests;
create trigger audit_contact_requests after update on public.contact_requests for each row when (old.status is distinct from new.status) execute function public.write_admin_audit();
drop trigger if exists audit_order_requests on public.order_requests;
create trigger audit_order_requests after update on public.order_requests for each row when (old.status is distinct from new.status) execute function public.write_admin_audit();

-- 1) Créez le compte puis vérifiez qu'il existe dans Authentication > Users.
--    Vous pouvez retrouver son UUID avec :
--    select id, email from auth.users where email = 'votre-adresse@example.com';
-- 2) Remplacez l'UUID ci-dessous et exécutez cette instruction séparément.
--    INSERT ... SELECT + RETURNING affiche clairement la ligne créée.
-- insert into public.admin_roles(user_id, role)
-- select id, 'super_admin' from auth.users
-- where id = 'PASTE-AUTH-USER-UUID-HERE'
-- on conflict (user_id) do update set role = excluded.role
-- returning user_id, role;
