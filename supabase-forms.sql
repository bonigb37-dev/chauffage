-- Run this once in the Supabase SQL Editor to enable the public forms.
create table if not exists public.contact_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 50),
  postal_code text check (char_length(postal_code) <= 20),
  subject text not null check (subject in ('product', 'quote', 'delivery', 'order', 'claim', 'other')),
  message text not null check (char_length(message) between 1 and 5000)
);

create table if not exists public.order_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  reference text not null unique,
  customer jsonb not null,
  shipping jsonb,
  items jsonb not null,
  total_cents integer not null check (total_cents >= 0),
  accepted_terms boolean not null check (accepted_terms)
);

alter table public.contact_requests enable row level security;
alter table public.order_requests enable row level security;

drop policy if exists "Public can submit contact requests" on public.contact_requests;
create policy "Public can submit contact requests" on public.contact_requests
  for insert to anon, authenticated with check (true);

drop policy if exists "Public can submit order requests" on public.order_requests;
create policy "Public can submit order requests" on public.order_requests
  for insert to anon, authenticated with check (accepted_terms = true);

revoke all on public.contact_requests from anon, authenticated;
revoke all on public.order_requests from anon, authenticated;
grant insert on public.contact_requests to anon, authenticated;
grant insert on public.order_requests to anon, authenticated;
grant usage on sequence public.contact_requests_id_seq to anon, authenticated;
grant usage on sequence public.order_requests_id_seq to anon, authenticated;
