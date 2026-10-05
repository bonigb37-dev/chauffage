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

### Administration

1. Exécuter [`supabase-admin.sql`](./supabase-admin.sql) après `supabase-forms.sql`.
2. Créer ou choisir le compte qui sera super administrateur dans `/compte`.
3. Dans Supabase **Authentication → Users**, copier son UUID. Dans le SQL Editor, remplacer `PASTE-AUTH-USER-UUID-HERE` dans la dernière instruction commentée de `supabase-admin.sql` par cet UUID et exécuter l’instruction.
4. Se connecter avec ce compte, puis ouvrir `/super-admin`. Cette page peut attribuer les rôles `admin` et `super_admin` aux UUID présents dans Authentication → Users.

Les administrateurs utilisent `/admin` pour consulter les demandes de contact et de commande, puis changer leur statut. Les règles RLS n’autorisent la lecture et la mise à jour des demandes qu’aux comptes inscrits dans `admin_roles` ; la clé publishable du navigateur ne donne pas ces droits à un visiteur.

Le panier inclut le prix produit de 499 € pour la palette EPH. Les frais de livraison restent hors paiement et sont confirmés séparément. Le sous-total enregistré est indicatif ; l’entreprise doit confirmer le prix, la disponibilité et les frais avant d’accepter la commande. Le stock de 89 palettes est une valeur de catalogue et n’est pas décrémenté automatiquement.
