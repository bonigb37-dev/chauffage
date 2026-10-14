# Restauration des contenus — 14 octobre 2026

Version : `4faab65628e0c5abb961fcfcb44cacdaa0a7e7f4`, dans `.worktrees/visual-identity-release`.

## Contenus rétablis

- Les 16 références conservées dans `lib/brennholzwerk-products.ts` sont reconnectées au catalogue : 75 produits au total. Les IDs, prix, descriptions, stocks et images de ces références sont repris sans modification.
- Les images B1 à B7 sont affichées individuellement dans la galerie, avec les deux images de chargement et livraison par camion. B5 conserve son extension JPG ; les autres images sont en WebP.
- Les 16 régions réapparaissent dans une grille de liens sur l’accueil et le catalogue, avec le camion de livraison et l’image B5 en arrière-plan.
- La vidéo de feu est réactivée en lecture automatique, en boucle et sans audio. Elle s’arrête hors écran et respecte la préférence de réduction des animations.
- Les couleurs restaurées précédemment, le nom Brennholz-direk et les traductions allemandes sont conservés.

## Fichiers publiés

`lib/products.ts`, `app/page.tsx`, `app/globals.css`, `components/Hero.tsx`, `components/LogisticsGallery.tsx`, `components/ProductsPageContent.tsx`, `components/Services.tsx`, `components/DeliverySection.tsx`, `public/B7.webp`, `scripts/verify-merchant-feed.cjs`.

Le test Merchant choisit désormais une référence sans galerie pour tester correctement le remplacement de son image, indépendamment de l’ordre du catalogue.

## Vérifications avant publication

- Build de production, TypeScript et ESLint des composants modifiés réussis.
- 75 produits vérifiés dans le flux Merchant, avec concordance des prix, descriptions, disponibilités, pages et images.
- Rendu à 390, 768 et 1440 pixels : neuf images de galerie, camion, 16 liens régionaux lisibles et aucun débordement.
- Les 16 pages régionales répondent en 200.
- Lecture réelle de la vidéo vérifiée : images qui avancent, mode muet, boucle et absence d’audio décodé.
- Préférence de réduction des animations : vidéo masquée et arrêtée, image de remplacement conservée.
- Aucune erreur JavaScript détectée pendant cette passe.

## Vérifications après publication

Les déploiements Vercel ont réussi. Les contrôles sur https://www.brennholz-direk.de confirment les 75 produits et leurs données Merchant, les 16 pages régionales accessibles, les images B1 à B7 et les camions, ainsi que la lecture silencieuse de la vidéo. Les rendus à 390, 768 et 1440 pixels et le mode de réduction des animations ont également été vérifiés sur le site public, sans erreur JavaScript détectée.

Aucune écriture dans Supabase, commande ou opération de paiement n’a été effectuée pour cette restauration.
