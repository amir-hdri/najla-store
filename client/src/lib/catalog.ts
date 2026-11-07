import type { CategorySlug } from './types';

export type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name';
export interface CatalogFilters {
  category: string;
  search: string;
  sort: SortKey;
}
export const EMPTY_FILTERS: CatalogFilters = {
  category: 'all',
  search: '',
  sort: 'default',
};
export const CATEGORY_NAMES: Record<CategorySlug | 'all', string> = {
  all: 'همه محصولات',
  premium: 'خرمای ممتاز',
  classic: 'خرمای روزانه',
  craft: 'فرآورده‌های خرما',
  gifts: 'جعبه‌های هدیه',
};
export function readCatalogHash(hash: string): CatalogFilters {
  const q = new URLSearchParams(hash.split('?')[1]);
  const category = q.get('category') || 'all';
  const sort = q.get('sort') || 'default';
  return {
    category: Object.hasOwn(CATEGORY_NAMES, category) ? category : 'all',
    search: q.get('search') || '',
    sort: ['price-asc', 'price-desc', 'name'].includes(sort)
      ? (sort as SortKey)
      : 'default',
  };
}
export function catalogHash(filters: CatalogFilters): string {
  const q = new URLSearchParams();
  if (filters.category !== 'all') q.set('category', filters.category);
  if (filters.search) q.set('search', filters.search);
  if (filters.sort !== 'default') q.set('sort', filters.sort);
  return `#products${q.size ? `?${q}` : ''}`;
}
