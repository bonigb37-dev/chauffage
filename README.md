# Bren-nholz — site professionnel de chauffage

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

Le client envoie une demande de commande qui est enregistrée dans Supabase. La livraison en Allemagne est incluse dans les prix des produits. L’entreprise confirme la disponibilité et le montant de la commande avant le virement ; aucun paiement n’est demandé par le transporteur. Le formulaire ne prélève aucun paiement.

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
3. Dans Supabase **Authentication → Users**, copier l’UUID de ce compte. Dans `supabase-admin.sql`, remplacer `PASTE-AUTH-USER-UUID-HERE` dans la dernière instruction commentée par cet UUID, enlever `--` au début de l’instruction et exécuter cette instruction seule pour créer le premier `owner`.
4. Le propriétaire se connecte au site et ouvre `/super-admin`. Il peut alors attribuer les rôles aux autres comptes Supabase.

Trois niveaux de rôles sont disponibles (`admin`, `super_admin`, `owner`) avec étanchéité stricte garantie par les politiques RLS de la base de données :
- **Admin (`admin`)** : utilise `/admin` pour gérer le catalogue produits, les coordonnées bancaires de virement, traiter les commandes et messages de contact, et consulter l'activité des utilisateurs standards. Il ne voit ni les `super_admin` ni les `owner`.
- **Super administrateur (`super_admin`)** : accède à `/super-admin` pour attribuer et retirer les rôles `admin` et `super_admin`, voir l'activité des utilisateurs et des administrateurs, et consulter le journal d'audit administratif. Il ne voit pas les comptes ni les rôles `owner`, et ne peut pas créer ou modifier de rôle `owner`.
- **Owner (`owner`)** : rôle suprême accessible dans `/super-admin`. Il possède un accès complet, gère tous les rôles (y compris l'attribution de nouveaux `owner`), voit l'intégralité des activités et le journal d'audit complet. Seul un `owner` peut voir ou gérer d'autres `owner`.

Les produits restent chargés depuis `lib/products.ts` comme catalogue initial; les créations, modifications et suppressions faites dans l’administration sont conservées dans Supabase et fusionnées dans la boutique. Les changements de coordonnées de virement sont affichés dans le panier et la commande.

Le panier inclut le prix produit de 499 € pour la palette EPH. La livraison est incluse dans le prix des produits, sans supplément de transport. Les produits sur devis nécessitent une confirmation du prix, livraison incluse. Le stock de 89 palettes est une valeur de catalogue et n’est pas décrémenté automatiquement.
