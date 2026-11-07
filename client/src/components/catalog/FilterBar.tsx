import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  CATEGORY_NAMES,
  type CatalogFilters,
  type SortKey,
} from '@/lib/catalog';
import type { CategoryRow } from '@/lib/types';
export type { CatalogFilters } from '@/lib/catalog';

export function FilterBar({
  categories,
  value,
  onChange,
}: {
  categories: CategoryRow[];
  value: CatalogFilters;
  onChange(next: CatalogFilters): void;
}) {
  const chips = Object.entries(CATEGORY_NAMES).map(([key, name]) => ({
    key,
    name,
    count:
      key === 'all'
        ? categories.reduce((sum, c) => sum + c.count, 0)
        : categories.find((c) => c.category === key)?.count,
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="catalog-search"
            type="search"
            className="h-12 rounded-xl bg-card pr-11 pl-12"
            placeholder="چه خرمایی دوست دارید؟"
            aria-label="جستجوی محصول"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
          />
          {value.search && (
            <button
              type="button"
              onClick={() => onChange({ ...value, search: '' })}
              aria-label="پاک کردن جستجو"
              className="absolute left-1 top-1 grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <select
          value={value.sort}
          onChange={(e) =>
            onChange({ ...value, sort: e.target.value as SortKey })
          }
          aria-label="مرتب‌سازی"
          className="h-12 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
        >
          <option value="default">مرتب‌سازی: پیشنهاد نجلا</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="name">نام محصول</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="دسته‌بندی">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={c.key === value.category}
            onClick={() => onChange({ ...value, category: c.key })}
            className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm ${c.key === value.category ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
          >
            {c.name}
            {c.count !== undefined && (
              <span className="text-[11px] tabular-nums opacity-75">
                {c.count.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
