import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber, formatToman } from '@/lib/format';
import type { Order } from '@/lib/types';

function toPersianDigits(value: string): string {
  return value
    .split('')
    .map(ch => (/\d/.test(ch) ? formatNumber(Number(ch)) : ch))
    .join('');
}

export function CheckoutSuccess({
  order,
  onClose,
}: {
  order: Order;
  onClose(): void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" dir="rtl">
      <span className="relative grid size-20 place-items-center rounded-full bg-primary/10">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/5 motion-reduce:animate-none" aria-hidden />
        <span className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Check className="size-7" aria-hidden />
        </span>
      </span>

      <p className="mt-1 text-[10px] font-medium tracking-[.2em] text-gold">سفارش شما ثبت شد</p>
      <h2 className="font-display text-3xl leading-tight">از خرید شما سپاسگزاریم</h2>
      <p className="max-w-72 text-sm leading-7 text-muted-foreground">
        سفارش شما با موفقیت ثبت شد؛ جزئیات و وضعیت ارسال را می‌توانید از بخش سفارش‌ها پیگیری کنید.
      </p>

      <div className="mt-1 w-full rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
        <p className="text-[10px] text-muted-foreground">شماره سفارش</p>
        <p className="mt-0.5 font-display text-xl font-bold tracking-wider" dir="ltr">
          {toPersianDigits(order.order_number)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          مبلغ پرداختی: <span className="font-semibold text-foreground">{formatToman(order.total)}</span>
        </p>
      </div>

      <p className="text-[11px] leading-6 text-muted-foreground">
        تأییدیه سفارش به <span dir="ltr" className="font-medium text-foreground">{order.customer_email}</span> ارسال می‌شود.
      </p>

      <Button className="mt-2 h-10 w-full rounded-full" onClick={onClose}>
        بازگشت به فروشگاه
      </Button>
    </div>
  );
}
