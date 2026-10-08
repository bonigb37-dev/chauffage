'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import PaymentMethods from '@/components/PaymentMethods';

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export default function CartPageContent() {
  const { items, ready, setQuantity, removeItem, products } = useCart();
  const lines = items.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ ...line, product }] : [];
  });
  const pricedTotal = lines.reduce((total, line) => total + (line.product.priceAmount ?? 0) * line.quantity, 0);
  const hasUnpricedProduct = lines.some((line) => line.product.priceAmount === undefined);

  if (!ready) return <main className="container min-h-[60vh] py-16"><div className="h-10 w-56 animate-pulse rounded bg-gray-100" /><div className="mt-8 h-64 animate-pulse rounded-3xl bg-gray-100" /></main>;

  return (
    <main className="min-h-[60vh] bg-[#faf9f6]">
      <section className="border-b border-stone-200 bg-white py-12 sm:py-16"><div className="container"><p className="text-sm font-bold uppercase tracking-[.18em] text-orange-600">Votre sélection</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">Mon panier</h1><p className="mt-3 text-gray-500">Vérifiez les produits et les quantités avant de poursuivre.</p></div></section>
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:py-14">
        {lines.length === 0 ? <section className="rounded-3xl border border-stone-200 bg-white p-10 text-center sm:p-16"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-orange-600"><ShoppingCart size={27} /></span><h2 className="mt-6 text-2xl font-black">Votre panier est vide</h2><p className="mt-2 text-gray-500">Parcourez le catalogue pour ajouter des produits.</p><Link href="/produits" className="mt-7 inline-flex rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700">Voir le catalogue</Link></section> : <section className="space-y-4">{lines.map(({ product, quantity }) => <article key={product.id} className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-4 sm:grid-cols-[140px_1fr_auto] sm:items-center sm:p-5"><div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100 sm:w-[140px]"><Image src={product.image} alt={product.name} fill sizes="140px" className="object-cover" /></div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-orange-600">{product.type} · {product.quantity}</p><h2 className="mt-2 text-lg font-black leading-snug">{product.name}</h2>{product.articleNumber && <p className="mt-1 text-sm text-gray-500">N° d’article : {product.articleNumber}</p>}<p className="mt-2 font-bold">{product.priceAmount === undefined ? product.price : euros.format(product.priceAmount / 100)}</p><p className={`mt-1 text-xs font-semibold ${product.stock === 0 ? 'text-red-700' : product.stock !== undefined ? 'text-emerald-700' : 'text-gray-500'}`}>{product.stock === 0 ? 'Rupture de stock' : product.stock !== undefined ? `En stock · ${product.stock} unités disponibles` : 'Disponibilité à confirmer'}</p></div><div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><div className="flex items-center rounded-full border border-gray-200"><button type="button" onClick={() => setQuantity(product.id, quantity - 1)} aria-label={`Diminuer la quantité de ${product.name}`} className="grid h-10 w-10 place-items-center rounded-l-full hover:bg-gray-50"><Minus size={15} /></button><span className="min-w-10 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => setQuantity(product.id, quantity + 1)} disabled={product.stock !== undefined && quantity >= product.stock} aria-label={`Augmenter la quantité de ${product.name}`} className="grid h-10 w-10 place-items-center rounded-r-full hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button></div><button type="button" onClick={() => removeItem(product.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition hover:text-red-600"><Trash2 size={15} /> Retirer</button></div></article>)}</section>}
        {lines.length > 0 && <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7"><h2 className="text-xl font-black">Récapitulatif</h2><div className="mt-6 space-y-4 border-b border-gray-100 pb-5 text-sm"><div className="flex justify-between gap-4 text-gray-600"><span>Montant des produits</span><b className="text-gray-950">{hasUnpricedProduct ? 'Prix à confirmer' : euros.format(pricedTotal / 100)}</b></div><div className="flex justify-between gap-4 text-gray-600"><span>Livraison</span><span className="max-w-[180px] text-right">Incluse dans le prix des produits</span></div></div><div className="mt-5 flex justify-between gap-4"><b>Total, livraison incluse</b><b className="text-right text-sm text-orange-700">{hasUnpricedProduct ? 'Prix à confirmer' : euros.format(pricedTotal / 100)}</b></div><PaymentMethods compact/><Link href="/commande" className="mt-6 block rounded-full bg-orange-600 px-5 py-4 text-center font-bold text-white transition hover:bg-orange-700">Continuer vers la commande</Link><Link href="/produits" className="mt-4 block text-center text-sm font-bold text-gray-500 hover:text-orange-600">Continuer mes achats</Link></aside>}
      </div>
    </main>
  );
}
