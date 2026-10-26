import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RotateCcw, SearchX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogAPI } from '@/lib/api';
import type { CategoryRow, Product } from '@/lib/types';
import { FilterBar, type CatalogFilters } from './FilterBar';
import { ProductCard } from './ProductCard';
import { lazy, Suspense } from 'react';

const QuickViewDialog = lazy(() => import('./QuickViewDialog').then(m => ({ default: m.QuickViewDialog })));

const SORT_PARAM: Record<CatalogFilters['sort'], string | undefined> = {
  default: undefined,
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
  name: 'name',
};

const faNumber = new Intl.NumberFormat('fa-IR');
const EMPTY_FILTERS: CatalogFilters = { category: 'all', search: '', sort: 'default' };

export function ProductGrid() {
  const reduce = useReducedMotion();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    CatalogAPI.listCategories()
      .then(r => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params: { category?: string; search?: string; sort?: string } = {};
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    if (filters.search.trim()) params.search = filters.search.trim();
    const sort = SORT_PARAM[filters.sort];
    if (sort) params.sort = sort;
    CatalogAPI.listProducts(params)
      .then(r => { if (!cancelled) setProducts(r.products); })
      .catch(e => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'خطایی رخ داد.');
          setProducts([]);
        }
      });
    return () => { cancelled = true; };
  }, [filters, reloadKey]);

  const applyFilters = (next: CatalogFilters) => {
    setProducts(null);
    setError(null);
    setFilters(next);
  };

  const retry = () => {
    setProducts(null);
    setError(null);
    setReloadKey(k => k + 1);
  };

  const body = (() => {
    if (products === null) {
      return (
        <div role="status" aria-busy="true" aria-label="در حال بارگذاری محصولات">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-2.5 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="mt-4 h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center rounded-2xl border border-destructive/20 bg-card/60 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <p role="alert" className="mt-4 font-display text-2xl">مشکلی در دریافت محصولات پیش آمد</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-5 rounded-full" onClick={retry}>
            <RotateCcw className="size-4" aria-hidden />
            تلاش دوباره
          </Button>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-5" aria-hidden />
          </span>
          <p role="status" className="mt-4 font-display text-2xl">محصولی پیدا نشد</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
            فیلترها را تغییر دهید یا همه محصولات را ببینید.
          </p>
          <Button
            variant="outline"
            className="mt-5 rounded-full"
            onClick={() => applyFilters(EMPTY_FILTERS)}
          >
            <RotateCcw className="size-4" aria-hidden />
            پاک کردن فیلترها
          </Button>
        </div>
      );
    }

    return (
      <ul
        className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-label="فهرست محصولات"
      >
        {products.map((p, index) => (
          <motion.li
            key={p.id}
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: Math.min(index, 7) * 0.08 }}
          >
            <ProductCard product={p} onQuickView={setQuickView} />
          </motion.li>
        ))}
      </ul>
    );
  })();

  return (
    <section
      id="products"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:px-6 md:py-20"
    >
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="h-px w-8 bg-primary/50" aria-hidden />
            فروشگاه نجلا
          </p>
          <h2 className="font-display text-4xl md:text-5xl">محصولات تازه</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            خرما، میوه‌ی خشک، آجیل و جعبه‌های هدیه — همه با ضمانت تازگی نجلا.
          </p>
        </div>
        {products !== null && !error ? (
          <motion.p
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-gold" aria-hidden />
            <span aria-live="polite">{faNumber.format(products.length)} محصول</span>
          </motion.p>
        ) : null}
      </motion.div>

      <div className="sticky top-16 z-30 -mx-4 mt-8 border-y border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl md:top-20 md:-mx-6 md:px-6">
        <FilterBar categories={categories} value={filters} onChange={applyFilters} />
      </div>

      <div className="mt-8">{body}</div>

      <Suspense fallback={null}>
        <QuickViewDialog product={quickView} onOpenChange={v => { if (!v) setQuickView(null); }} />
      </Suspense>
    </section>
  );
}
