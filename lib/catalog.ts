import { products, type Product } from '@/lib/products';

export type ProductOverride = { product_id: number; data: Record<string, unknown>; is_deleted: boolean };
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function mergeCatalog(rows: ProductOverride[]): Product[] {
  const overrides = new Map(rows.map((row) => [row.product_id, row]));
  const ids = new Set([...products.map((product) => product.id), ...rows.map((row) => row.product_id)]);
  return [...ids].flatMap((id) => {
    const base = products.find((product) => product.id === id);
    const row = overrides.get(id);
    if (row?.is_deleted) return [];
    const data = row?.data ?? {};
    const priceAmount = Object.hasOwn(data, 'priceAmount') ? data.priceAmount : base?.priceAmount;
    const stock = Object.hasOwn(data, 'stock') ? data.stock : base?.stock;
    const product = { ...base, ...data, id,
      priceAmount: Number.isSafeInteger(priceAmount) && Number(priceAmount) > 0 ? Number(priceAmount) : undefined,
      stock: Number.isSafeInteger(stock) && Number(stock) >= 0 ? Number(stock) : undefined,
    } as Product;
    product.price = product.priceAmount === undefined ? 'Indisponible à la vente' : euro.format(product.priceAmount / 100);
    return [product];
  });
}
