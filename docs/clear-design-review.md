# Fonds clairs et typographie — 14 octobre 2026

Les grands fonds terracotta de l’accueil, de la présentation et de l’appel à commander sont remplacés par du blanc ou du gris clair. Les anciens accents marron et leurs variantes sont harmonisés en vert. Les boutons conservent un texte blanc sur fond vert ; les sections claires utilisent des textes foncés. La section de livraison utilise un fond ardoise, avec les images et les 16 liens régionaux conservés.

La typographie est unifiée autour des polices système, avec des titres à graisse 700, un interligne régulier et une meilleure répartition des lignes. Les textes allemands, informations de livraison, descriptions, prix, images, liens, métadonnées et gestionnaires d’actions sont inchangés.

Vérifications : build Next.js/TypeScript et ESLint réussis ; comparaison des arbres TypeScript de 19 composants confirmant des changements uniquement visuels.

Fichiers modifiés (20) :

- app/a-propos/page.tsx
- app/contact/page.tsx
- app/faq/page.tsx
- app/global-error.tsx
- app/globals.css
- app/produits/[slug]/page.tsx
- components/ContactCTA.tsx
- components/FaqSection.tsx
- components/Footer.tsx
- components/Hero.tsx
- components/Navbar.tsx
- components/PelletGuide.tsx
- components/ProductCard.tsx
- components/ProductCatalog.tsx
- components/ProductCategories.tsx
- components/ProductHeroShowcase.tsx
- components/Products.tsx
- components/ProductsPageContent.tsx
- components/Services.tsx
- components/TopTrustBanner.tsx

Contrôles navigateur réussis : 42 rendus sur 14 pages à 1440, 768 et 390 pixels, menu compact sur tablette et mobile, absence de débordement à 320 pixels, favoris et fenêtre photo. La mise à jour distante du formulaire de compte (63395e5) est conservée ; connexion, inscription et réinitialisation ont été revérifiées sur les trois tailles. Le parcours bancaire simulé reste valide.

Version : 2da23a536813ec5819dbc7a8ba8b1135b828fcfb.
