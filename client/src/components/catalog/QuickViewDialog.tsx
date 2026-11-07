import { useState } from 'react';
import { Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatToman } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductArt } from './ProductArt';
import { artFor } from '@/art/productArt';
import { photoFor } from '@/lib/productMedia';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/cartAnim';

const BADGE_FALLBACK: Record<string, string> = {
  best: 'پرفروش',
  sale: 'تخفیف ویژه',
  new: 'جدید',
};

const faNumber = new Intl.NumberFormat('fa-IR');

export function QuickViewDialog({
  product,
  onOpenChange,
}: {
  product: Product | null;
  onOpenChange(open: boolean): void;
}) {
  const { add, cart } = useCart();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (!product) return null;
  const art = artFor(product.slug) ?? '';
  const inCart = cart.items.find(item => item.product_id === product.id)?.quantity || 0;
  const max = Math.max(0, Math.min(product.stock, 99) - inCart);
  const selectedQty = Math.min(qty, Math.max(1, max));
  const out = product.stock <= 0;
  const compare = product.old_price != null && product.old_price > product.price;
  const label =
    product.badge_text ??
    (product.badge ? (BADGE_FALLBACK[product.badge] ?? product.badge) : null);
  const discount = compare
    ? Math.round((1 - product.price / product.old_price!) * 100)
    : 0;

  return (
    <Dialog open onOpenChange={v => { if (busy) return; if (!v) { setQty(1); setError(null); } onOpenChange(v); }}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <div className="grid sm:grid-cols-2">
          <div className="relative bg-muted/30">
            <ProductArt
              photo={photoFor(product.slug)}
              svg={art}
              alt={product.name}
              className="h-56 overflow-hidden sm:h-full sm:min-h-80 [&>svg]:h-full [&>svg]:w-full"
            />
            {label ? (
              <span className="absolute right-3 top-3 rounded-full border border-border/60 bg-card/90 px-3 py-1 text-[11px] font-bold text-primary shadow-xs backdrop-blur-md">
                {label}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col p-5 sm:p-6 sm:pt-10">
            <DialogHeader className="text-start">
              <p className="text-[10px] font-semibold tracking-wide text-primary">محصول نجلا</p>
              <DialogTitle className="font-display text-3xl leading-tight">
                {product.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-7 text-muted-foreground">
                {product.description}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{product.weight}</span>
              <span className="size-0.5 rounded-full bg-border" aria-hidden />
              {out ? (
                <span className="font-medium text-destructive">ناموجود</span>
              ) : product.stock <= 5 ? (
                <span className="font-medium text-primary">
                  تنها {faNumber.format(product.stock)} بسته باقی مانده
                </span>
              ) : (
                <span>موجود در انبار</span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-border/60 pt-4">
              <span className="text-xl font-black tabular-nums">{formatToman(product.price)}</span>
              {compare ? (
                <>
                  <span className="mb-0.5 text-sm tabular-nums text-muted-foreground line-through">
                    {formatToman(product.old_price!)}
                  </span>
                  <span className="mb-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    ٪{faNumber.format(discount)}
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="flex w-fit items-center rounded-full border border-border bg-background p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="tap rounded-full"
                  disabled={busy || out || selectedQty <= 1}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  aria-label="کاهش تعداد"
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                  {faNumber.format(selectedQty)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="tap rounded-full"
                  disabled={busy || out || selectedQty >= max}
                  onClick={() => setQty(q => Math.min(max, q + 1))}
                  aria-label="افزایش تعداد"
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>

              <Button
                className="h-10 flex-1 rounded-full"
                disabled={busy || out || max === 0}
                onClick={async () => {
                  if (busy) return;
                  setBusy(true); setError(null);
                  try {
                    await add(product.id, selectedQty);
                    toast(`«${product.name}» به سبد اضافه شد`);
                    setQty(1); onOpenChange(false);
                  } catch (e) { setError(e instanceof Error ? e.message : 'افزودن انجام نشد. دوباره تلاش کنید.'); }
                  finally { setBusy(false); }
                }}
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
                {out ? 'ناموجود' : max === 0 ? 'حداکثر موجودی در سبد شماست' : busy ? 'در حال افزودن' : 'افزودن به سبد'}
              </Button>
            </div>

            {error && <p role="alert" className="mt-3 text-xs leading-6 text-destructive">{error}</p>}
            <div className="mt-5 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck className="size-3.5 text-gold" aria-hidden />
                ارسال سریع
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-gold" aria-hidden />
                تضمین تازگی
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
