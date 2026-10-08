import { createHmac, timingSafeEqual } from 'node:crypto';
export function paymentProofToken(reference: string, secret: string) {
  return createHmac('sha256', secret).update(`payment-proof:${reference}`).digest('hex');
}
export function validPaymentProofToken(reference: string, token: string, secret: string) {
  return /^[a-f0-9]{64}$/.test(token) && timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(paymentProofToken(reference, secret), 'hex'));
}
