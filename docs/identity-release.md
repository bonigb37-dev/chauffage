# Modernisation de Brennholz-direk — 14 octobre 2026

Mise à jour : à la demande de l’utilisateur, la nouvelle palette a été annulée dans le commit `7c3cc44a70444bf39b38cdc81aa99ce0ed67d187`. Seul `app/globals.css` a été modifié pour restaurer les couleurs précédentes. La marque, les traductions et les corrections des liens ci-dessous sont conservées. Le build et le rendu à 390, 768 et 1440 pixels ont été vérifiés avant cette nouvelle publication.

Publication réussie sur https://www.brennholz-direk.de, commit `a681a19d6d073c252a9376ccb9981f4704a4db1c`. Les deux déploiements Vercel ont réussi. La version exacte est conservée dans `.worktrees/visual-identity-release`, à partir de la révision `4692569`. Les autres changements locaux en cours ne font pas partie de cette publication.

## Fichiers de la version publiée

- `app/globals.css` : palette terracotta, crème, vert forêt et blanc ; contrastes des boutons et cartes ; disposition tablette.
- `components/BrandWordmark.tsx`, `lib/store-config.ts` : nom de marque Brennholz-direk. Les coordonnées et l’identité juridique existantes sont conservées.
- `translations/de.json` : 191 libellés manquants traduits, principalement pour l’administration et les messages de confirmation.
- `i18n/copy.tsx` : traduction des messages administratifs dynamiques, sans traduire leurs identifiants, références ou adresses e-mail.
- `components/AdminSidebar.tsx`, `components/AdminConfirmModal.tsx` : application de la traduction aux menus et dialogues. Le texte à saisir pour une confirmation est conservé tel quel.
- `components/AdminWorkspace.tsx` : format allemand des montants et des dates.
- `components/Services.tsx` : restauration de l’ancre `livraison`, cible des liens de retour des 16 régions.
- `app/guide-granules/page.tsx`, `app/frais-livraison/page.tsx` : redirections permanentes des anciennes adresses vers le guide et les services existants.
- `lib/merchant-feed.ts` : correction du nom dans le titre et la présentation du flux ; aucune modification des données produit.

## Vérifications

- Compilation de production et contrôle TypeScript réussis. Les avertissements ESLint préexistants concernent des variables inutilisées dans des fichiers hors du périmètre modifié.
- Inventaire allemand : aucun libellé visible manquant, en conservant les noms propres et les chemins techniques.
- Tests de rendu des menus administrateur et des confirmations ; 191 traductions vérifiées.
- 45 affichages contrôlés sur 15 pages, à 390, 768 et 1440 pixels : aucun débordement ni défaut de contraste mesuré sur fond uni. Les textes sur photographies et dégradés ne sont pas tous mesurés automatiquement.
- Six parcours interactifs vérifiés : favoris, ajout au panier, validation des champs de commande, FAQ, préférences de cookies et menu mobile.
- 90 pages du sitemap, 79 liens internes et 145 ancres contrôlés : aucune anomalie.
- Flux Google Merchant : 59 produits vérifiés avec leurs pages, prix, disponibilités, descriptions et images accessibles.
- Anciennes adresses : réponses 308 vers des pages valides ; adresse inconnue : réponse 404 attendue.

## Contrôles après publication

- Domaine public : nouveau nom Brennholz-direk et ancre de livraison présents.
- 90 pages, 79 liens internes et 145 ancres vérifiés à nouveau sur le domaine public : aucune anomalie.
- Neuf affichages publics supplémentaires (accueil, catalogue et guide sur ordinateur, tablette et mobile) : aucun débordement ni défaut de contraste mesuré sur fond uni.
- Six interactions publiques réussies ; les écritures de panier et d’analytics ont été interceptées dans le navigateur de test.
- Flux Merchant et 59 pages produit et images vérifiés à nouveau après déploiement : prix, descriptions et disponibilités concordants.

Aucune commande, modification de rôle, opération de paiement ou écriture dans Supabase n’a été effectuée par ces tests. L’erreur de chargement des compteurs montrée dans la capture nécessite une vérification dans une session administrateur réelle ; elle n’est pas considérée comme résolue par la traduction.
