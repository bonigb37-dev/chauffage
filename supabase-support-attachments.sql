-- Apply after the support scripts. No existing message is changed.
begin;
alter table public.support_messages add column if not exists attachment_path text;
alter table public.support_messages add column if not exists attachment_name text;
alter table public.support_messages add column if not exists attachment_type text;
alter table public.support_messages add column if not exists attachment_size integer;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('support-attachments','support-attachments',false,3145728,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No browser storage permissions are granted. Upload/download use the
-- role-checked server endpoint, with conversation ownership verification.
drop policy if exists "support attachments server only" on storage.objects;
create policy "support attachments server only" on storage.objects as restrictive
for all to anon,authenticated
using (bucket_id <> 'support-attachments')
with check (bucket_id <> 'support-attachments');
notify pgrst,'reload schema';
commit;
