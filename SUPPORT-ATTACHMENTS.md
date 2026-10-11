# Private support attachments

Apply `supabase-support-attachments.sql` before deploying this version. It adds nullable attachment metadata to messages and a private `support-attachments` bucket. A restrictive Storage policy denies anonymous/authenticated direct access to this bucket, including access through unrelated permissive legacy policies. Service-side upload/download remains authorized by the conversation API.

One PDF, JPEG, PNG or WebP attachment (up to 3 MiB) can accompany a non-empty message. The server bounds the request stream, verifies MIME type against file signatures, generates an unpredictable storage name, and checks the authenticated user's conversation permissions. Filenames are sanitized display metadata. A failed message save attempts removal of the uploaded object; a process interruption can leave an orphan requiring later cleanup.

Downloads require a verified session and ownership or an administrator role. The server returns the file with download disposition, no-store, nosniff and a sandbox policy. No public or signed URL is exposed. Attachments are never included in notification emails and never change payment state.

Signature checks are not malware scanning. No antivirus service or automatic retention cleanup is configured. Files are not rendered inline.

Local mocked API tests cover valid PDF upload/download, anonymous and cross-account denial, administrator access, forged type, MIME mismatch, oversized files, and cleanup after a save failure. Browser tests check the picker and unsupported-file error alongside the existing chat paths. No real customer file is uploaded. A real exchange using test accounts remains to be verified after migration and deployment.
