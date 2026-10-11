
import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
const scenes = [
  { title: 'Préparation en entrepôt', position: '0%' },
  { title: 'Palettes prêtes à partir', position: '25%' },
  { title: 'Combustibles soigneusement conditionnés', position: '50%' },
  { title: 'Chargement pour la livraison', position: '75%' },
  { title: 'Manutention au dépôt', position: '100%' },
];

export default function LogisticsGallery() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <section data-analytics-section="logistics" className="logistics-gallery" aria-labelledby="logistics-gallery-title">
      <div className="logistics-gallery__inner">
        <div className="logistics-gallery__intro">
          <p className="logistics-gallery__eyebrow">Préparation & livraison</p>
          <h2 id="logistics-gallery-title">La logistique des combustibles</h2>
          <p>Un aperçu des étapes de stockage, de préparation et de livraison de nos produits.</p>
        </div>
        <div className="logistics-gallery__photos">
          {scenes.map((scene) => (
            <div
              key={scene.title}
              className="logistics-gallery__photo"
              role="img"
              aria-label={scene.title}
              style={{ backgroundPosition: `${scene.position} center` }}
            />
          ))}
        </div>
      </div>
    </section>
  ), brenLocale);
}
