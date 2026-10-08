# Confirmation par lien et e-mails clients

Le lien standard Supabase confirme l’adresse via Supabase Auth. Le SDK traite le retour sécurisé et établit la session. Le site vérifie le résultat d’initialisation, la session correspondant au lien, puis `auth.getUser()`, `email_confirmed_at` et l’identité de la session avant d’afficher le message de réussite. Le paramètre `confirmed=1` seul ne suffit pas.

Les anciens liens revenant à l’accueil sont pris en charge globalement pour diriger le client vers `/compte`. Les liens invalides, expirés ou déjà utilisés proposent un nouveau lien. La récupération du mot de passe reste distincte. Le design et les avis sont préservés.

Avant commande, le texte annonce le virement après validation. Les coordonnées, instructions définitives et référence sont affichées après enregistrement réussi.

## Réglages Supabase

- Site URL : `https://bois-de-chauffage-de.vercel.app`.
- Autoriser les Redirect URLs `https://bois-de-chauffage-de.vercel.app/compte?mode=confirm` et `https://bois-de-chauffage-de.vercel.app/compte?mode=recovery`, en conservant les autres URLs utiles selon les environnements.
- Garder « Confirm email » activé. Le contrôle en lecture seule du projet configuré dans `.env.local` indique : e-mail activé, confirmation exigée et inscriptions autorisées.
- Modèles « Confirm signup » et « Reset password » : lien/bouton `{{ .ConfirmationURL }}`. Aucun code à saisir. Ne pas remplacer ce lien par la seule Site URL.

## SMTP pour les vrais clients

Le service par défaut de Supabase est destiné aux essais et limite les destinataires aux membres autorisés de l’organisation. Dans Supabase, configurer un SMTP personnalisé : adresse et nom d’expéditeur vérifiés, hôte, port, identifiant et mot de passe du prestataire. Configurer les enregistrements DNS d’authentification demandés (SPF/DKIM et politique DMARC adaptée). Désactiver le suivi des liens qui peut modifier les URLs d’authentification.

Les variables Resend pour les rétractations ne configurent pas le SMTP de Supabase Auth. Aucun réglage distant, identifiant SMTP ni modèle d’e-mail n’a été modifié. Aucun e-mail réel n’a été envoyé pour les tests ; un essai de réception chez un client reste nécessaire après configuration.

## Vérifications

`node scripts/verify-auth-links.cjs` : confirmation valide, session absente/ancienne, erreur d’initialisation, utilisateur non confirmé, identité différente, expiration, absence de jeton et récupération séparée. Clients Supabase simulés, aucune inscription ni modification de compte réelle.

`node scripts/verify-commerce.cjs` : vérifications commerciales et préservation des avis. Compilation Next.js et contrôles TypeScript/ESLint avant publication.

Sources : [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [redirections](https://supabase.com/docs/guides/auth/redirect-urls), [modèles](https://supabase.com/docs/guides/auth/auth-email-templates), [confirmation utilisateur](https://supabase.com/docs/guides/auth/users).
