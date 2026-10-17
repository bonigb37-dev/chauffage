'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminProductLine from '@/components/AdminProductLine';
import type { CartDraft } from '@/lib/cart-drafts-server';
const copy = {
 fr: { title: 'Paniers non validés', note: 'Articles ajoutés sans validation de commande. Actualisation toutes les 30 secondes. Les paniers sont conservés au maximum 30 jours.', empty: 'Aucun panier non validé.', visitor: 'Visiteur anonyme', active: 'En cours', inactive: 'Sans modification depuis 30 minutes', updated: 'Dernière modification', remove: 'Retirer du suivi', confirm: 'Retirer ce panier du suivi administratif ? Cela ne supprime aucune commande et ne vide pas le panier du visiteur.', error: 'Impossible de charger ou de modifier les paniers. Réessayez.', refresh: 'Actualiser', previous: 'Précédents', next: 'Suivants', total: 'Total', loading: 'Chargement…' },
 de: { title: 'Offene Warenkörbe', note: 'Hinzugefügte Artikel ohne abgeschlossene Bestellung. Aktualisierung alle 30 Sekunden. Warenkörbe werden höchstens 30 Tage gespeichert.', empty: 'Keine offenen Warenkörbe.', visitor: 'Anonymer Besucher', active: 'In Bearbeitung', inactive: 'Seit 30 Minuten unverändert', updated: 'Letzte Änderung', remove: 'Aus der Übersicht entfernen', confirm: 'Diesen Warenkorb aus der Verwaltung entfernen? Bestellungen und der Warenkorb des Besuchers bleiben erhalten.', error: 'Warenkörbe konnten nicht geladen oder geändert werden. Bitte erneut versuchen.', refresh: 'Aktualisieren', previous: 'Zurück', next: 'Weiter', total: 'Gesamt', loading: 'Laden…' },
 en: { title: 'Uncompleted carts', note: 'Items added without a completed order. Refreshed every 30 seconds. Carts unchanged for over 30 days are deleted when this list is loaded.', empty: 'No uncompleted carts.', visitor: 'Anonymous visitor', active: 'In progress', inactive: 'Unchanged for 30 minutes', updated: 'Last updated', remove: 'Remove from tracking', confirm: 'Remove this cart from administration tracking? Orders and the visitor’s local cart will remain unchanged.', error: 'Unable to load or update carts. Please try again.', refresh: 'Refresh', previous: 'Previous', next: 'Next', total: 'Total', loading: 'Loading…' },
};
export default function CartDraftsPanel() {
 const locale = useLocale() as keyof typeof copy, c = copy[locale] ?? copy.fr;
 const [drafts, setDrafts] = useState<CartDraft[]>([]), [offset, setOffset] = useState(0), [more, setMore] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(false), [working, setWorking] = useState('');
 const sequence = useRef(0);
 const money = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
 const request = useCallback(async (method: 'GET' | 'DELETE', id?: string) => {
   const session = await supabase?.auth.getSession(); const token = session?.data.session?.access_token;
   if (!token) throw new Error('signin');
   const r = await fetch(`/api/cart-drafts?offset=${offset}`, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, cache: 'no-store', ...(id ? { body: JSON.stringify({ id }) } : {}) });
   if (!r.ok) throw new Error('request'); return r.json();
 }, [offset]);
 const refresh = useCallback(async () => {
   const revision = ++sequence.current; setLoading(true);
   try { const result = await request('GET'); if (revision === sequence.current) { setDrafts(result.drafts); setMore(result.more); setError(false); } }
   catch { if (revision === sequence.current) setError(true); }
   finally { if (revision === sequence.current) setLoading(false); }
 }, [request]);
 useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 30000); const invalidate = () => { sequence.current++; }; return () => { window.clearInterval(timer); invalidate(); }; }, [refresh]);
 async function remove(id: string) {
   if (!window.confirm(c.confirm)) return; setWorking(id); sequence.current++;
   try { await request('DELETE', id); setDrafts(current => current.filter(d => d.id !== id)); await refresh(); }
   catch { setError(true); } finally { setWorking(''); }
 }
 return <section data-original-content className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
   <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-3 text-2xl font-black"><ShoppingCart className="text-orange-600" />{c.title}</h2><button type="button" onClick={() => void refresh()} disabled={loading || !!working} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-bold disabled:opacity-50"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} />{c.refresh}</button></div>
   <p className="mt-3 text-sm leading-6 text-gray-600">{c.note}</p>
   {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-800">{c.error}</p>}
   {!error && !drafts.length && <p role="status" className="mt-6 text-gray-500">{loading ? c.loading : c.empty}</p>}
   <div className="mt-6 space-y-4">{drafts.map(draft => <article key={draft.id} className="rounded-xl border border-stone-200 p-4 sm:p-5">
     <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="break-all font-bold">{draft.email ?? c.visitor} <span className="text-xs font-normal text-gray-500">#{draft.id.slice(0, 8)}</span></h3><p className="mt-1 text-xs text-gray-500">{c.updated} : {new Date(draft.updatedAt).toLocaleString(locale)}</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">{Date.now() - Date.parse(draft.updatedAt) >= 1800000 ? c.inactive : c.active}</span></div>
     <ul className="mt-4 divide-y divide-stone-100">{draft.items.map(line => <li key={line.productId} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><AdminProductLine line={line} /><span className="ml-auto shrink-0 font-semibold">{money(line.unitPrice * line.quantity)}</span></li>)}</ul>
     <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="font-black">{c.total} : {money(draft.totalCents)}</p><button type="button" onClick={() => void remove(draft.id)} disabled={!!working} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} />{c.remove}</button></div>
   </article>)}</div>
   <div className="mt-6 flex justify-between gap-3"><button type="button" disabled={!offset || loading || !!working} onClick={() => setOffset(n => Math.max(0, n - 20))} className="rounded-lg border px-4 py-2 disabled:opacity-40">{c.previous}</button><button type="button" disabled={!more || loading || !!working} onClick={() => setOffset(n => n + 20)} className="rounded-lg border px-4 py-2 disabled:opacity-40">{c.next}</button></div>
 </section>;
}
