import { productPathSegment, type Product } from '@/lib/products';
import de from '@/translations/de.json';

const german: Record<string, string> = de;
const namedBrands = ['EPH', 'TotalEnergies', 'HEIZFUXX', 'HELIOS', 'PROXIMA STAR', 'FireStixx', 'Giant Flames', 'ANTE', 'VERPELLET'];

// One-time republication for images reported as unprocessed by Merchant Center.
// Keep these URLs stable; match the source so future catalogue image edits win.
const republishedImages: Record<string, string> = {
  '/buches-chene.webp': '/merchant-images/buches-chene-20261012.webp',
  '/bois-allumage.webp': '/merchant-images/bois-allumage-20261012.webp',
  '/bois-chauffages-img-7.jpg': '/merchant-images/bois-chauffages-img-7-20261012.jpg',
};

function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
function translation(value: string | undefined) {
  return typeof value === 'string' ? german[value.replace(/\s+/g, ' ').trim()] : undefined;
}
function absoluteUrl(value: string | undefined, base: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function buildMerchantFeed(products: Product[] = [], base: string = '') {
  const omitted: { id: number; reason: string }[] = [];
  const items: string[] = [];
  for (const product of products ?? []) {
    const title = translation(product.name);
    const description = translation(product.description);
    const sourceImage = product.gallery?.[0] ?? product.image;
    const image = absoluteUrl(republishedImages[sourceImage] ?? sourceImage, base);
    if (!Number.isSafeInteger(product.id) || product.id < 1 || !Number.isSafeInteger(product.priceAmount) || Number(product.priceAmount) <= 0) {
      omitted.push({ id: product.id, reason: 'missing valid ID or purchase price' }); continue;
    }
    if (!title || !description || !image) {
      omitted.push({ id: product.id, reason: 'missing reviewed German copy or image' }); continue;
    }
    const field = (name: string, value: string) => `<g:${name}>${xml(value)}</g:${name}>`;
    const brand = namedBrands.find(value => new RegExp(`(?:^|[^a-zA-Z])${value}(?:$|[^a-zA-Z])`, 'i').test(product.name));
    const otherImages = [...new Set(product.gallery ?? [])].map(value => absoluteUrl(value, base)).filter((value): value is string => Boolean(value) && value !== image).slice(0, 10);
    const type = translation(product.type);
    items.push(`<item>\n${[
      field('id', String(product.id)),
      field('title', title),
      field('description', description),
      field('link', `${base}/de/produits/${productPathSegment(product)}`),
      field('image_link', image),
      ...otherImages.map(value => field('additional_image_link', value)),
      field('price', `${(Number(product.priceAmount) / 100).toFixed(2)} EUR`),
      field('availability', product.stock === 0 ? 'out_of_stock' : 'in_stock'),
      field('condition', 'new'),
      ...(type ? [field('product_type', type)] : []),
      ...(brand ? [field('brand', brand)] : []),
      '<g:shipping><g:country>DE</g:country><g:price>0.00 EUR</g:price></g:shipping>',
      // articleNumber is a shop SKU, not a verified manufacturer MPN or GTIN.
      // Missing identifiers do not prove that identifier_exists is false.
    ].join('\n')}\n</item>`);
  }
  return {
    count: items.length, omitted,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>Brennholz-direk – Deutschland</title>\n<link>${xml(base)}/de</link>\n<description>Brennholz, Holzpellets und Holzbriketts von Brennholz-direk.</description>\n<language>de-DE</language>\n${items.join('\n')}\n</channel>\n</rss>\n`,
  };
}
