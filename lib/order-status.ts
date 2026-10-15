export const orderStatusLabels = { new: 'Bestellung eingegangen', in_progress: 'In Vorbereitung', done: 'Versendet' };
export function paymentStatusLabel(status: string, customerData?: Record<string, unknown> | null) {
  if (status === 'confirmed') return 'Zahlung bestätigt';
  if (status === 'failed') return 'Zahlung nicht eingegangen';
  if (status === 'refunded') return 'Erstattet';
  if (customerData && (customerData.payment_proof_submitted || customerData.payment_proof_submitted_at)) {
    return 'Prüfung läuft';
  }
  return 'Zahlung ausstehend';
}

