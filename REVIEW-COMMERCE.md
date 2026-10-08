# Corrections de la boutique — 8 octobre 2026

Les avis, notes, dates, compteurs et éléments visuels associés ont été préservés. Les coordonnées bancaires stockées dans Supabase n’ont pas été modifiées.

## Fichiers et changements

- `lib/catalog.ts`, `lib/server-catalog.ts`, `lib/products.ts`, `components/CartProvider.tsx`, `app/produits/[slug]/page.tsx` : résolution commune des prix et stocks, affichage des prix administrateur et données structurées Offer actualisées. Stock non quantifié = disponible ; stock administrateur à zéro = rupture. Aucun flux Merchant Center existant trouvé dans le dépôt.
- `components/ProductCard.tsx`, `components/ProductCatalog.tsx`, `components/ProductDetailAddButton.tsx` : retrait des mentions de disponibilité à confirmer, blocage des produits sans prix ou en rupture, compatibilité des liens de catégories du menu.
- `app/api/checkout/route.ts`, `components/CheckoutPageContent.tsx` : comparaison des prix du panier avec ceux du serveur, refus si un prix change, bouton explicitant l’obligation de paiement, achat invité conservé et liens juridiques.
- `components/PaymentMethods.tsx`, `components/CheckoutSuccessContent.tsx` : formulation de paiement demandée, lien de la comptable avec Bren-nholz, justificatif distinct de la réception effective des fonds.
- `lib/order-status.ts`, `components/AdminWorkspace.tsx`, `components/AccountPageContent.tsx` : statuts lisibles pour enregistrement, paiement en attente/reçu, préparation et expédition. Le formulaire administrateur demande la confirmation des fonds avant préparation/expédition. Les valeurs existantes en base sont conservées (`new`, `in_progress`, `done` et statut de paiement indépendant).
- `lib/store-config.ts`, `components/DeliveryInformation.tsx`, `components/CartPageContent.tsx`, `components/DeliveryZonesModal.tsx`, `lib/faq.ts`, `components/LegalNotice.tsx` : livraison incluse en Allemagne, 2 à 4 jours ouvrables après réception des fonds, accès camion et transpalette. Contacts actuels centralisés et conservés.
- `app/datenschutz/page.tsx`, `app/retractation/page.tsx`, `app/agb/page.tsx`, `lib/sales-terms.ts`, `components/PolicyPage.tsx`, `components/Footer.tsx` : confidentialité, rétractation/retours, CGV adaptées au parcours réel et liens permanents.
- `app/not-found.tsx` : vraie page 404 avec accueil et produits.
- `components/WithdrawalForm.tsx`, `app/api/withdrawal/route.ts`, `.env.example` : déclaration sans compte, récapitulatif puis confirmation, enregistrement dans les demandes de contact administrateur, confirmation téléchargeable et envoi par Resend lorsque configuré. Aucun remboursement ni changement de statut de commande automatique.
- `scripts/verify-commerce.cjs` : tests avec Supabase et e-mails simulés, sans commande ni paiement réel.

## Vérifications

- Compilation Next.js et TypeScript, contrôles ESLint des modifications.
- Tests simulés : catalogue avec prix administrateur, stock nul, produit supprimé, prix absent, prix modifié, total final, achat invité, justificatif et rétractation.
- Comparaison avec Git : sources des avis et zones de notes/avis des fiches produits inchangées.
- Inventaire des liens internes littéraux : aucune route manquante après ajout des pages juridiques.
- Contrôles HTTP locaux des nouvelles pages et d’une URL inexistante avant publication.
- Aucun e-mail réel envoyé et aucune commande réelle créée pendant les tests. Pas de test visuel automatisé dans un navigateur.

## Informations et configuration à compléter

1. Adresse logistique exacte de retour. L’adresse de contact n’a pas été présentée comme une adresse de dépôt confirmée. Les frais de retour sont pris en charge par Bren-nholz selon la confirmation du propriétaire, y compris pour les palettes.
2. Identité juridique complète de l’exploitant ; vérifier la titularité du numéro de TVA déjà présent. Le nom commercial a été conservé sans inventer une société.
3. Configurer `RESEND_API_KEY` et `WITHDRAWAL_FROM_EMAIL` (expéditeur réellement vérifié) dans Vercel, puis redéployer. Tant que ces paramètres manquent, la déclaration est enregistrée et la confirmation peut être téléchargée, mais l’accusé automatique par e-mail ne fonctionne pas. Cette limite doit être levée pour achever le dispositif de rétractation en ligne.
4. Formaliser le calendrier de conservation/suppression, les régions d’hébergement, les contrats de sous-traitance et les garanties des éventuels transferts de données. Aucun délai arbitraire ni purge automatique n’a été inventé.
5. Confirmer les coordonnées professionnelles et le domaine lorsqu’ils seront disponibles. Version française conservée. La clé Geoapify reste nécessaire pour les suggestions d’adresse.

Les vérifications ne constituent ni une garantie de conformité juridique ni une approbation par Google Merchant Center ou Google Ads.

## Sources de référence

- [BGB § 312j : commande avec obligation de paiement](https://www.gesetze-im-internet.de/bgb/__312j.html)
- [BGB § 356a : fonction électronique de rétractation](https://www.gesetze-im-internet.de/bgb/__356a.html)
- [BGB § 357 : retours et remboursements](https://www.gesetze-im-internet.de/bgb/__357.html)
- [Resend : API d’envoi d’e-mails](https://resend.com/docs/api-reference/emails/send-email)
