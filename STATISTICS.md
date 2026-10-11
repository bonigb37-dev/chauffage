# Statistiques de la boutique

## Activation

1. Ouvrir le projet Supabase utilisé par le site, puis **SQL Editor**.
2. Copier tout le contenu de `supabase-analytics.sql` et cliquer sur **Run**.
3. Ouvrir `/de/admin#site-statistics` ou `/fr/admin#site-statistics` avec un compte administrateur.

Le script dépend des tables existantes `admin_roles` et `client_accounts`. Il est transactionnel et peut être exécuté plusieurs fois. Aucune nouvelle variable d'environnement n'est nécessaire : la collecte et les rapports utilisent la connexion serveur existante. Sans le script, le panneau indique que les statistiques ne sont pas encore activées ; aucune donnée fictive n'est présentée.

## Mesures

- Sessions de visite, pages vues, clients identifiés et sessions actives depuis cinq minutes.
- Évolution quotidienne sur 7, 30 ou 90 jours, selon le fuseau Europe/Berlin.
- Pages et sections consultées, appareil et domaine d'origine de la visite.
- Ajout au panier et envois réussis de contact, devis et commande.
- Liste paginée de sessions, parcours détaillé et export CSV des agrégats.

Une session n'est pas une personne unique. L'identifiant est stocké dans la session du navigateur, et renouvelé après 30 minutes sans événement. Les étapes commerciales comptent les sessions ayant atteint chaque étape ; elles ne constituent pas nécessairement un tunnel continu. Le temps actif est mesuré par intervalles sur une page visible et peut sous-estimer les visites courtes. La source est un domaine, sans URL complète ni attribution de campagne.

## Consentement et accès

La collecte est désactivée par défaut. Accepter les statistiques autorise une mesure anonyme. Une case séparée, décochée par défaut, permet de relier les nouvelles visites au compte client connecté. L'identité est vérifiée côté serveur ; un identifiant utilisateur fourni dans un événement est ignoré. Les visiteurs non connectés ne sont pas identifiés par un nom ou une adresse e-mail.

Le bouton **Choix des statistiques** du pied de page permet de refuser ou de retirer l'accord. Les changements sont propagés aux autres onglets. Les signaux Do Not Track et Global Privacy Control empêchent la collecte. Les pages d'administration, de compte et de messagerie privée sont exclues ; les visites des comptes administrateurs sont également exclues.

Les statistiques ne contiennent pas le contenu des formulaires, les données bancaires, les paramètres d'URL, les fragments, les adresses IP ou une empreinte du navigateur. Les préférences expirent après 180 jours. Les événements de plus de 90 jours sont purgés à la prochaine collecte, avec un contrôle quotidien. La suppression d'un compte retire son association aux événements conservés. Une demande d'effacement de données existantes doit être traitée par l'exploitant.

Les tables et fonctions SQL ne sont accessibles ni au rôle public `anon`, ni directement aux comptes `authenticated`. Seules les API serveur utilisent la clé de service. L'accès aux rapports exige un compte vérifié avec un rôle `admin`, `super_admin` ou `owner`.

## Vérifications

`node scripts/verify-analytics.cjs` teste la migration dans PostgreSQL isolé, les agrégations, les parcours, la pagination, les doublons, la purge et les autorisations API/base. `node scripts/verify-admin-locale-browser.cjs http://localhost:3102 --admin-only` teste le consentement et les statistiques avec des sessions fictives, sans données ni écritures de production.

Les visites historiques ne sont pas récupérables et les refus de consentement ne sont pas comptés.
