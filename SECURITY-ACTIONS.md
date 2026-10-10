# Suite des actions de sécurité

## Rotation prioritaire

La clé locale `SUPABASE_SERVICE_ROLE_KEY` est de type **secret Supabase `sb_secret_`**, pas un JWT legacy service_role. La clé `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` est publique, de type `sb_publishable_`, et reste en place. La rotation de la clé serveur ne nécessite pas de changer les clés de signature Auth/JWT.

1. Supabase, projet correspondant à `.env.local` : **Settings → API Keys → Secret keys**. Créer une nouvelle clé secrète, par exemple « Bren-nholz serveur ». Conserver l’ancienne pendant le basculement.
2. Remplacer uniquement `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`. Ne pas mettre cette clé dans une variable `NEXT_PUBLIC_`.
3. Vercel, projet du site actuel : **Settings → Environment Variables**. Modifier la variable existante pour Production ; mettre aussi à jour Preview/Development s’ils utilisent le même projet. Les environnements de test séparés doivent conserver leurs propres clés. Sauvegarder.
4. Vercel **Deployments → ⋯ → Redeploy** sur la version de production actuelle ; ne pas réutiliser le cache de build pour ce basculement. Attendre Ready.
5. Exécuter `powershell -NoProfile -File scripts/verify-key-rotation.ps1 -CheckDeployment`. Le test ne renvoie aucune clé : il vérifie le type, le changement local, l’accès Supabase sans lignes et une preuve HMAC que Vercel utilise la même clé que `.env.local`. Le diagnostic `/api/security-check` exige une signature d’une minute et ne lit aucune ligne ni ne modifie de données.
6. Lorsque `currentKeyWorks`, `localKeyChanged` et `deploymentUsesCurrentKey` sont vrais, supprimer l’ancienne clé dans Supabase **Secret keys**. Ne pas supprimer la nouvelle clé. La suppression est irréversible ; noter le nom/identifiant de l’ancienne clé, sans partager sa valeur.
7. Refaire le contrôle. Il faut `oldKeyRevoked: true` (401/403 pour l’ancienne) et `deploymentUsesCurrentKey: true`. Puis lancer le même script avec `-CheckDeployment -RemoveRevokedSnapshot` pour supprimer la référence locale chiffrée de l’ancienne clé.

Le fichier temporaire `.env.security-rotation-state` est ignoré par Git et chiffré avec la protection Windows de l’utilisateur courant. Les valeurs ne sont pas affichées. La rotation est **en attente de l’action de l’utilisateur**, pas accomplie par la préparation de ces fichiers.

Attention : les jetons de dépôt de justificatif déjà émis utilisent la clé serveur. La révocation ne supprime ni les commandes ni les preuves déjà stockées, mais l’application de la nouvelle clé invalide les anciens jetons de dépôt. Les clients concernés doivent contacter l’entreprise pour un envoi assisté. Ne pas conserver la clé divulguée pour accepter ces signatures.

## Migration revue et quota persistant

`supabase-security.sql` a été exécuté sur PostgreSQL local après les trois scripts existants, puis une seconde fois pour vérifier son idempotence. Il vérifie les prérequis RLS, retire les insertions contact/commandes directes et les mises à jour des montants, propriétaire et paiement, conserve `update(status)` pour l’administration et rend le bucket privé.

Le nouveau schéma `bren_security` contient uniquement des compteurs de quota : identifiants HMAC non réversibles de route/méthode/IP, nombre de requêtes et expiration. Le RPC `consume_api_rate_limit` est SECURITY DEFINER avec search_path vide, vérifie le rôle service_role et n’est exécutable que par lui. L’UPSERT atomique fournit une limite partagée entre les instances. Pas de repli en mémoire : panne ou migration manquante renvoie 503 plutôt que contourner le quota. Nettoyage limité des compteurs expirés, aucun accès aux commandes dans ce RPC.

**Ordre obligatoire :** exécuter le SQL dans le SQL Editor Supabase, après `supabase-forms.sql`, `supabase-admin.sql`, `supabase-commerce.sql`, puis déployer le code utilisant les quotas persistants. Le code courant déjà publié fonctionne avec cette migration ; le nouveau code de quota ne doit pas être publié avant elle. La rotation/diagnostic peut être publiée séparément.

