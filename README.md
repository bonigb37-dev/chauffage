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

## Paiement Mollie

Le paiement redirige vers la page sécurisée Mollie. Le serveur crée la transaction et vérifie son état auprès de Mollie au retour du client. Le formulaire de livraison n’accepte que l’Allemagne (`DE`).

Pour tester le paiement :

1. Créer/activer le compte marchand Mollie de l’entreprise et récupérer une clé API de test dans son tableau de bord.
2. Copier `.env.example` vers `.env.local` et renseigner `MOLLIE_API_KEY` avec cette clé. Ne jamais placer une clé secrète dans le navigateur, dans Git ou dans le chat.
3. Activer Apple Pay, cartes bancaires et virement bancaire dans le profil Mollie. Google Pay apparaît avec le paiement par carte sur les appareils compatibles lorsqu’il est activé dans le profil.
4. En production, ajouter la clé API de production comme variable secrète `MOLLIE_API_KEY` chez l’hébergeur puis redémarrer le serveur.

Aucune clé API n’est présente dans ce dépôt. Apple Pay et Google Pay ne s’affichent que si le profil marchand et l’appareil du client sont compatibles. Mollie gère ces portefeuilles et le virement depuis son Checkout hébergé.

## Comptes clients Supabase

La page `/compte` permet de créer un compte, se connecter, se déconnecter et récupérer un mot de passe. Pour activer ces fonctions :

1. Créer un projet Supabase et activer le fournisseur d’authentification par e-mail.
2. Copier `.env.example` vers `.env.local`, puis renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` depuis les paramètres API du projet Supabase.
3. Dans Supabase, définir l’URL du site et autoriser les redirections vers `/compte` (par exemple `http://localhost:3000/compte` en local et l’URL de production).
4. Redémarrer le serveur Next.js après la configuration.

La clé `anon` est destinée à être utilisée dans le navigateur ; ne jamais y mettre la clé `service_role`. L’historique des commandes n’est pas encore associé aux comptes clients.

Le panier inclut le prix produit de 499 € pour la palette EPH. Les frais de livraison restent hors paiement et sont confirmés séparément. Le stock de 89 palettes est une valeur de catalogue ; il n’est pas encore synchronisé avec un système d’inventaire ni décrémenté automatiquement après une vente. Avant la mise en production, connecter les commandes et le stock à une base de données et traiter les webhooks Mollie pour le suivi des commandes même si le client ne revient pas sur le site.

Le formulaire de contact est actuellement une interface front-end. Pour recevoir réellement les demandes, connecter ensuite une API/email (Resend, Formspree, Supabase, etc.).
