import { getServerCatalog } from '@/lib/server-catalog';
import { buildMerchantFeed } from '@/lib/merchant-feed';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const products = (await getServerCatalog()).filter(product => product.volumeGroup === 'hardwood-mix');
    const feed = buildMerchantFeed(products, siteUrl);
    if (!feed.count || feed.omitted.length) throw new Error('New product feed incomplete');
    return new Response(feed.xml, { headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Language': 'de-DE',
    } });
  } catch {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Catalogue unavailable</error>', {
      status: 503,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '300' },
    });
  }
}
