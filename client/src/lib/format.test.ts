import { describe, expect, it } from 'vitest';
import { formatToman, shippingFor, cartTotals } from './format';
import type { PromoInfo } from './types';

describe('formatToman', () => {
  it('formats Persian digits with تومان suffix', () => {
    const out = formatToman(849000);
    expect(out).toContain('۸۴۹');
    expect(out).toContain('تومان');
  });

  it('formats zero', () => {
    expect(formatToman(0)).toContain('۰');
  });
});

describe('shippingFor', () => {
  it('is free at and above the 500k threshold', () => {
    expect(shippingFor(500000, false)).toBe(0);
    expect(shippingFor(500001, false)).toBe(0);
  });

  it('charges the flat fee below the threshold', () => {
    expect(shippingFor(499999, false)).toBe(49000);
    expect(shippingFor(1, false)).toBe(49000);
    expect(shippingFor(0, false)).toBe(49000);
  });

  it('is free when the promo grants free shipping', () => {
    expect(shippingFor(0, true)).toBe(0);
    expect(shippingFor(1000, true)).toBe(0);
  });
});

describe('cartTotals', () => {
  const percent10: PromoInfo = {
    code: 'OFF10',
    type: 'percent',
    value: 10,
    discount: 0,
    freeShip: false,
  };

  it('applies a percent discount and computes shipping + total', () => {
    const t = cartTotals(100000, percent10);
    expect(t.discount).toBe(10000);
    expect(t.shipping).toBe(49000);
    expect(t.total).toBe(139000);
  });

  it('zeros shipping for freeship promos', () => {
    const t = cartTotals(100000, { ...percent10, type: 'freeship', freeShip: true, discount: 0 });
    expect(t.discount).toBe(0);
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(100000);
  });

  it('computes free shipping by threshold without a promo', () => {
    const t = cartTotals(500000, null);
    expect(t.discount).toBe(0);
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(500000);
  });

  it('does not let discount exceed subtotal (shipping still applies below threshold)', () => {
    // Matches server: shipping is based on the pre-discount subtotal.
    const huge: PromoInfo = { code: 'HUGE', type: 'percent', value: 200, discount: 0, freeShip: false };
    const t = cartTotals(10000, huge);
    expect(t.discount).toBe(10000);
    expect(t.shipping).toBe(49000);
    expect(t.total).toBe(49000);
  });
});
