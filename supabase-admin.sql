-- Run supabase-forms.sql first, then run this file in the Supabase SQL Editor.
alter table public.contact_requests
  add column if not exists status text not null default 'new';
alter table public.order_requests
  add column if not exists status text not null default 'new';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contact_requests_status_check') then
    alter table public.contact_requests add constraint contact_requests_status_check
      check (status in ('new', 'in_progress', 'done'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'order_requests_status_check') then
    alter table public.order_requests add constraint order_requests_status_check
      check (status in ('new', 'in_progress', 'done'));
  end if;
end $$;

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

create or replace function public.current_user_has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_role('admin') or public.current_user_has_role('super_admin');
$$;

revoke all on function public.current_user_has_role(text) from public, anon;
revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_has_role(text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;

revoke all on public.admin_roles from anon, authenticated;
grant select, insert, update, delete on public.admin_roles to authenticated;
revoke all on public.contact_requests from anon, authenticated;
revoke all on public.order_requests from anon, authenticated;
grant insert on public.contact_requests to anon, authenticated;
grant insert on public.order_requests to anon, authenticated;
grant select, update on public.contact_requests to authenticated;
grant select, update on public.order_requests to authenticated;

drop policy if exists "Users can read their own role; super admins can read all roles" on public.admin_roles;
create policy "Users can read their own role; super admins can read all roles"
  on public.admin_roles for select to authenticated
  using (user_id = auth.uid() or public.current_user_has_role('super_admin'));

drop policy if exists "Super admins can add roles" on public.admin_roles;
create policy "Super admins can add roles" on public.admin_roles
  for insert to authenticated with check (public.current_user_has_role('super_admin'));

drop policy if exists "Super admins can change roles" on public.admin_roles;
create policy "Super admins can change roles" on public.admin_roles
  for update to authenticated using (public.current_user_has_role('super_admin'))
  with check (public.current_user_has_role('super_admin'));

drop policy if exists "Super admins can remove roles" on public.admin_roles;
create policy "Super admins can remove roles" on public.admin_roles
  for delete to authenticated using (public.current_user_has_role('super_admin'));

drop policy if exists "Admins can read contact requests" on public.contact_requests;
create policy "Admins can read contact requests" on public.contact_requests
  for select to authenticated using (public.current_user_is_admin());
drop policy if exists "Admins can update contact requests" on public.contact_requests;
create policy "Admins can update contact requests" on public.contact_requests
  for update to authenticated using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can read order requests" on public.order_requests;
create policy "Admins can read order requests" on public.order_requests
  for select to authenticated using (public.current_user_is_admin());
drop policy if exists "Admins can update order requests" on public.order_requests;
create policy "Admins can update order requests" on public.order_requests
  for update to authenticated using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Bootstrap the first super admin manually after creating their account:
-- 1. Copy the user's UUID from Authentication > Users.
-- 2. Replace the placeholder and run this statement as the project owner:
-- insert into public.admin_roles (user_id, role)
-- values ('PASTE-AUTH-USER-UUID-HERE', 'super_admin');
