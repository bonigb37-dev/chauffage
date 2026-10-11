-- Enable INSERT notifications for existing, RLS-protected messaging.
-- No customer record or access permission is changed.
begin;
do $$
begin
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='support_messages' and c.relrowsecurity) then
    raise exception 'Apply supabase-support.sql first';
  end if;
  if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
    raise exception 'Supabase Realtime publication is missing';
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='support_messages') then
    alter publication supabase_realtime add table public.support_messages;
  end if;
end $$;
commit;
