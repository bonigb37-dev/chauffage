# Support notifications

## Activation

Run `supabase-support-notifications.sql` in the Supabase SQL Editor after `supabase-support.sql`. No existing message is modified or mailed by this migration. New support and contact inserts create notifications in a private SQL outbox atomically in the same transaction.

Configure these server-only Vercel Production variables using the SMTP information displayed for the mailbox in Hostinger hPanel:

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=kontakt@brennholz-direk.de
SMTP_PASSWORD=<mailbox password, Secret, never in chat or Git>
SMTP_FROM_EMAIL=kontakt@brennholz-direk.de
```

The host is an example for Hostinger Email; use the provider values shown in hPanel if different. Port 465 uses implicit TLS, 587 requires STARTTLS. Certificate verification remains enabled. Redeploy after setting the variables. These settings are separate from Supabase Auth SMTP and do not alter confirmation-email templates.

## Notifications

- Customer messages and anonymous contact forms notify the shop mailbox.
- Administrator replies notify the confirmed email address of that conversation's actual customer, read server-side from Supabase Auth. Browser-provided email addresses cannot choose the recipient.
- Emails contain only a brief notice and a fixed shop-domain login link, no message content, attachments or payment instructions. Customers receive DE/FR/EN notices according to the conversation language; administrator notices use German.
- An advisory transaction lock and SQL cooldown group messages by conversation/direction or hashed contact email: no more than one queued notice per 10 minutes for that group. A single notice covers subsequent messages in the same group.
- Next.js `after()` attempts delivery after a successful message response. No SMTP configuration means the queue remains pending. Network/authentication errors retain the job, make it retryable after 5 minutes, and never undo a received message.
- Administrators see queued-mail status and can retry one email per click. There is no automatic scheduled retry configured: if no new submissions occur, use this button after fixing SMTP. Add a secured scheduler later if unattended retries are required.
- Leases coordinate concurrent workers. SMTP acceptance is not proof of inbox delivery. Exactly-once delivery cannot be guaranteed if a process stops after SMTP acceptance but before the database acknowledgement.

## Unread badges

The client Help button displays unread administrator replies. The administration displays unread customer messages and contact requests with status `new`. Conversation reading is acknowledged only for the displayed customer/messages, not for the entire inbox. Each administrator has an independent read state. Contact requests stop counting when their existing status changes from `new`.

Counts update every 30 seconds on visible pages and immediately after acknowledging a conversation. Signed-out visitors receive no private count. Server-side authorization and service-only SQL functions prevent marking someone else's conversation read or dispatching emails as a customer.

## Tests and remaining checks

API and SMTP transport tests use mocks; no real client message or email is created. Browser checks also intercept API and Supabase calls. After activation, perform one coordinated test with a customer test account and the shop mailbox to verify actual SMTP delivery and unread-state persistence. No production test mail is sent automatically by the implementation workflow.

Review message/outbox retention and the privacy-policy notice for transactional email processing. Outbox metadata currently has no automatic cleanup policy. The contents of messages are never copied into email notifications.
