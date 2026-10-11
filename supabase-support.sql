-- Apply after supabase-admin.sql and supabase-security.sql.
-- Adds a new messaging table only; existing customer records are unchanged.
begin;
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_kind text not null check (sender_kind in ('customer','admin')),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  locale text not null check (locale in ('de','fr','en')),
  created_at timestamptz not null default now(),
  check (sender_kind <> 'customer' or (sender_id is not null and sender_id = user_id))
);
create index if not exists support_messages_user_date on public.support_messages(user_id,created_at desc);
alter table public.support_messages enable row level security;
revoke all on public.support_messages from public,anon,authenticated;
grant select on public.support_messages to authenticated;
grant select,insert on public.support_messages to service_role;
drop policy if exists "support read own or admin" on public.support_messages;
create policy "support read own or admin" on public.support_messages for select to authenticated
  using (user_id = auth.uid() or public.current_user_is_admin());
-- Writes go through the validated, role-checked and rate-limited server API.
notify pgrst, 'reload schema';
commit;
