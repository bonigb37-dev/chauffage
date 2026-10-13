# Merchant Center — livraison payante

Le site facture désormais la livraison selon la distance routière depuis Aarstraße 5, 35756 Mittenaar, le conditionnement et les quantités. La livraison n’est plus incluse dans les prix produits. Les prix produits eux-mêmes sont conservés.

Le flux google-merchant.xml ne déclare plus de livraison DE à 0 €. Il transmet shipping_label :
- delivery_palettes : palettes, demi-palettes et conditionnements PackFix sur palette ;
- delivery_hors_palettes : autres conditionnements.

Ces étiquettes ne créent pas automatiquement de services de livraison dans Google.

Dans Merchant Center, ouvrir Livraison et retours et remplacer le service gratuit : pays Allemagne, EUR, tarifs payants basés sur la destination et les quantités, appliqués aux deux étiquettes. Google permet des zones par codes postaux ou régions et des tableaux avancés à deux dimensions. Les bornes de distance du site ne sont pas des zones géographiques reconnues automatiquement par Google. Il faut affecter les codes postaux aux zones et définir des montants qui ne sous-estiment pas les frais réels du checkout ; le calculateur routier du site n’est pas appelé par Merchant Center.

Barèmes et calculateur : https://www.brennholz-direk.de/de/frais-livraison

Hors palettes : 0–7 km 15 € ; >7–15 km 26 € ; >15–25 km 34 € ; >25–35 km 44 € ; >35–50 km 54 € ; >50 km 64 € + 1,50 € × (distance − 50).
Palettes : 0–100 km 45 € +30 € par palette supplémentaire ; >100–125 km 50 € +30 € ; >125–150 km 55 € +30 € ; >150–175 km 60 € +35 € ; >175–200 km 65 € +35 € ; >200–225 km 70 € +35 € ; >225–250 km 75 € +35 € ; >250 km 75 € +1,50 € × (distance −250) +35 € par palette supplémentaire.
Les composantes des paniers mixtes s’additionnent. Chaque demi-palette compte comme une palette de transport.

Le compte Merchant Center n’a pas été modifié par Codex. Ne pas déclarer ce paramétrage terminé avant vérification du compte. L’examen pour déclarations trompeuses demandé le 13 octobre 2026 reste un processus distinct : aucun nouvel examen n’est soumis par cette publication.

Sources :
https://support.google.com/merchants/answer/12577710?hl=fr
https://support.google.com/merchants/answer/6324484?hl=fr
