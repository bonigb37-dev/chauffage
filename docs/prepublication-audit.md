# Vérification avant publication — 14 octobre 2026

Validation effectuée sur une compilation de production locale, avec Next.js 15.5.27, dans Edge.

## Résultats

- Compilation de production, contrôle TypeScript et ESLint réussis.
- 32 pages et états vérifiés : pages publiques, catégories, accès administrateur sans connexion, panier vide, confirmation sans référence, compte et récupération de mot de passe, ainsi que les 404 de page, produit, catégorie et région inconnus.
- 112 liens internes vérifiés : aucune réponse HTTP d’erreur sur les destinations des liens.
- Aucune ancre locale manquante ni erreur JavaScript détectée pendant cette passe.
- Aucun contraste insuffisant détecté sur les textes contrôlés sur fond uni. Le contrôle ne mesure pas les textes sur photos ou dégradés et ne constitue pas un audit d’accessibilité complet.
- 11 scénarios d’interaction réussis : navigation depuis la 404 ; favoris, photos et ajout au panier ; quantités et suppression ; commande en cas d’échec ; compte et lien expiré ; contact en cas d’échec ; FAQ ; cookies ; menu mobile ; recherche ; recommandation du guide ; rétractation en cas d’échec.

## Corrections

- Fonds verts éclaircis à `#286044`, avec texte blanc lisible dans le pied de page et le menu mobile.
- Règle globale des liens déplacée dans la couche de base CSS pour respecter les couleurs propres aux boutons et liens.
- Contraste renforcé pour les boutons orange, les informations produit, le guide et les alertes du compte.
- Pages de récupération ajoutées pour les erreurs de rendu et les erreurs du layout, avec nouvelle tentative et liens de retour.
- La confirmation sans référence de commande affiche un état indisponible au lieu d’annoncer une commande réussie.

## Périmètre

Les erreurs de commande, contact et rétractation ont été simulées dans le navigateur : aucune commande ni déclaration réelle n’a été envoyée. Les envois d’e-mail, justificatifs de paiement et actions avec compte administrateur connecté ne sont pas validés par cette passe. Les nouvelles pages d’erreur générale ont été validées par la compilation ; aucune panne réelle du service n’a été provoquée pour les afficher.

Le site n’a pas été publié pendant cet audit.
