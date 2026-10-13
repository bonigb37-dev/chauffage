# Rapport TTC, TVA et livraison — 13 octobre 2026

## Résultat

- Les 75 prix actuels sont strictement conservés. Prix TTC au catalogue, sur les fiches, au panier et à la commande ; aucune TVA supplémentaire au paiement.
- 71 références à 7 %, 4 références d’allume-feux à 19 % : 16, 17, 77 et 78. Le commerçant a confirmé 19 % pour 16, 17 et 78 ; 77 décrit déjà une préparation de bois et cire.
- TVA extraite du TTC, en centimes, arrondie sur le total de chaque taux. Exemple : 107,00 € TTC à 7 % = 100,00 € HT + 7,00 € de TVA. Un produit à 499,00 € reste à 499,00 € ; sa TVA comprise à 7 % est de 32,64 €.
- Livraison à 0,00 € pour toute commande en Allemagne. Calculateur, tarification routière et étiquettes payantes retirés. La recherche d’adresse, les villes et les liens régionaux restent disponibles.
- Aucun message « Livraison gratuite » ajouté au catalogue ou aux fiches. La seule phrase de livraison payante de la description 56 a été corrigée avec l’autorisation du commerçant. Les autres descriptions, noms et photos sont conservés.
- Compte Google Merchant Center non modifié. Le flux et les données structurées annoncent les prix TTC exacts et une livraison DE à 0,00 €.

## Classification fiscale

