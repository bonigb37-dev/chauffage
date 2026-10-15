import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import path from 'node:path';

// Stop the build rather than embedding a privileged Supabase credential in JS.
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
let privilegedPublicKey = publicKey?.startsWith('sb_secret_') ?? false;
if (publicKey?.split('.').length === 3) {
  try { privilegedPublicKey ||= JSON.parse(Buffer.from(publicKey.split('.')[1], 'base64url').toString()).role === 'service_role'; }
  catch { /* Supabase will reject an invalid public JWT. */ }
}
const privilegedPublicName = Object.keys(process.env).some(name => name.startsWith('NEXT_PUBLIC_')
  && /SERVICE_ROLE|SECRET|PASSWORD|PRIVATE_KEY/.test(name) && Boolean(process.env[name]));
if (privilegedPublicKey || privilegedPublicName) throw new Error('Une clé privée est configurée dans une variable publique. Corrigez la configuration avant de compiler.');

const config: NextConfig = {
  distDir: process.env.BREN_BUILD_DIR || '.next',
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }];
  },
};

export default createNextIntlPlugin('./i18n/request.ts')(config);

