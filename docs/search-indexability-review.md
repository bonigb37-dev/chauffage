# Référencement : contrôle du 18 octobre 2026

## Constats avant intervention

- L’accueil canonique `/de` répond en HTTP 200, avec du HTML et un titre allemand contenant Brennholz-direk.
- La racine redirige vers `/de` ; le domaine sans `www` redirige vers le domaine canonique.
- `robots.txt` autorise les pages publiques et annonce le sitemap.
- Le sitemap public contient 103 URL.
- Aucun `noindex` ni en-tête `X-Robots-Tag` bloquant n’a été relevé sur l’accueil.
- L’accueil ne contenait pas de données structurées `WebSite` ou `Organization`.
- Les recherches publiques effectuées n’ont pas fait ressortir le domaine. Ce constat ne prouve pas une absence de l’index Google : seule l’inspection de la propriété Search Console permettra de connaître son état et ses éventuels motifs d’exclusion.

## Corrections

- Titre de l’accueil commençant par la marque et description allemande explicite.
- Présentation visible de la marque dans l’introduction de l’accueil.
- Graphe JSON-LD `WebSite` et `Organization`, sans magasin physique ni avis inventés.
- Métadonnées Open Graph cohérentes avec la marque, la langue allemande et les URL canoniques.

## Vérification

`node scripts/verify-search-indexability.cjs <base>` contrôle robots, sitemap, absence de doublons, exclusion des pages privées du sitemap, identité structurée et chaque page du sitemap : réponse directe en 200, canonical correspondant et un seul H1. Il ne prouve pas une indexation dans Google.

## Étapes nécessitant le compte du propriétaire

1. Ajouter `https://www.brennholz-direk.de/` comme propriété avec préfixe d’URL dans Search Console, ou utiliser une propriété Domaine validée par DNS.
2. Valider la propriété. Pour une nouvelle validation par balise HTML, fournir la balise émise pour le compte du propriétaire afin de l’ajouter au site. Ne pas remplacer une validation existante sans vérifier son usage.
3. Envoyer `https://www.brennholz-direk.de/sitemap.xml`.
4. Inspecter `https://www.brennholz-direk.de/de`, lire le résultat et, si approprié, demander une indexation.

Ces étapes n’ont pas été exécutées : le propriétaire indique ne pas avoir accès à Search Console pour le moment. Aucune date ni position d’apparition dans Google ne peut être garantie.
