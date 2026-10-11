# Customer messaging

The new `/de/aide`, `/fr/aide`, `/en/aide` pages are linked from the footer and FAQ. A confirmed customer account is required. Guests can still use the existing contact form. Administrators, super administrators and the owner reply from the new messaging panel in their workspace.

## Activation

1. In the existing Supabase project, open SQL Editor and run **supabase-support.sql** in full. It requires the previously installed admin/security migrations. It creates a new table and does not modify existing customer records.
2. Deploy the application normally to the current Vercel project. It uses the existing server-only Supabase secret and persistent quota RPC; no new API key is required.
3. In a separate test project, create confirmed accounts A and B and an administrator. Send distinct messages with A and B. Check each account sees only its own conversation, and requests targeting the other account return 403. Check clients cannot open the administrator inbox or write directly through the Supabase Data API. Check an administrator can reply and the intended client sees that reply.

Messages are plain text, not HTML. Server verification establishes ownership and sender roles; browser flags cannot grant administrator access. RLS additionally restricts direct reads; browsers have no direct write privilege. Message bodies must be 1–3000 characters. The existing database-backed rate limiter protects the API. Signed-in accounts require confirmed email.

## Behavior and limits

This is asynchronous account messaging, not an AI assistant or a live chat. Replies are displayed in the account messaging page; no email notification is sent and no automated translation is performed. The interface is German/French/English, and the administrator sees the customer's language. It refreshes every 30 seconds while the page is visible, with a manual refresh button. Only the latest 100 messages of a conversation are shown. The inbox lists conversations appearing in the latest 500 messages and identifies them by customer ID and preview. No attachment, payment-state change, unread counter, automatic response, delivery guarantee or offline notification is included.

The SQL table cascades on customer account deletion. No automatic message retention period has been configured. Include support correspondence in the privacy-policy review and decide on retention before broad rollout.

## Verification

`node scripts/verify-support.cjs` exercises the real API handlers against mocked authentication/database: account A/B isolation, administrator authorization, spoofed sender fields, validation, denial by the quota guard and service failure. It performs no production writes. SQL checks in that script are static, not a substitute for testing RLS in a separate Supabase test environment.

`node scripts/verify-support-browser.cjs http://localhost:3002 --security` checks DE/FR/EN guest pages, mobile layout, then intercepts all Supabase/API requests for a simulated signed-in session. It verifies reading a reply, sending a message and rendering HTML as plain text, without saving any real message.
