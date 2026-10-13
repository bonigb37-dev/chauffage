
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import { storeConfig, deliverySummary } from '@/lib/store-config';

export default function LegalNotice() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <section aria-labelledby="legal-notice-title" className="border-t border-stone-200 bg-stone-50 py-10 sm:py-14">
      <div className="container">
        <h1 id="legal-notice-title" className="text-3xl font-black text-gray-950">Avis juridique</h1>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 data-original-content className="text-lg font-bold text-gray-950">{storeConfig.name}</h2>
            <dl className="mt-4 space-y-4 text-sm leading-6 text-gray-700">
              <div><dt className="font-semibold text-gray-950">Nom commercial :</dt><dd data-original-content>{storeConfig.name}</dd></div>
              <div><dt className="font-semibold text-gray-950">Exploitant et responsable :</dt><dd data-original-content>{storeConfig.legalName}</dd></div>
              {storeConfig.legalForm && <div><dt className="font-semibold text-gray-950">Forme juridique</dt><dd>{storeConfig.legalForm}</dd></div>}
              {storeConfig.registrationNumber && <div><dt className="font-semibold text-gray-950">Numéro d’immatriculation</dt><dd>{storeConfig.registrationNumber}</dd></div>}
              
              <div><dt className="font-semibold text-gray-950">Siège social</dt><dd><address className="not-italic">{storeConfig.address}</address></dd></div>
              <div><dt className="font-semibold text-gray-950">Entrepôt et logistique en Allemagne</dt><dd><address className="not-italic">{storeConfig.warehouseAddress}</address></dd></div>
              <div><dt className="font-semibold text-gray-950">Contact</dt><dd><a href={`mailto:${storeConfig.email}`} className="break-all text-orange-700 underline underline-offset-4">{storeConfig.email}</a></dd></div>
              <div><dt className="font-semibold text-gray-950">Téléphone</dt><dd><a href={`tel:${storeConfig.phoneHref}`} className="text-orange-700 underline underline-offset-4">{storeConfig.phone}</a></dd></div>
              <div><dt className="font-semibold text-gray-950">Numéro de TVA intracommunautaire allemand (USt-IdNr.)</dt><dd>{storeConfig.vatNumber}</dd></div>
              <div><dt className="font-semibold text-gray-950">Activités</dt><dd>Vente de bois de chauffage, de granulés de bois, de briquettes et de produits d’allumage.</dd></div>
            </dl>
          </div>
          <div className="space-y-4 text-sm leading-7 text-gray-700">
            <p>Toutes les commandes passées sur le site <Link href="/" className="font-semibold text-orange-700 underline underline-offset-4">Bren-nholz — Leylines Park</Link> sont soumises aux <Link href="/agb" className="text-orange-700 underline underline-offset-4">conditions générales de vente de Bren-nholz — Leylines Park</Link>.</p>
            <p>{deliverySummary}</p>
            <p>Les données et le stockage nécessaires au panier et à la connexion sont décrits dans la politique de confidentialité.</p>
            <p>Conformément au <strong>Règlement général sur la protection des données (RGPD)</strong>, vous disposez d’un droit d’accès, de rectification, d’effacement et de limitation du traitement de vos données personnelles. Pour exercer vos droits, contactez-nous par e-mail à <a href={`mailto:${storeConfig.email}`} className="text-orange-700 underline underline-offset-4">{storeConfig.email}</a> ou via le <Link href="/contact" className="text-orange-700 underline underline-offset-4">formulaire de contact</Link>.</p>
            <p>Le droit allemand s’applique sans priver les consommateurs de leurs protections impératives. Consultez notre <Link href="/datenschutz" className="text-orange-700 underline">politique de confidentialité</Link>.</p>
          </div>
        </div>
      </div>
    </section>
  ), brenLocale);
}
