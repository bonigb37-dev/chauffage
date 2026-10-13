# Uncompleted cart tracking

Both administrator workspaces share the authenticated /api/cart-drafts list and removal endpoint. Client updates are serialized, debounced and retried without blocking shopping. Prices, product names and totals are built from the server catalogue; account identity comes only from verified authentication. Guest carts remain anonymous. Successful checkout closes the tracked cart without changing the order.

Storage: private Supabase bucket private-cart-drafts, JSON-only, 64 KiB object limit. The production bucket was configured on 2026-10-13. Server-only AES-256-GCM encryption also protects the contents; its key is derived from SUPABASE_SERVICE_ROLE_KEY. Rotating that key requires re-encrypting or discarding existing draft records. No browser contains the encryption key or the Storage service credential.

A random HttpOnly/SameSite cookie identifies the browser cart for 30 days. Administrative removal writes a separate closure marker before deleting the draft, so delayed requests cannot restore it. It removes the administrative record, not the visitor's local cart. Emptying the cart clears its cookie. Completed orders never appear as uncompleted carts.

The list refreshes every 30 seconds, paginates by 20 and distinguishes recent carts from carts unchanged for 30 minutes. On each administrative read, cleanup deletes up to 100 objects older than 30 days in each storage prefix. No marketing email is sent.

Checks: verify-cart-drafts.cjs uses mock storage for access rights, server prices, lifecycle and encryption. verify-cart-drafts-browser.cjs tests shopping and both administrative UIs using mock records. verify-cart-drafts-live.cjs creates one anonymous synthetic cart against the supplied URL, verifies encrypted Storage and lifecycle, and removes its files in finally; it never creates orders. It requires the workspace's .env.local service credential and does not print it.
