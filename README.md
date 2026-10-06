# ThermoPro — site professionnel de chauffage

## Installation

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Personnalisation

- Nom et logo : `components/Navbar.tsx`
- Coordonnées : `components/Footer.tsx`, `components/ContactCTA.tsx`, `app/contact/page.tsx`
- Produits : `lib/products.ts`
- Couleurs : `app/globals.css`
- SEO : `app/layout.tsx`

## Production

```bash
npm run build
npm start
```

## Paiement par virement

Le client envoie une demande de commande qui est enregistrée dans Supabase. L’entreprise doit ensuite confirmer la disponibilité, les frais de livraison et ses coordonnées bancaires avant que le client effectue le virement. Le formulaire ne prélève aucun paiement.

## Comptes clients Supabase

La page `/compte` permet de créer un compte, se connecter, se déconnecter et récupérer un mot de passe. Pour activer ces fonctions :

1. Créer un projet Supabase et activer le fournisseur d’authentification par e-mail.
2. Copier `.env.example` vers `.env.local`, puis renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` depuis la fenêtre Connect du projet Supabase.
3. Dans Supabase, définir l’URL du site et autoriser les redirections vers `/compte` (par exemple `http://localhost:3000/compte` en local et l’URL de production).
4. Redémarrer le serveur Next.js après la configuration.

La clé publishable est destinée au navigateur et reste protégée par les règles RLS. Ne jamais placer une clé secrète dans une variable `NEXT_PUBLIC_`. L’historique des commandes n’est pas encore associé aux comptes clients.

### Formulaires contact et commande

Dans le SQL Editor du projet Supabase, exécuter le script [`supabase-forms.sql`](./supabase-forms.sql). Il crée les tables `contact_requests` et `order_requests`, avec une politique RLS qui autorise uniquement l’insertion publique. Les demandes peuvent ensuite être consultées depuis le tableau de bord Supabase. L’URL Supabase peut être saisie avec ou sans le préfixe `https://`.

### Administration et niveaux d’accès

1. Dans Supabase **SQL Editor**, exécuter [`supabase-forms.sql`](./supabase-forms.sql), puis [`supabase-admin.sql`](./supabase-admin.sql), dans cet ordre.
2. Créer le compte du propriétaire dans `/compte` et le connecter une première fois.
3. Dans Supabase **Authentication → Users**, copier l’UUID de ce compte. Dans `supabase-admin.sql`, remplacer `PASTE-AUTH-USER-UUID-HERE` dans la dernière instruction commentée par cet UUID, enlever `--` au début de l’instruction et exécuter cette instruction seule.
4. Le propriétaire se connecte au site et ouvre `/super-admin`. Il peut alors attribuer les rôles aux autres comptes Supabase. L’espace `/admin` reste accessible aux deux rôles, mais n’indique jamais qu’un super administrateur existe.

Les admins simples utilisent `/admin` pour créer, modifier, supprimer et gérer le stock des produits, modifier les coordonnées de virement, traiter les commandes et demandes de contact, voir les comptes inscrits et consulter l’activité des comptes clients. Le script installe un déclencheur Supabase qui copie chaque nouvelle inscription Auth dans `client_accounts` et importe aussi les comptes existants. Ils ne peuvent ni gérer les rôles ni consulter le journal privé. Le super admin utilise `/super-admin` pour attribuer les rôles `admin` et `super_admin`, consulter toutes les inscriptions et connexions, et consulter le journal des actions administratives. La base masque les comptes super admin de l’activité visible aux admins simples et réserve le journal aux super admins via RLS; masquer un lien dans l’interface ne constitue pas la protection.

Les produits restent chargés depuis `lib/products.ts` comme catalogue initial; les créations, modifications et suppressions faites dans l’administration sont conservées dans Supabase et fusionnées dans la boutique. Les changements de coordonnées de virement sont affichés dans le panier et la commande.

Le panier inclut le prix produit de 499 € pour la palette EPH. Les frais de livraison restent hors paiement et sont confirmés séparément. Le sous-total enregistré est indicatif ; l’entreprise doit confirmer le prix, la disponibilité et les frais avant d’accepter la commande. Le stock de 89 palettes est une valeur de catalogue et n’est pas décrémenté automatiquement.
