import type { vatSummary } from '@/lib/vat';

export type PendingOrder = {
  vat?: ReturnType<typeof vatSummary>;
  delivery?: { feeCents: number; distanceKm?: number };
  reference: string;
  proofToken?: string;
  total: number;
  items: { name: string; quantity: number }[];
  customer: { firstName: string; lastName: string; email: string };
};

const storageKey = 'thermopro-pending-order';
let pendingOrder: PendingOrder | null = null;
const clearedReferences = new Set<string>();

// Keep the confirmation available during client navigation when browser storage is blocked.
export function savePendingOrder(order: PendingOrder) {
  pendingOrder = order;
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(order)); } catch { /* Use memory for this visit. */ }
}

export function readPendingOrder(reference: string | null): PendingOrder | null {
  if (!reference) return null;
  if (pendingOrder?.reference === reference) return pendingOrder;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const order = JSON.parse(raw) as PendingOrder;
    if (order.reference !== reference || !Number.isSafeInteger(order.total) || order.total < 0 || !Array.isArray(order.items) || !order.customer) return null;
    pendingOrder = order;
    return order;
  } catch { return null; }
}

export function markCartCleared(reference: string): boolean {
  if (clearedReferences.has(reference)) return false;
  clearedReferences.add(reference);
  try {
    const key = `thermopro-cleared-${reference}`;
    if (window.sessionStorage.getItem(key) === 'true') return false;
    window.sessionStorage.setItem(key, 'true');
  } catch { /* The in-memory marker prevents repeated clearing. */ }
  return true;
}
