import { Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatToman } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductArt } from './ProductArt';
import { artFor } from '@/art/productArt';
import { useCart } from '@/context/CartContext';

export interface ProductCardProps {
  product: Product;
  onQuickView(p: Product): void;
}

const BADGE_FALLBACK: Record<string, string> = {
  best: 'پرفروش',
  sale: 'تخفیف ویژه',
  new: 'جدید',
};

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { add } = useCart();
  const art = artFor(product.slug) ?? '';
  const out = product.stock <= 0;
  const compare = product.old_price != null && product.old_price > product.price;
  const label =
    product.badge_text ??
    (product.badge ? (BADGE_FALLBACK[product.badge] ?? product.badge) : null);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgb(36_24_18/0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_18px_40px_-24px_rgb(36_24_18/0.45)] hover:ring-1 hover:ring-primary/15 dark:shadow-[0_1px_2px_rgb(0_0_0/0.25)]"
      data-testid="product-card"
    >
      <div className="relative">
        <button
          type="button"
          className="block w-full overflow-hidden text-start focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          onClick={() => onQuickView(product)}
          aria-label={`مشاهده سریع ${product.name}`}
        >
          <ProductArt
            svg={art}
            alt={product.name}
            className="aspect-[4/3] overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:transition-transform [&>svg]:duration-500 group-hover:[&>svg]:scale-[1.06]"
          />
          <span className="pointer-events-none absolute inset-x-3 bottom-3 flex h-9 translate-y-2 items-center justify-center gap-1.5 rounded-full bg-espresso/80 text-xs font-medium text-cream opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Eye className="size-3.5" aria-hidden />
            مشاهده سریع
          </span>
        </button>

        {label ? (
          <span className="absolute right-3 top-3 rounded-full border border-border/60 bg-card/90 px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm backdrop-blur">
            {label}
          </span>
        ) : null}

        {out ? (
          <div className="absolute inset-0 grid place-items-center bg-background/55 backdrop-blur-[1px]">
            <span className="rounded-full bg-espresso px-4 py-1.5 text-xs font-medium text-cream">
              ناموجود
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-6 transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{product.weight}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex flex-col">
            <span className="text-[15px] font-black tabular-nums">
              {formatToman(product.price)}
            </span>
            {compare ? (
              <span className="text-[11px] tabular-nums text-muted-foreground line-through">
                {formatToman(product.old_price!)}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            disabled={out}
            onClick={() => add(product.id, 1)}
            aria-label={out ? 'ناموجود' : `افزودن ${product.name} به سبد`}
            className="tap h-9 shrink-0 rounded-full px-3 shadow-sm shadow-primary/20 transition-all active:scale-95 disabled:shadow-none sm:h-8"
          >
            {out ? (
              'ناموجود'
            ) : (
              <>
                <Plus className="size-3.5" aria-hidden />
                افزودن
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
