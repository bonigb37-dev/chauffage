import { createHmac, timingSafeEqual } from 'node:crypto';
export const proofValidityMs = 30 * 24 * 60 * 60_000;
function signature(reference: string, secret: string, expires?: number) {
  return createHmac('sha256', secret).update(`payment-proof:${reference}${expires === undefined ? '' : `:${expires}`}`).digest('hex');
}
export function paymentProofToken(reference: string, secret: string, now = Date.now()) {
  const expires = Math.floor((now + proofValidityMs) / 1000);
  return `${expires}.${signature(reference, secret, expires)}`;
}
export function validPaymentProofToken(reference: string, token: string, secret: string, now = Date.now()) {
  // Existing browser confirmations remain usable only for recent orders;
  // the route enforces created_at for this legacy, undated format.
  if (/^[a-f0-9]{64}$/.test(token)) return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(signature(reference, secret), 'hex'));
  const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires * 1000 <= now || expires * 1000 > now + proofValidityMs) return false;
  return timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(signature(reference, secret, expires), 'hex'));
}
