import { CheckCircle2, Truck } from 'lucide-react';
import {
  FREE_SHIPPING_THRESHOLD,
  cartTotals,
  formatToman,
  SHIPPING_COST,
} from '@/lib/format';
import type { Cart, PromoInfo } from '@/lib/types';

export function CartSummary({ cart, promo }: { cart: Cart; promo: PromoInfo | null }) {
  const { discount, shipping, total } = cartTotals(cart.subtotal, promo);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.subtotal);
  const progress = Math.min(100, Math.round((cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="space-y-4">
      {cart.subtotal > 0 &&
        (remaining > 0 ? (
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Truck className="size-3.5 text-gold" aria-hidden />
              <span>
                تا ارسال رایگان <strong className="font-bold text-foreground">{formatToman(remaining)}</strong> مانده
              </span>
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-border/70">
              <div
                className="h-full rounded-full bg-gradient-to-l from-gold to-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="پیشرفت ارسال رایگان"
              />
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden />
            ارسال رایگان فعال شد
          </p>
        ))}

      <dl className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-3 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">جمع کالاها</dt>
          <dd className="font-medium tabular-nums">{formatToman(cart.subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-medium text-primary">
            <dt>تخفیف</dt>
            <dd className="tabular-nums">−{formatToman(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">هزینه ارسال</dt>
          <dd className={shipping === 0 && cart.subtotal > 0 ? 'font-medium text-primary' : 'tabular-nums'}>
            {shipping === 0
              ? cart.subtotal > 0 ? 'رایگان' : formatToman(SHIPPING_COST)
              : formatToman(shipping)}
          </dd>
        </div>
      </dl>

      <div className="flex items-baseline justify-between border-t border-dashed border-border pt-3">
        <span className="text-sm font-semibold">مبلغ قابل پرداخت</span>
        <span className="font-display text-2xl leading-none font-bold text-primary tabular-nums" aria-live="polite">
          {formatToman(cart.totalItems > 0 ? total : 0)}
        </span>
      </div>
    </div>
  );
}
