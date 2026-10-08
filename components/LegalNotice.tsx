import Link from 'next/link';

export default function LegalNotice() {
  return (
    <section aria-labelledby="legal-notice-title" className="border-t border-stone-200 bg-stone-50 py-10 sm:py-14">
      <div className="container">
        <h1 id="legal-notice-title" className="text-3xl font-black text-gray-950">Avis juridique</h1>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h3 className="text-lg font-bold text-gray-950">Bren-nholz</h3>
            <dl className="mt-4 space-y-4 text-sm leading-6 text-gray-700">
              <div><dt className="font-semibold text-gray-950">Adresse</dt><dd><address className="not-italic">Brauerstraße 3<br />66663 Merzig, Allemagne</address></dd></div>
              <div><dt className="font-semibold text-gray-950">Contact</dt><dd><a href="mailto:kontakt@interpl.de" className="break-all text-orange-700 underline underline-offset-4">kontakt@interpl.de</a></dd></div>
              <div><dt className="font-semibold text-gray-950">Téléphone</dt><dd><a href="tel:+4915213058561" className="text-orange-700 underline underline-offset-4">+49 1521 3058561</a></dd></div>
              <div><dt className="font-semibold text-gray-950">Numéro de TVA intracommunautaire</dt><dd>DE334074243</dd></div>
              <div><dt className="font-semibold text-gray-950">Activités</dt><dd>Vente de bois de chauffage, de granulés de bois et de machines agricoles.</dd></div>
            </dl>
          </div>
          <div className="space-y-4 text-sm leading-7 text-gray-700">
            <p>Toutes les commandes passées sur le site <Link href="/" className="font-semibold text-orange-700 underline underline-offset-4">Bren-nholz</Link> sont soumises aux <Link href="/agb" className="text-orange-700 underline underline-offset-4">conditions générales de vente de Bren-nholz</Link>.</p>
            <p>La livraison prend généralement de <strong>2 à 4 jours ouvrés</strong> après validation du paiement. Elle est <strong>incluse dans le prix des produits pour toutes les commandes</strong>, sans frais supplémentaires à régler au transporteur.</p>
            <p>Le site Bren-nholz utilise des cookies pour améliorer l’expérience utilisateur et proposer des contenus et des offres personnalisés.</p>
            <p>Conformément au <strong>Règlement général sur la protection des données (RGPD)</strong>, vous disposez d’un droit d’accès, de rectification, d’effacement et de limitation du traitement de vos données personnelles. Pour exercer vos droits, contactez-nous par e-mail à <a href="mailto:kontakt@interpl.de" className="text-orange-700 underline underline-offset-4">kontakt@interpl.de</a> ou via le <Link href="/contact" className="text-orange-700 underline underline-offset-4">formulaire de contact</Link>.</p>
            <p>Toutes les relations juridiques relatives à l’utilisation du site Bren-nholz sont régies exclusivement par le droit allemand.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
