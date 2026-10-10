# Revue de sécurité — 10 octobre 2026

Périmètre : boutique Bren-nholz, code courant et vérifications distantes en lecture seule. Aucun client réel créé, aucun mot de passe modifié, aucune commande, aucun paiement ni e-mail réel déclenché. Design, textes visibles et avis clients conservés.

## Corrections

- CSP avec nonce aléatoire par réponse. Scripts sans nonce refusés ; scripts Next.js et JSON-LD autorisés. Connexions limitées au site et au projet Supabase configuré. Les styles inline restent autorisés pour conserver Tailwind/Framer Motion ; les images HTTPS restent autorisées pour le catalogue et le visuel existant.
- Protection contre l’intégration dans des iframes, `nosniff`, politique de référent et permissions limitées. HSTS de production conservé. Pas de cache pour comptes, administration, confirmation et API.
- Contrôles d’origine sur les API ; limite effective du flux de requête, y compris quand Content-Length est absent ou mensonger ; limites de rafales par instance serveur. Aucun identifiant IP brut conservé dans ces compteurs.
- Contact/devis transmis à `/api/contact` : validation des types, longueurs, e-mail, sujet et code postal ; liste explicite des champs insérables. Le devis utilise le sujet autorisé `quote` (l’ancien sujet libre contredisait la contrainte SQL).
- Liens de dépôt de justificatif signés, liés à la référence et limités à 30 jours. Ancien format accepté uniquement pour une commande de moins de 30 jours. Lecture des preuves réservée aux rôles admin, super_admin et owner, avec URL signée de 60 secondes ; erreurs de rôle refusées.
- PostCSS utilisé par Next.js corrigé vers la branche 8.5.29 compatible via un override npm. `npm audit --omit=dev` : zéro vulnérabilité signalée à la date de l’audit.
- Build refusé si une clé Supabase privilégiée ou une variable de secret est placée sous `NEXT_PUBLIC_`.

## Vérifié et déjà correct

- Prix, total et disponibilité recalculés sur le serveur ; identification du client par `auth.getUser()`, jamais par un user_id fourni dans le panier.
- Création atomique de commande réservée au service_role dans le SQL. Paiement initial `pending` ; confirmation par RPC avec contrôle administrateur côté base. Un dépôt de fichier ne modifie aucun état de paiement. Le paiement en ligne est désactivé : aucun webhook de prestataire à vérifier.
- React échappe les textes des formulaires/administration ; le JSON-LD échappe `<`. Requêtes Supabase paramétrées, aucune construction de SQL à partir des saisies.
- Scripts SQL : RLS sur les données personnelles, commandes/adresses limitées au propriétaire, droits administrateurs contrôlés en base et non par le seul affichage du navigateur.
- Projet Supabase lu depuis la configuration locale : lectures anonymes testées sans donnée retournée sur neuf tables sensibles (refus ou liste vide), confirmation e-mail activée, inscriptions autorisées, bucket payment-proofs privé.
- Aucun motif de clé privée trouvé dans 407 objets texte de l’historique Git. Aucun secret configuré côté serveur trouvé dans les 58 fichiers JS/map générés pour le navigateur. Ce contrôle par motifs n’est pas une preuve exhaustive de l’absence de tout secret.

## Actions externes restantes

