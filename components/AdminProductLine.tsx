'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { translate } from '@/i18n/copy';
import { adminOrderProduct } from '@/lib/admin-order-product';

export default function AdminProductLine({ line }: { line: Record<string, unknown> }) {
  const { products } = useCart();
  const item = adminOrderProduct(line, products);
  const name = translate(item.name, 'de');
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return <div className="flex min-w-0 flex-1 items-center gap-3">
    <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-stone-200 bg-white sm:h-20 sm:w-20">
      {item.image && item.image !== failedImage
        ? <Image src={item.image} alt={name} fill sizes="80px" unoptimized={!item.image.startsWith('/')} className="object-contain p-1" onError={() => setFailedImage(item.image)} />
        : <span role="img" aria-label="Produktbild nicht verfügbar" className="text-stone-400"><Package size={26} aria-hidden="true" /></span>}
    </div>
    <div className="min-w-0 flex-1">
      <p className="break-words text-sm font-semibold leading-5 text-stone-900">{name}</p>
      {item.productId && <p className="mt-1 text-xs text-stone-500">Produkt-ID: {item.productId}</p>}
    </div>
    <span className="shrink-0 whitespace-nowrap font-mono text-sm font-bold text-stone-900">× {item.quantity}</span>
  </div>;
}
