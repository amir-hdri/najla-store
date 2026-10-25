import type { PromoInfo } from './types';

export const FREE_SHIPPING_THRESHOLD = 500000;
export const SHIPPING_COST = 49000;

const fa = new Intl.NumberFormat('fa-IR');

export function formatToman(n: number): string {
  return `${fa.format(Math.max(0, Math.round(n)))} تومان`;
}

export function formatNumber(n: number): string {
  return fa.format(Math.max(0, Math.round(n)));
}

export function shippingFor(subtotal: number, freeShip: boolean): number {
  if (freeShip || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}

/** Mirrors server-side order math: shipping is computed on the pre-discount
 *  subtotal; total = max(0, subtotal - discount) + shipping. */
export function cartTotals(
  subtotal: number,
  promo: PromoInfo | null,
): { discount: number; shipping: number; total: number } {
  let discount = 0;
  let freeShip = false;
  if (promo) {
    if (promo.type === 'percent') discount = subtotal * (promo.value / 100);
    if (promo.type === 'freeship' || promo.freeShip) freeShip = true;
  }
  discount = Math.min(discount, subtotal);
  const shipping = shippingFor(subtotal, freeShip);
  const total = Math.max(0, subtotal - discount) + shipping;
  return { discount, shipping, total };
}
