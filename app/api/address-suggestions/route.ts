import { NextResponse } from 'next/server';
import { protectApi, readLimitedJson, BodyLimitError } from '@/lib/api-security';

type Suggestion = {
  label: string;
  street: string;
  postalCode: string;
  city: string;
  hasHouseNumber: boolean;
};

async function fetchGeoapify(query: string, key: string): Promise<Suggestion[]> {
  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.search = new URLSearchParams({
      text: query.trim(),
      filter: 'countrycode:de',
      lang: 'de',
      format: 'json',
      limit: '5',
      apiKey: key,
    }).toString();
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const data = await response.json();
    return (Array.isArray(data.results) ? data.results : [])
      .filter((item: Record<string, unknown>) => item.country_code === 'de' && typeof item.street === 'string')
      .map((item: Record<string, unknown>) => ({
        label: typeof item.formatted === 'string' ? item.formatted : item.street as string,
        street: [item.street, item.housenumber].filter((v) => typeof v === 'string').join(' '),
        postalCode: typeof item.postcode === 'string' ? item.postcode : '',
        city: typeof item.city === 'string' ? item.city : typeof item.town === 'string' ? item.town : typeof item.village === 'string' ? item.village : '',
        hasHouseNumber: Boolean(item.housenumber),
      }));
  } catch {
    return [];
  }
}

async function fetchPhoton(query: string): Promise<Suggestion[]> {
  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.search = new URLSearchParams({ q: query.trim(), lang: 'de', limit: '5' }).toString();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Brennholz-direk/1.0 (kontakt@brennholz-direk.de)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const features = (Array.isArray(data.features) ? data.features : []) as { properties?: Record<string, string | undefined> }[];
    return features
      .filter((f) => f.properties && f.properties.countrycode === 'DE' && (f.properties.street || f.properties.name))
      .map((f) => {
        const p = f.properties ?? {};
        const street = p.street || p.name || '';
        const housenumber = p.housenumber || '';
        const postalCode = p.postcode || '';
        const city = p.city || p.town || p.village || '';
        const streetWithNum = [street, housenumber].filter(Boolean).join(' ');
        const labelParts = [streetWithNum, postalCode, city].filter(Boolean);
        return {
          label: labelParts.join(', ') + ', Deutschland',
          street: streetWithNum,
          postalCode,
          city,
          hasHouseNumber: Boolean(housenumber),
        };
      });
  } catch {
    return [];
  }
}

async function fetchNominatim(query: string): Promise<Suggestion[]> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      q: query.trim(),
      countrycodes: 'de',
      format: 'json',
      addressdetails: '1',
      limit: '5',
    }).toString();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Brennholz-direk/1.0 (kontakt@brennholz-direk.de)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    const items = data as { address?: Record<string, string | undefined> }[];
    return items
      .filter((item) => item.address && (item.address.road || item.address.pedestrian))
      .map((item) => {
        const addr = item.address ?? {};
        const road = addr.road || addr.pedestrian || '';
        const housenumber = addr.house_number || '';
        const postalCode = addr.postcode || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const streetWithNum = [road, housenumber].filter(Boolean).join(' ');
        const labelParts = [streetWithNum, postalCode, city].filter(Boolean);
        return {
          label: labelParts.join(', ') + ', Deutschland',
          street: streetWithNum,
          postalCode,
          city,
          hasHouseNumber: Boolean(housenumber),
        };
      });
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const blocked = await protectApi(request, 180);
  if (blocked) return blocked;
  const headers = { 'Cache-Control': 'no-store' };

  try {
    const body = await readLimitedJson(request, 2000);
    const query = body && typeof body === 'object' && 'query' in body ? body.query : null;
    if (typeof query !== 'string' || query.trim().length < 4 || query.length > 180) {
      return NextResponse.json({ suggestions: [] }, { status: 400, headers });
    }

    const key = process.env.GEOAPIFY_API_KEY?.trim() || '5132f256dbd1492fb68ca42c54c8e520';
    let suggestions = await fetchGeoapify(query, key);

    if (!suggestions.length) {
      suggestions = await fetchPhoton(query);
    }
    if (!suggestions.length) {
      suggestions = await fetchNominatim(query);
    }

    return NextResponse.json({ suggestions, unavailable: false }, { headers });
  } catch (cause) {
    if (cause instanceof BodyLimitError) {
      return NextResponse.json({ suggestions: [], unavailable: true }, { status: 413, headers });
    }
    return NextResponse.json({ suggestions: [] }, { headers });
  }
}
