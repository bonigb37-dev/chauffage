# Livraison payante — 13 octobre 2026

## Règles appliquées

- Départ : Aarstraße 5, 35756 Mittenaar, Deutschland, confirmé par le commerçant.
- Distance routière aller en camion, calculée par Geoapify. Une adresse non reconnue ne produit pas de tarif supposé.
- Prix produits conservés ; frais de livraison TTC ajoutés au total avant la confirmation de commande.
- Hors palettes : 0–7 km 15 € ; >7–15 km 26 € ; >15–25 km 34 € ; >25–35 km 44 € ; >35–50 km 54 € ; au-delà, 64 € +1,50 € par kilomètre au-delà de 50. Exemple 60 km : 79 €.
- Palettes : barème fourni jusqu’à 250 km. Au-delà : 75 € +1,50 € par kilomètre au-delà de 250, puis 35 € par palette supplémentaire, après délégation du commerçant.
- Chaque palette, demi-palette ou conditionnement PackFix sur palette compte comme une palette transportée. Les composantes des paniers mixtes s’additionnent. Les bornes supérieures sont incluses ; les centimes kilométriques sont arrondis à la fin.

## Parcours et contrôles

Section de tarifs sur la page d’accueil et les services ; page /frais-livraison, liée au pied de page et aux informations livraison.

Le client calcule d’abord les frais à son adresse. Le panier et l’adresse sont liés à un tarif signé valable 15 minutes. Le montant final est affiché avant la confirmation avec obligation de paiement. Le serveur vérifie la signature, l’expiration, l’adresse, les quantités et les prix produits. Les changements de champs invalident le calcul affiché.

Les frais et la distance sont conservés dans customer.delivery, séparément des prix produits ; total_cents comprend les frais. L’administration, la confirmation et l’espace client affichent les frais. Les commandes historiques restent inchangées.

La clé GEOAPIFY_API_KEY est privée, chargée côté serveur. Elle a été configurée localement et le commerçant confirme l’avoir configurée en production. Elle n’est pas enregistrée dans Git. La migration supabase-delivery.sql a été appliquée par le commerçant ; un contrôle provoquant invalid_delivery a confirmé sa présence sans créer de commande.

## Validation

- Géocodage et itinéraire réels : Mittenaar → Römerberg 23, Francfort : 99,494 km, une palette 45 €.
- Tests : seuils, palettes supplémentaires, prolongations nationales, panier mixte, tarifs signés, expiration, modifications et erreurs du prestataire.
- Test PostgreSQL isolé : produits + frais, rejet des montants invalides, annulation des mouvements de stock en cas de rejet, anciens appels inchangés.
- Test navigateur mobile : 499 € +45 € =544 €, calcul sans commande, confirmation distincte puis affichage des frais. Les écritures de commande et de panier étaient interceptées ; aucune commande réelle n’a été créée.
- Compilation et lint ciblé.

## Merchant Center

Le flux retire l’ancien shipping DE à 0 € et transmet delivery_palettes ou delivery_hors_palettes dans shipping_label. Le compte Google doit appliquer des services payants selon les destinations et quantités. Ces étiquettes ne configurent pas le compte automatiquement. Voir MERCHANT-DELIVERY.md. Aucun nouvel examen Google n’a été soumis.
