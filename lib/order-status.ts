export const orderStatusLabels = { new: 'Commande enregistrée', in_progress: 'Préparation', done: 'Expédiée' };
export function paymentStatusLabel(status: string) {
  return ({ pending: 'Paiement en attente', confirmed: 'Paiement reçu', failed: 'Paiement non reçu', refunded: 'Remboursé' } as Record<string, string>)[status] ?? 'Paiement en attente';
}
