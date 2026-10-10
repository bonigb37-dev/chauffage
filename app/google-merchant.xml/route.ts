import { getServerCatalog } from '@/lib/server-catalog';
import { buildMerchantFeed } from '@/lib/merchant-feed';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const feed = buildMerchantFeed(await getServerCatalog(), siteUrl);
    if (!feed.count) throw new Error('No eligible products');
    if (feed.omitted.length) console.warn('Merchant feed omitted products:', feed.omitted);
    return new Response(feed.xml, { headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Language': 'de-DE',
    } });
  } catch {
    // Do not publish an empty feed or stale prices when the catalogue is down.
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Catalogue unavailable</error>', {
      status: 503, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '300' },
    });
  }
}
