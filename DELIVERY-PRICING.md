# Livraison en Allemagne — politique actuelle au 13 octobre 2026

Les barèmes payants précédents sont remplacés par une livraison à 0,00 € pour toute commande livrée en Allemagne. Aucun calcul de distance, de région ou de code postal ne détermine désormais des frais.

Les prix des 75 produits restent identiques et sont TTC. La TVA comprise est extraite du prix, jamais ajoutée. Le total est la somme des prix TTC multipliés par les quantités.

La recherche d’adresse reste disponible pour saisir une adresse allemande ; elle ne calcule plus de tarif routier. Les liens des régions restent disponibles pour rechercher une ville.

Les nouvelles commandes enregistrent `customer.deliveryFeeCents: 0`, `customer.vat` et `items[].vat_rate`. La fonction Supabase existante contrôle déjà la somme des produits lorsque `customer.delivery` est absent ; aucune migration ni réécriture des anciennes commandes n’est nécessaire. Les anciens frais enregistrés restent consultables pour les commandes historiques.

Voir [le rapport de validation](TTC-VAT-DELIVERY-REPORT.md). Les fichiers SQL historiques sont conservés comme historique de migration.
