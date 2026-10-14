# Paiement bancaire et textes de livraison — 14 octobre 2026

Le paragraphe commun sur l’accès carrossable, la zone de déchargement et le transpalette est absent du composant partagé et des conditions générales de vente dans la dernière version du dépôt. Les entrées de traduction correspondantes ont été supprimées. L’ancienne phrase indiquant l’usage du compte bancaire par la comptable a été retirée de la configuration, du bloc bancaire, des conditions de vente et des traductions.

Nouvelle instruction allemande : « Bitte überweisen Sie den Betrag anhand der folgenden Bankverbindung auf den unten angegebenen Namen unserer Buchhalterin. Geben Sie Ihre Bestellreferenz als Verwendungszweck an und laden Sie anschließend den Zahlungsbeleg hoch. » Les coordonnées bancaires elles-mêmes restent inchangées.

Le test de l’ancienne version reproduit une erreur de commande alors que la réponse de l’API est réussie, lorsque sessionStorage est bloqué. La confirmation est maintenant conservée en mémoire avec sauvegarde de session facultative ; la navigation est effectuée côté client. Le panier se vide une seule fois sur l’écran de confirmation. L’animation de chargement s’arrête à l’ouverture de cet écran. Les erreurs réelles de l’API restent affichées et conservent le panier.

Fichiers modifiés :
- components/PaymentMethods.tsx
- components/CheckoutPageContent.tsx
- components/CheckoutSuccessContent.tsx
- lib/store-config.ts
- lib/sales-terms.ts
- translations/de.json
- lib/pending-order.ts (nouveau)
- scripts/verify-checkout-transition.cjs (nouveau)

Vérifications : build Next.js/TypeScript réussi, ESLint des fichiers modifiés réussi, tests de traduction, de sécurité et du flux Merchant (75 produits) réussis. Test navigateur à 1440 et 390 pixels : validation de formulaire, passage à la confirmation, instructions de virement, formulaire de preuve, panier vidé et chargement arrêté, y compris avec stockage de session bloqué. Toutes les requêtes d’écriture du navigateur sont simulées ; aucune commande réelle, écriture Supabase ou opération bancaire effectuée. Les tests ne permettent pas d’identifier avec certitude le message exact initialement observé par le client, qui n’est pas disponible.

La correction finale est appliquée sur la mise à jour distante `7d47631`, en préservant les montants TTC, champs TVA et livraison, coordonnées et autres changements de cette version. Le test reproduit également l’erreur de stockage sur cette version avant correction.

Version publiée : `cbf7a8327adcb5b4189c88ab7363d2d479dff572`. Le contrôle final porte sur les 107 pages du sitemap de la version intégrée.

Publication confirmée : les deux déploiements Vercel sont réussis. Sur https://www.brennholz-direk.de, les 107 pages du sitemap ne contiennent plus les textes retirés. Le parcours avec commande simulée passe à 1440 et 390 pixels, y compris avec sessionStorage bloqué : confirmation bancaire, nouvelle consigne, formulaire de preuve, fin du chargement et panier vidé. Aucune commande réelle ni aucun virement n’a été effectué.

