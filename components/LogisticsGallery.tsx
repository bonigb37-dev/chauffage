
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
const scenes = [
  { title: 'Préparation du bois de chauffage', image: '/B1.webp' },
  { title: 'Chargement des palettes de bois', image: '/gallery-truck-loading-bren-nholz-20261013.png' },
  { title: 'Stock de bois au dépôt', image: '/B3.webp' },
  { title: 'Bois conditionné en filets', image: '/B4.webp' },
  { title: 'Stockage du bois sous abri', image: '/B5.jpg' },
  { title: 'Livraison du bois par camion', image: '/gallery-truck-delivery-bren-nholz-20261013.png' },
];

export default function LogisticsGallery() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <section data-analytics-section="logistics" className="logistics-gallery" aria-labelledby="logistics-gallery-title">
      <div className="logistics-gallery__inner">
        <div className="logistics-gallery__intro">
          <p className="logistics-gallery__eyebrow">Préparation & livraison</p>
          <h2 id="logistics-gallery-title">Aperçu de la préparation du bois de chauffage</h2>
          <p>Voici comment votre bois de chauffage est produit – de la bûche à la livraison.</p>
        </div>
        <div className="logistics-gallery__photos">
          {scenes.map((scene) => (
            <div
              key={scene.title}
              className="logistics-gallery__photo"
              role="img"
              aria-label={scene.title}
              style={{ backgroundImage: `url("${scene.image}")` }}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-600">Visuels d’illustration de la préparation et de la livraison.</p>
      </div>
    </section>
  ), brenLocale);
}