1. **Remplacer la clé secrète Supabase précédemment partagée dans la conversation.** Elle n’apparaît pas dans le dépôt testé, mais doit être considérée comme divulguée. Mettre la nouvelle valeur uniquement dans `SUPABASE_SERVICE_ROLE_KEY` sur Vercel et en local, redéployer, puis révoquer l’ancienne. Ne jamais la transmettre dans un message ou une capture. La rotation invalide les anciens jetons de dépôt signés avec cette clé ; prévoir l’assistance aux clients concernés.
2. Appliquer `supabase-security.sql` dans le SQL Editor, après les trois migrations existantes. Ce script retire les insertions directes contact/commandes depuis le navigateur. **Non appliqué par cet audit** : aucun accès SQL d’administration disponible ; aucune écriture distante réalisée. Tant que ce script n’est pas appliqué, un ancien droit d’insertion contact peut permettre de contourner la nouvelle API. Ne pas réexécuter ensuite l’ancien `supabase-forms.sql` seul.
3. Dans Vercel Firewall, ajouter une limitation persistante par IP pour les POST `/api/checkout`, `/api/contact`, `/api/withdrawal`, `/api/payment-proof`, et une limite séparée adaptée à `/api/address-suggestions`. Commencer en observation pour éviter de bloquer les clients. Les compteurs du code sont **en mémoire par instance**, se réinitialisent aux démarrages et ne remplacent pas un quota distribué.
4. Dans Supabase Authentication, vérifier la politique de mots de passe (longueur recommandée au moins 12), les limites de connexion/récupération, les durées de session/JWT et l’activation de protections contre les mots de passe compromis/MFA administrateur selon les possibilités du projet. Aucun réglage distant modifié. Supabase traite les mots de passe côté service ; le site ne les conserve pas. Vérifier SMTP personnalisé, expéditeur/DNS et URLs exactes de confirmation/récupération. Resend pour rétractations est une configuration distincte.
5. Refaire un essai contrôlé avec deux comptes de test et un administrateur dans un projet de test : isolation des commandes/adresses, promotion/révocation, connexion/déconnexion sur deux onglets et réinitialisation reçue par e-mail. Aucun environnement isolé ni identifiant de test fourni ; ces tests réels restent non effectués.

## Limites importantes

- Session Supabase dans localStorage, avec repli en mémoire : **pas de cookie de session HttpOnly** dans cette architecture. Les jetons sont accessibles à du JavaScript exécuté sur le site ; la CSP réduit le risque XSS, sans supprimer ce risque. Les API authentifiées utilisent un Bearer vérifié côté serveur ; elles ne reposent pas sur un cookie automatiquement envoyé, ce qui limite le CSRF classique. La déconnexion Supabase invalide les jetons de rafraîchissement ; un JWT d’accès déjà émis peut subsister jusqu’à expiration.
- Panier en localStorage/sessionStorage, récapitulatif de confirmation en sessionStorage : données modifiables par le navigateur, non assimilables à un backend sécurisé ni à une preuve de réception du paiement. Les commandes du compte proviennent de la base avec RLS ; le serveur recalcule les montants. Le panier n’est pas synchronisé entre appareils.
- Isolation RLS inspectée dans les scripts et lectures anonymes testées ; politiques installées exactes, tests interclients authentifiés, paramètres complets de sessions/mots de passe et limites Auth de production non vérifiables sans accès dédié.
- Alerte npm restante : `braces` 3.0.3 et quatre dépendances dev associées à ESLint. Aucun correctif officiel disponible au jour du contrôle. Ce chemin sert aux motifs de fichiers du lint, pas aux saisies HTTP du site. Ne pas exécuter des motifs/configurations de lint non fiables ; surveiller la publication du correctif. Ne pas utiliser `npm audit fix --force` pour rétrograder Next/ESLint.

## Tests

- `node scripts/verify-security.cjs` : origines interdites, quotas, longueur/IP falsifiés, signatures falsifiées/expirées, champs contact, session falsifiée et lecture des preuves admin ; appels Supabase intégralement simulés. Vérifications SQL textuelles, pas exécution d’une migration.
- `verify-commerce.cjs`, `verify-auth-links.cjs`, `verify-admin-access.cjs` : commerce, confirmation/récupération, rôles ; pas d’e-mails ni de données réelles écrites.
- `verify-seo.cjs` : pages publiques/privées, JSON-LD, canonical, sitemap et préservation des avis.
- `verify-seo-browser.cjs BASE --security` : ressources nécessaires, interactions existantes et injection d’un script sans nonce dans une réponse HTML interceptée uniquement dans le navigateur de test.
- Compilation Next.js et ESLint ciblé ; lecture seule des en-têtes et de la configuration distante. Les résultats locaux ne constituent ni un pentest exhaustif ni une garantie de sécurité absolue.

Sources officielles : [CSP Next.js](https://nextjs.org/docs/app/guides/content-security-policy), [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [limites Auth](https://supabase.com/docs/guides/auth/rate-limits), [en-têtes Vercel](https://vercel.com/docs/headers/request-headers), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [alerte braces sans correctif](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
