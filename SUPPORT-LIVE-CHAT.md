# Live support conversations

Run `supabase-support-realtime.sql` in Supabase SQL Editor after the messaging scripts. It adds only `support_messages` to the existing Supabase Realtime publication. RLS and permissions are unchanged; customers can read their own conversations and administrators can read customer conversations.

The signed-in browser subscribes to INSERT events using its existing Supabase session. Events trigger a fresh authorized `/api/support` request; websocket payloads are never rendered. Writes continue through the validated, rate-limited server API. No service key is sent to the browser.

Visible chat pages also refresh every 10 seconds, on network restoration and when the page becomes visible. This fallback works before Realtime activation and recovers missed events. Background tabs do not poll. Automatic refreshes preserve drafts and do not display a loading spinner. New messages scroll to the bottom only when the reader was already near the bottom or has just sent a message.

The connection indicator reports subscription status, not staff availability. An immediate staff response is not promised. Anonymous visitors still use the Contact form; live conversations require a confirmed customer account.

Local browser tests mock customer sessions and APIs, verify incoming messages without clicking Refresh, draft preservation, unread acknowledgement, and literal message text. No real message or email is sent. A two-account production/staging test of actual websocket delivery remains necessary after applying the publication script.

Supabase reference: https://supabase.com/docs/guides/realtime/postgres-changes
