import type { Product } from '@/lib/products';

function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function adminOrderProduct(line: Record<string, unknown>, products: Product[]) {
  const id = Number(line.product_id ?? line.productId);
  const productId = Number.isSafeInteger(id) && id > 0 ? id : null;
  const product = products.find(item => item.id === productId);
  return {
    productId,
    name: typeof line.name === 'string' && line.name.trim() ? line.name : product?.name || 'Nicht mehr verfügbares Produkt',
    image: imageUrl(line.image) ?? imageUrl(product?.image) ?? imageUrl(product?.gallery?.[0]),
    quantity: Number.isSafeInteger(Number(line.quantity)) && Number(line.quantity) > 0 ? Number(line.quantity) : 0,
  };
}
