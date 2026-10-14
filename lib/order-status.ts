export const orderStatusLabels = { new: 'Bestellung eingegangen', in_progress: 'In Vorbereitung', done: 'Versendet' };
export function paymentStatusLabel(status: string) {
  return ({ pending: 'Zahlung ausstehend', confirmed: 'Zahlung erhalten', failed: 'Zahlung nicht eingegangen', refunded: 'Erstattet' } as Record<string, string>)[status] ?? 'Zahlung ausstehend';
}
