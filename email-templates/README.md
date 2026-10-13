# E-mails d?authentification Bren-nholz

Mod?les ? installer manuellement dans Supabase Authentication ? Email Templates. Ils ne sont pas appliqu?s au service par un d?ploiement Vercel.

| Mod?le | Fran?ais | Allemand |
| --- | --- | --- |
| Confirm signup | confirm-signup.fr.html | confirm-signup.de.html |
| Reset password | reset-password.fr.html | reset-password.de.html |

Objets fran?ais : ? Confirmez votre adresse e-mail ? Bren-nholz ? et ? R?initialisez votre mot de passe ? Bren-nholz ?.
Objets allemands : ? Best?tigen Sie Ihre E-Mail-Adresse ? Bren-nholz ? et ? Setzen Sie Ihr Passwort zur?ck ? Bren-nholz ?.

Choisir la langue souhait?e, coller tout le HTML dans le mod?le correspondant et sauvegarder. Garder Confirm email activ? et la variable {{ .ConfirmationURL }} intacte. Aucun message ne pr?sente un compte non confirm? comme d?j? actif. Il s?agit du message de confirmation envoy? apr?s inscription, pas d?un second e-mail automatique apr?s activation.

Dans Authentication ? Email/SMTP, activer le SMTP personnalis? avec les param?tres officiels du prestataire : adresse exp?diteur professionnelle, nom Bren-nholz, h?te, port, identifiant et mot de passe SMTP. Saisir les secrets uniquement dans le tableau de bord. Le domaine, l?adresse et le prestataire restent ? pr?ciser ; aucun param?tre n?est invent?. V?rifier SPF/DKIM, la configuration DMARC et d?sactiver le suivi des liens chez le prestataire.

Tester avec une adresse de test : r?ception, activation via le lien, espace personnel, puis r?cup?ration du mot de passe. Ne pas envoyer de message aux vrais clients pour ces essais.

Documentation : https://supabase.com/docs/guides/auth/auth-email-templates et https://supabase.com/docs/guides/auth/auth-smtp.
