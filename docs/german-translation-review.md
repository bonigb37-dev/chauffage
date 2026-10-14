# Révision des traductions allemandes — 14 octobre 2026

Les résidus détectés concernent la FAQ de retrait en entrepôt, les conditions de retour, le texte de chargement du catalogue, les libellés accessibles des favoris et du panier, les compteurs et les confirmations admin, ainsi que les noms de produits dans le suivi administratif des paniers.

Fichiers modifiés :
- `translations/de.json` : traductions manquantes et précisions des textes de chargement.
- `i18n/copy.tsx` : traduction ciblée des phrases dynamiques et du contenu de repli React Suspense.
- `components/ProductCard.tsx` : traduction de la fenêtre photo avant sa création par portail React.
- `components/CartDraftsPanel.tsx` : noms des produits affichés en allemand et repli allemand.
- `components/DeliveryRegionContent.tsx` : repli allemand.
- `scripts/verify-translation-copy.cjs` : tests adaptés au site exclusivement allemand, couvrant les 75 produits, les rôles admin/super admin/propriétaire, les confirmations, la FAQ, les conditions de vente et les textes de chargement.

Vérifications : compilation Next.js/TypeScript réussie, ESLint des fichiers modifiés sans erreur, tests de traduction et de flux Merchant réussis. Les 106 pages du sitemap répondent en 200 et ne présentent pas de résidus français détectés dans leur texte HTML. Les contrôles navigateur incluent les textes visibles et les attributs d’accessibilité.

Les données et messages saisis par les clients, valeurs de formulaire, gestionnaires d’événements et liens sont préservés. Aucune modification des couleurs, prix, règles métier, Supabase ou paiements.

Version : `80d327a67cf937193478544e944b134b2152f0e2`.

Les 20 pages et écrans contrôlés dans le navigateur passent à 1440 et 390 pixels, ainsi que les interactions de favoris, ouverture/fermeture de fenêtre photo et libellés du panier isolé. Aucune exception JavaScript détectée. Les menus admin/super admin/propriétaire et confirmations sont testés en rendu avec des données fictives ; les opérations administratives sur des comptes réels ne sont pas exécutées.

Publication confirmée : les deux déploiements Vercel sont réussis. Les 106 pages et les contrôles navigateur ciblés à 1440 et 390 pixels passent sur https://www.brennholz-direk.de, y compris la fenêtre photo, les favoris et le panier isolé, sans exception JavaScript détectée.

