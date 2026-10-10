# Flux Google Merchant Center — Allemagne

URL après déploiement : **https://www.brennholz-direk.de/google-merchant.xml**

Remplacer l'URL HTML `/produits` par cette URL dans la source Merchant Center. Choisir Allemagne, allemand et EUR, puis lancer une récupération. Le format est RSS 2.0 XML UTF-8 avec l'espace de noms Google.

À déployer ensemble : `app/google-merchant.xml/route.ts` et `lib/merchant-feed.ts`. Le flux réutilise le catalogue serveur existant et `translations/de.json`. Les variables publiques Supabase déjà utilisées par la boutique doivent rester configurées dans Vercel. Aucun nouveau secret, compte ou service n'est nécessaire.

Les identifiants numériques existants restent stables. Prix et disponibilités utilisent les mêmes règles que les fiches produits : `priceAmount` en centimes et `stock === 0` pour une rupture; un stock non suivi est affiché disponible comme sur le site. Les modifications administratives et suppressions sont prises en compte à chaque récupération. Aucun cache de prix n'est ajouté.

Les produits sans prix de vente valide, traduction allemande révisée ou image exploitable sont omis et signalés dans les journaux Vercel. Une panne du catalogue renvoie 503 XML au lieu d'un flux vide, de tarifs anciens ou d'une page HTML.

Le prix correspond à l'unité vendue (sac, paquet, palette…), sans conversion par kilogramme ni réduction de volume. La livraison Allemagne à 0 EUR correspond à la livraison incluse annoncée sur le site. Aucun délai de transit n'est inventé. L'état `new` correspond aux données structurées existantes des fiches.

Les marques sont reprises uniquement lorsqu'elles sont explicitement nommées dans le produit. Aucune marque n'est attribuée aux formats RUF ou Pini-Kay. Le catalogue ne contient pas de GTIN ni de MPN fabricant vérifié. `articleNumber` est une référence boutique et n'est pas envoyé comme MPN. `identifier_exists=no` n'est pas ajouté : l'absence d'une donnée dans le code ne prouve pas l'absence d'identifiant fabricant.

Obtenir les GTIN/MPN exacts auprès des fabricants lorsque Google les exige. La conformité XML corrige le problème de format; elle ne garantit pas l'acceptation de chaque produit ou du compte. Les règles de retour et autres paramètres du compte Merchant Center restent à renseigner séparément.

La détection de langue exclut déjà les chemins terminant par une extension (`.xml`), donc aucune modification du middleware n'est nécessaire. Le flux reste allemand même avec un navigateur français ou anglais.

Vérification : `node scripts/verify-merchant-feed.cjs http://localhost:3002`. Le script vérifie aussi les données structurées des fiches; il n'envoie aucune commande et ne modifie aucune donnée client.

Références : https://support.google.com/merchants/answer/14987622 et https://support.google.com/merchants/answer/6324478.
