import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryRow, CategorySlug } from '@/lib/types';

export type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name';

export interface CatalogFilters {
  category: string;
  search: string;
  sort: SortKey;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'پیش‌فرض' },
  { value: 'price-asc', label: 'قیمت: کم به زیاد' },
  { value: 'price-desc', label: 'قیمت: زیاد به کم' },
  { value: 'name', label: 'نام' },
];

const CATEGORY_NAMES: Record<CategorySlug | 'all', string> = {
  all: 'همه',
  premium: 'پریمیوم',
  classic: 'کلاسیک',
  craft: 'صنایع‌دستی',
  gifts: 'هدایا',
};

const faNumber = new Intl.NumberFormat('fa-IR');

export function FilterBar({
  categories,
  value,
  onChange,
}: {
  categories: CategoryRow[];
  value: CatalogFilters;
  onChange(next: CatalogFilters): void;
}) {
  const [searchText, setSearchText] = useState(value.search);
  const debounce = useRef<number | undefined>(undefined);

  useEffect(() => setSearchText(value.search), [value.search]);

  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      if (searchText !== value.search) onChange({ ...value, search: searchText });
    }, 300);
    return () => window.clearTimeout(debounce.current);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips = useMemo(() => {
    const all: { key: string; name: string; count: number } = {
      key: 'all',
      name: CATEGORY_NAMES.all,
      count: categories.reduce((s, c) => s + c.count, 0),
    };
    return [
      all,
      ...categories.map(c => ({
        key: c.category,
        name: CATEGORY_NAMES[c.category] ?? c.category,
        count: c.count,
      })),
    ];
  }, [categories]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div
        className="no-scrollbar flex items-center gap-2 overflow-x-auto"
        role="group"
        aria-label="دسته‌بندی"
      >
        {chips.map(c => {
          const active = c.key === value.category;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...value, category: c.key })}
              className={`tap flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[.97] ${
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground'
              }`}
            >
              {c.name}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? 'bg-primary-foreground/15' : 'bg-muted text-muted-foreground'
                }`}
              >
                {faNumber.format(c.count)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:ms-auto">
        <div className="relative flex-1 lg:w-52 lg:flex-none">
          <Search
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="h-9 rounded-xl border-border/80 bg-card pr-9 pl-8"
            placeholder="جستجوی محصول…"
            aria-label="جستجوی محصول"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText ? (
            <button
              type="button"
              onClick={() => setSearchText('')}
              aria-label="پاک کردن جستجو"
              className="tap absolute left-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <Select
          value={value.sort}
          onValueChange={v => onChange({ ...value, sort: v as SortKey })}
        >
          <SelectTrigger
            className="h-9 w-full rounded-xl border-border/80 bg-card sm:w-44"
            aria-label="مرتب‌سازی"
          >
            <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
