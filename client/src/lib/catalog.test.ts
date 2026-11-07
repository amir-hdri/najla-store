import { describe, expect, it } from 'vitest';
import { catalogHash, readCatalogHash } from './catalog';

describe('catalog links', () => {
  it('restores category, Persian search and sorting from a shared link', () => {
    expect(
      readCatalogHash(
        '#products?category=classic&search=%D9%85%D8%B6%D8%A7%D9%81%D8%AA%DB%8C&sort=price-asc',
      ),
    ).toEqual({ category: 'classic', search: 'مضافتی', sort: 'price-asc' });
  });
  it('ignores unsupported categories and sort values', () => {
    expect(readCatalogHash('#products?category=unknown&sort=invalid')).toEqual({
      category: 'all',
      search: '',
      sort: 'default',
    });
  });
  it('encodes search delimiters without adding another filter', () => {
    const hash = catalogHash({
      category: 'all',
      search: 'خرما &sort=name',
      sort: 'default',
    });
    expect(readCatalogHash(hash)).toEqual({
      category: 'all',
      search: 'خرما &sort=name',
      sort: 'default',
    });
  });
});