Sources primaires allemandes consultées : [UStG §12](https://www.gesetze-im-internet.de/ustg_1980/__12.html) et [annexe 2, positions 48a et 48b](https://www.gesetze-im-internet.de/ustg_1980/anlage_2.html). Le bois de chauffage et les déchets de bois, y compris les pellets et briquettes correspondant aux classifications citées, relèvent du taux réduit. Les préparations d’allumage à cire/paraffine sont traitées au taux standard. La classification utilise les types et compositions décrits au catalogue ; les trois incertitudes signalées ont reçu une réponse du commerçant avant application.

## Backend et conservation

- Le serveur vérifie les prix actuels et les stocks. Il calcule le total exclusivement à partir des prix TTC et quantités validés. Les frais et taux transmis arbitrairement par un client sont ignorés.
- Les nouvelles commandes enregistrent `customer.deliveryFeeCents: 0`, le détail des montants TTC/HT/TVA dans `customer.vat`, et les taux dans le tableau JSON `items`. Les confirmations, l’espace client et l’administration affichent ce détail enregistré.
- Aucune migration Supabase supplémentaire nécessaire : la fonction atomique déjà appliquée vérifie la somme des produits sans frais lorsque l’ancien objet `customer.delivery` est absent. Le comportement a été vérifié dans PostgreSQL isolé.
- Les 17 commandes présentes avant cette intervention ont été vérifiées par empreinte de leurs montants, client, livraison, articles et statuts : inchangées. Aucun test ne crée de commande réelle et aucune modification historique n’a été effectuée.
- Aucun générateur de facture ou envoi automatique d’e-mail de confirmation de commande n’existe actuellement dans le code. La confirmation affichée a été vérifiée ; les modèles d’authentification, le paiement et l’e-mail de rétractation restent inchangés. Les factures émises en dehors du site doivent utiliser ces montants TTC et ce détail de TVA.

## Tests réussis

- `npm run build` : compilation de production, vérification TypeScript et lint Next réussis. Avertissement existant sur plusieurs fichiers lockfile dans les dossiers parents, sans échec de compilation.
- ESLint ciblé sur les 32 fichiers TypeScript concernés : réussi.
- `node scripts/verify-commerce.cjs` : prix/stock, total exact, livraison 0, taux mixtes, taux et frais falsifiés ignorés, achats invité/connecté, session expirée rejetée, justificatif et rétractation simulés.
- `node scripts/verify-ttc-vat.cjs` : 75 prix comparés à la sauvegarde initiale, noms/images/descriptions conservés, extraction de TVA, arrondis mixtes et 17 anciennes commandes Supabase inchangées, lecture seule.
- `node scripts/verify-delivery-migration.cjs` : PostgreSQL isolé, nouveaux totaux TTC sans frais, métadonnées TVA enregistrées, anciennes commandes payantes conservées, annulation atomique des stocks sur erreur.
- `node scripts/verify-ttc-delivery-browser.cjs http://localhost:3005` : versions FR et DE, catalogue, panier/commande aux largeurs 390 et 1440 px, TVA 7/19 %, livraison 0, total exact, confirmation simulée, conditions traduites, absence de débordement horizontal et de requête vers le calculateur. Toutes les écritures de commande, paniers de suivi et statistiques sont interceptées.
- `node scripts/verify-merchant-feed.cjs http://localhost:3005` : 75 produits, XML valide, prix TTC exacts, traduction allemande, concordance des fiches et données structurées, TVA incluse, livraison DE 0 et images accessibles. Contrôles en lecture seule.

## Fichiers concernés

La liste ci-dessous couvre les fichiers modifiés, ajoutés et supprimés pour cette intervention. Les images et autres fichiers déjà présents mais non suivis par Git n’ont pas été ajoutés.

- Modifié : `DELIVERY-PRICING.md`
- Modifié : `MERCHANT-DELIVERY.md`
- Modifié : `app/api/checkout/route.ts`
- Modifié : `app/api/delivery-quote/route.ts`
- Modifié : `app/contact/page.tsx`
- Modifié : `app/datenschutz/page.tsx`
- Modifié : `app/frais-livraison/page.tsx`
- Modifié : `app/livraison/[region]/page.tsx`
- Modifié : `app/page.tsx`
- Modifié : `app/produits/[slug]/page.tsx`
- Modifié : `app/produits/page.tsx`
- Modifié : `components/AccountPageContent.tsx`
- Modifié : `components/AdminWorkspace.tsx`
- Modifié : `components/CartPageContent.tsx`
- Modifié : `components/CheckoutPageContent.tsx`
- Modifié : `components/CheckoutSuccessContent.tsx`
- Modifié : `components/ContactCTA.tsx`
- Modifié : `components/DeliveryInformation.tsx`
- Supprimé : `components/DeliveryPricingSection.tsx`
- Modifié : `components/DeliveryZonesModal.tsx`
- Modifié : `components/Footer.tsx`
- Modifié : `components/Navbar.tsx`
- Modifié : `components/PelletGuide.tsx`
- Modifié : `components/ProductCard.tsx`
- Modifié : `components/ProductCatalog.tsx`
- Modifié : `components/Services.tsx`
- Modifié : `components/TopTrustBanner.tsx`
- Supprimé : `lib/delivery-pricing.ts`
- Supprimé : `lib/delivery-quote-server.ts`
- Modifié : `lib/faq.ts`
- Modifié : `lib/merchant-feed.ts`
- Modifié : `lib/product-categories.ts`
- Modifié : `lib/products.ts`
- Modifié : `lib/sales-terms.ts`
- Modifié : `lib/store-config.ts`
- Modifié : `scripts/verify-commerce.cjs`
- Modifié : `scripts/verify-delivery-migration.cjs`
- Supprimé : `scripts/verify-delivery-pricing.cjs`
- Modifié : `scripts/verify-merchant-feed.cjs`
- Supprimé : `scripts/verify-paid-delivery-browser.cjs`
- Modifié : `translations/de.json`
- Modifié : `translations/en.json`
- Modifié : `translations/fr.json`
- Ajouté : `lib/vat.ts`
- Ajouté : `components/IncludedVatSummary.tsx`
- Ajouté : `scripts/verify-ttc-vat.cjs`
- Ajouté : `scripts/verify-ttc-delivery-browser.cjs`
- Ajouté : `reference/ttc-price-baseline.json`
- Ajouté : `reference/ttc-orders-baseline.json`
- Ajouté : `TTC-VAT-DELIVERY-REPORT.md`
