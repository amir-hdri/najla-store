import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { CartSummary } from './CartSummary';

it('shows free shipping as active when a promo covers a below-threshold cart', () => {
  const markup = renderToStaticMarkup(<CartSummary cart={{ items: [], totalItems: 1, subtotal: 289000 }} promo={{ code: 'FREESHIP', type: 'freeship', value: 0, discount: 0, freeShip: true }} />);
  expect(markup).toContain('ارسال رایگان فعال شد');
  expect(markup).not.toContain('تا ارسال رایگان');
});
