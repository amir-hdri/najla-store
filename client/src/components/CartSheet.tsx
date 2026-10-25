import { ArrowLeft, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatNumber } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { PromoField } from '@/components/cart/PromoField';

export function CartSheet({ onCheckout }: { onCheckout?: () => void }) {
  const { cart, promo, open, setOpen, lastError, setLastError } = useCart();
  const empty = cart.items.length === 0;
  const checkout = () => {
    setOpen(false);
    onCheckout?.();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-0 border-e-0 bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/70 p-5 pe-12 text-start">
          <SheetTitle className="flex items-center gap-2 font-display text-2xl">
            <ShoppingBag className="size-5 text-primary" aria-hidden />
            سبد خرید
            {cart.totalItems > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {formatNumber(cart.totalItems)} کالا
              </span>
            ) : null}
          </SheetTitle>
          <SheetDescription className="text-xs leading-6">
            اقلام انتخابی شما؛ ارسال رایگان برای سفارش‌های بالای ۵۰۰٬۰۰۰ تومان.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {empty ? (
            <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-8 py-12 text-center">
              <span className="grid size-20 place-items-center overflow-hidden rounded-2xl border border-border/70 bg-white p-1.5 shadow-sm">
                <img
                  src="/images/brand/najla-art.jpg"
                  alt=""
                  className="size-full rounded-xl object-cover"
                  width={80}
                  height={80}
                />
              </span>
              <p className="font-display text-2xl">سبد خرید خالی است</p>
              <p className="max-w-56 text-sm leading-7 text-muted-foreground">
                هنوز چیزی انتخاب نکرده‌اید؛ سری به محصولات تازه بزنید.
              </p>
              <Button variant="outline" className="mt-2 rounded-full" asChild onClick={() => setOpen(false)}>
                <a href="#products">
                  <ArrowLeft className="ml-1 size-4" aria-hidden />
                  دیدن محصولات
                </a>
              </Button>
            </div>
          ) : (
            <>
              <ul className="space-y-2.5">
                {cart.items.map(item => (
                  <CartItemRow key={item.item_id} item={item} />
                ))}
              </ul>
              <div className="mt-4">
                <PromoField />
              </div>
              {lastError ? (
                <div
                  role="alert"
                  className="mt-3 flex items-start justify-between gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  <span>{lastError}</span>
                  <button
                    type="button"
                    onClick={() => setLastError(null)}
                    className="shrink-0 font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    بستن
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        {!empty && (
          <SheetFooter className="border-t border-border/70 bg-card/50 p-5">
            <div className="w-full space-y-4">
              <CartSummary cart={cart} promo={promo} />
              <Button
                className="h-11 w-full rounded-full shadow-lg shadow-primary/20 active:scale-[.99]"
                disabled={!onCheckout}
                onClick={checkout}
              >
                <ArrowLeft className="ml-1 size-4" aria-hidden />
                تکمیل خرید
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-gold" aria-hidden />
                پرداخت امن · بسته‌بندی محافظ
              </p>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
