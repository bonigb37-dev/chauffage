-- Apply after supabase-forms.sql, supabase-admin.sql and supabase-commerce.sql.
-- Permission changes only: no customer records are inserted, modified or deleted.
begin;

-- Contact and quote requests now use the validated /api/contact server endpoint.
-- Remove the direct Data API path that would bypass its validation and quotas.
drop policy if exists "Public can submit contact requests" on public.contact_requests;
revoke insert on public.contact_requests from anon, authenticated;
revoke usage on sequence public.contact_requests_id_seq from anon, authenticated;
grant insert on public.contact_requests to service_role;
grant usage on sequence public.contact_requests_id_seq to service_role;

-- Prevent rerunning the older forms setup from reopening browser order inserts.
drop policy if exists "Public can submit order requests" on public.order_requests;
revoke insert on public.order_requests from anon, authenticated;

-- Payment proofs are served only through short-lived administrator signed URLs.
update storage.buckets set public = false where id = 'payment-proofs';
commit;
