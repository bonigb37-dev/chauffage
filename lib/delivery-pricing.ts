export const deliveryOrigin = 'Aarstraße 5, 35756 Mittenaar, Deutschland';
export const localDeliveryBands = [
  { maxKm: 7, cents: 1500 }, { maxKm: 15, cents: 2600 },
  { maxKm: 25, cents: 3400 }, { maxKm: 35, cents: 4400 }, { maxKm: 50, cents: 5400 },
];
export const palletDeliveryBands = [
  { maxKm: 100, firstCents: 4500, extraCents: 3000 },
  { maxKm: 125, firstCents: 5000, extraCents: 3000 },
  { maxKm: 150, firstCents: 5500, extraCents: 3000 },
  { maxKm: 175, firstCents: 6000, extraCents: 3500 },
  { maxKm: 200, firstCents: 6500, extraCents: 3500 },
  { maxKm: 225, firstCents: 7000, extraCents: 3500 },
  { maxKm: 250, firstCents: 7500, extraCents: 3500 },
];
export function calculateDeliveryFee(distanceKm: number, pallets: number, hasLooseProducts: boolean) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 3000 || !Number.isSafeInteger(pallets) || pallets < 0 || pallets > 5000 || (!pallets && !hasLooseProducts)) throw new Error('invalid_delivery');
  let localCents = 0, palletCents = 0;
  if (hasLooseProducts) {
    const band = localDeliveryBands.find(b => distanceKm <= b.maxKm);
    localCents = band ? band.cents : 6400 + Math.round((distanceKm - 50) * 150);
  }
  if (pallets) {
    const band = palletDeliveryBands.find(b => distanceKm <= b.maxKm);
    palletCents = band ? band.firstCents + (pallets - 1) * band.extraCents : 7500 + Math.round((distanceKm - 250) * 150) + (pallets - 1) * 3500;
  }
  return { feeCents: localCents + palletCents, localCents, palletCents };
}

export function deliveryShippingClass(product: {name:string;quantity:string;description?:string}) {
  return /palette|palett|packfix|big.?bag/i.test([product.name,product.quantity,product.description??''].join(' ')) ? 'delivery_palettes' : 'delivery_hors_palettes';
}
