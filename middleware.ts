import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const development = process.env.NODE_ENV !== 'production';
  const connections = ["'self'"];
  try {
    const configured = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
    if (configured.protocol === 'https:' || (development && configured.hostname === 'localhost')) {
      connections.push(configured.origin, `${configured.protocol === 'https:' ? 'wss:' : 'ws:'}//${configured.host}`);
    }
  } catch { /* An unconfigured provider is not authorized by the CSP. */ }
  if (development) connections.push('ws://localhost:*', 'ws://127.0.0.1:*');
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connections.join(' ')}`,
    "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'",
    ...(!development ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  const requestHeaders = new Headers(request.headers);
  // Routing hint only: never used to grant access or identify a user.
  requestHeaders.set('x-bren-pathname', request.nextUrl.pathname);
  requestHeaders.set('x-nonce', nonce);
  // Next.js reads this request header to nonce its generated scripts.
  requestHeaders.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!development) response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  if (/^\/(api|admin|super-admin|compte|commande)(\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'] };
