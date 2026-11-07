import { useState } from 'react';
import { Check, Eye, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductArt } from './ProductArt';
import { artFor } from '@/art/productArt';
import { photoFor } from '@/lib/productMedia';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/cartAnim';

export interface ProductCardProps {
  product: Product;
  onQuickView(p: Product): void;
}
export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { add, cart, pending } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quantity =
    cart.items.find((item) => item.product_id === product.id)?.quantity || 0;
  const out = product.stock <= 0;
  const limit = quantity >= Math.min(product.stock, 99);
  const compare =
    product.old_price != null && product.old_price > product.price;
  async function addProduct() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await add(product.id, 1);
      toast(`«${product.name}» به سبد اضافه شد`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'افزودن انجام نشد. دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className="product-card group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
      data-testid="product-card"
    >
      <div className="relative overflow-hidden bg-muted/20">
        <button
          type="button"
          className="block w-full overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          onClick={() => onQuickView(product)}
          aria-label={`مشاهده سریع ${product.name}`}
        >
          <ProductArt
            photo={photoFor(product.slug)}
            svg={artFor(product.slug) || ''}
            alt={product.name}
            className="aspect-[4/3] overflow-hidden [&>svg]:size-full [&>svg]:transition-transform [&>svg]:duration-500 group-hover:[&>svg]:scale-105"
          />
        </button>
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="pointer-events-auto absolute bottom-2.5 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-sm backdrop-blur-md transition-all duration-200 group-hover:opacity-100 sm:flex hover:bg-card hover:text-primary focus-visible:opacity-100"
          aria-label={`مشاهده سریع ${product.name}`}
        >
          <Eye className="size-3.5" aria-hidden />
          <span>مشاهده سریع</span>
        </button>
        {product.badge_text && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full border border-border/60 bg-card/90 px-2.5 py-0.5 text-[10px] font-bold text-primary shadow-xs backdrop-blur-md sm:right-3 sm:top-3">
            {product.badge_text}
          </span>
        )}
        {out && (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-espresso/90 px-3 py-1 text-xs font-medium text-cream backdrop-blur-xs">
            ناموجود
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{product.weight}</span>
          {!out && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary/70" />
              موجود
            </span>
          )}
        </div>
        <h3 className="mt-1 min-h-12 text-[13px] font-bold leading-6 sm:text-base">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="text-start transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          >
            {product.name}
          </button>
        </h3>
        <p className="mt-1 hidden truncate text-xs text-muted-foreground sm:block">
          {product.description}
        </p>
        <div className="mt-auto pt-3">
          <div className="min-h-5 text-[11px] text-muted-foreground">
            {compare && <del>{formatNumber(product.old_price!)} تومان</del>}
          </div>
          <p className="flex flex-wrap items-baseline gap-1 text-base font-bold tabular-nums sm:text-lg">
            {formatNumber(product.price)}
            <span className="text-[10px] font-normal text-muted-foreground sm:text-xs">
              تومان
            </span>
          </p>
          <Button
            disabled={out || limit || busy || pending}
            onClick={() => void addProduct()}
            aria-label={
              out ? `${product.name} ناموجود` : `افزودن ${product.name} به سبد`
            }
            className="mt-3 h-11 w-full gap-1.5 rounded-xl text-xs font-semibold sm:text-sm"
            variant={quantity ? 'secondary' : 'default'}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : quantity ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {out
              ? 'ناموجود'
              : busy
                ? 'در حال افزودن'
                : quantity
                  ? `${formatNumber(quantity)} در سبد`
                  : 'افزودن به سبد'}
          </Button>
          {error && (
            <p role="alert" className="mt-2 text-xs leading-6 text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
