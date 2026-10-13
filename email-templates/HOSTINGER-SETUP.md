# Hostinger SMTP - Bren-nholz

Language selected: German. Sender and username: kontakt@brennholz-direk.de. Sender display name: Bren-nholz.

Supabase Dashboard > Authentication > Email > SMTP settings: enable custom SMTP. For Hostinger Email use smtp.hostinger.com, port 465 (SSL/TLS), full email address as username, mailbox password entered ONLY in Supabase. Confirm these values in Hostinger hPanel > Emails > Manage > Connect Apps and Devices; a Titan mailbox has different settings. No mailbox password belongs in the repository, .env.local or chat.

Hostinger: confirm mailbox exists and outgoing SMTP is supported by the purchased plan; check the domain's SPF, DKIM and DMARC with the values supplied in hPanel. Do not invent DNS values or create duplicate SPF records.

Supabase > Authentication > Email Templates > Confirm signup:
Subject: Bestätigen Sie Ihre E-Mail-Adresse - Bren-nholz
Body: paste all of confirm-signup.de.html.

Supabase > Authentication > Email Templates > Reset password:
Subject: Setzen Sie Ihr Passwort zurück - Bren-nholz
Body: paste all of reset-password.de.html.

Keep Confirm email enabled and {{ .ConfirmationURL }} unchanged. Keep the current Vercel Site URL and confirmation/recovery redirect URLs. A new email domain does not change the website URL. Disable email link tracking where available.

Save SMTP and templates, then test with a test address: delivery, sender identity, German text, secure confirmation and personal account redirect; next test forgotten password. Never test by sending messages to real customers. Remote configuration and actual delivery are not yet verified.

Sources:
https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/
https://supabase.com/docs/guides/auth/auth-smtp
https://supabase.com/docs/guides/auth/auth-email-templates
