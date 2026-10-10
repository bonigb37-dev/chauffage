import { NextResponse } from 'next/server';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';

export async function POST(request: Request) {
  const blocked = protectApi(request, 60);
  if (blocked) return blocked;
  const headers = { 'Cache-Control': 'no-store' };
  const key = process.env.GEOAPIFY_API_KEY?.trim();
  if (!key) return NextResponse.json({ suggestions: [], unavailable: true }, { headers });
  try {
    const body = await readLimitedJson(request, 2000);
    const query = body && typeof body === 'object' && 'query' in body ? body.query : null;
    if (typeof query !== 'string' || query.trim().length < 4 || query.length > 180) return NextResponse.json({ suggestions: [] }, { status: 400, headers });
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.search = new URLSearchParams({ text: query.trim(), filter: 'countrycode:de', lang: 'de', format: 'json', limit: '5', apiKey: key }).toString();
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Provider unavailable');
    const data = await response.json();
    const suggestions = (Array.isArray(data.results) ? data.results : [])
      .filter((item: Record<string, unknown>) => item.country_code === 'de' && typeof item.street === 'string')
      .map((item: Record<string, unknown>) => ({
        label: typeof item.formatted === 'string' ? item.formatted : item.street,
        street: [item.street, item.housenumber].filter((value) => typeof value === 'string').join(' '),
        postalCode: typeof item.postcode === 'string' ? item.postcode : '',
        city: typeof item.city === 'string' ? item.city : typeof item.town === 'string' ? item.town : typeof item.village === 'string' ? item.village : '',
        hasHouseNumber: Boolean(item.housenumber),
      }));
    return NextResponse.json({ suggestions }, { headers });
  } catch (cause) {
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: cause instanceof BodyLimitError ? 413 : 503, headers });
  }
}