Application distante non effectuée ici : pas d’accès SQL/Management API connecté. Le script n’insère/modifie/supprime aucun client ni aucune commande. Il change des permissions, crée le stockage de quota et le RPC, et modifie seulement l’attribut `public` du bucket. Le WAF Vercel reste utile contre les attaques volumétriques avant invocation serveur ; il ne remplace plus le quota PostgreSQL.

Après application, exécuter `supabase-security-check.sql` en lecture seule : ses booléens de permissions doivent être vrais, les RLS actives et le bucket privé. Faire examiner toute politique de lecture/modification supplémentaire et tout déclencheur de stockage faisant référence au paiement avant de déclarer la production vérifiée. Ce contrôle ne renvoie aucune ligne client. Les compteurs et droits seront vérifiés avant publication du code de quota.

## Isolation et paiement : résultats locaux

`node scripts/verify-security-database.cjs` installe les vrais scripts dans une base PostgreSQL locale jetable. Deux comptes synthétiques A/B, un admin et un super admin sont insérés uniquement là. Les fonctions d’identité Supabase sont reproduites à partir des claims ; les JWT et le service Auth Supabase ne sont pas exécutés par ce moteur.

- A et B lisent leur commande/adresse/compte ; aucune ligne de l’autre n’est lisible, y compris les lignes de commande et événements de paiement.
- Modification/suppression de l’adresse de l’autre refusées ; transfert de propriété et insertion sous l’identité de l’autre refusés ; édition de sa propre adresse autorisée.
- Modification du paiement/total, création directe de commandes et contacts, confirmation bancaire, élévation de rôle, modification du catalogue et accès au quota refusés aux clients.
- Administrateur : lecture des commandes et édition du statut conservées ; confirmation bancaire uniquement via la fonction autorisée, avec événement d’audit et idempotence.
- Super administrateur : gestion des rôles admin conservée ; création du rôle owner refusée.
- Ajout d’un objet de preuve dans le stockage local : paiement reste pending. Il passe confirmed seulement après l’appel autorisé de confirmation bancaire. Le code d’upload est aussi testé avec Storage simulé sans appel de mise à jour de paiement.
- Quota stocké en base : refus au-delà de la limite, expiration/remise à zéro, refus des appels clients et conservation après fermeture/réouverture de la base locale.

Il s’agit de tests SQL exécutés, pas seulement d’assertions textuelles, mais **pas de deux connexions Supabase réelles**. Aucun projet Supabase de test distinct n’est fourni ; ce test distant reste à réaliser après sa création, avec uniquement des comptes et commandes synthétiques. Ne pas exécuter les fixtures locales sur la production.

La réception fiable des fonds reste une vérification humaine du compte bancaire par un administrateur habilité. Un fichier, son nom ou une déclaration du navigateur ne prouve pas le crédit bancaire. Aucun webhook bancaire/prestataire connecté n’existe ; aucune confirmation automatique ne doit être ajoutée sur la base d’une preuve envoyée.

## SMTP reporté

L’utilisateur indique que le domaine n’est pas disponible. Aucun SMTP ni expéditeur fictif configuré. La confirmation par lien sécurisé et les URLs actuelles sont conservées. À la disponibilité du domaine : vérifier le domaine chez le prestataire SMTP, poser ses DNS SPF/DKIM et une politique DMARC, puis configurer Supabase Authentication → Email/SMTP avec les paramètres du fournisseur, expéditeur vérifié et nom d’affichage **Bren-nholz**. Garder Confirm email et `{{ .ConfirmationURL }}` ; désactiver le suivi des liens du fournisseur. Les mots de passe SMTP se saisissent dans Supabase, pas dans le chat ni le frontend. Tester confirmation et récupération sur des adresses de test après configuration.

Sources : [clés Supabase et rotation](https://supabase.com/docs/guides/getting-started/api-keys), [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [sécurité Data API](https://supabase.com/docs/guides/api/securing-your-api), [PostgreSQL local PGlite](https://pglite.dev/docs/).
