import { useState } from 'react';
import { Loader2, RotateCcw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber, formatToman } from '@/lib/format';
import { OrdersAPI } from '@/lib/api';
import type { Order } from '@/lib/types';
import { useCart } from '@/context/CartContext';

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'در انتظار بررسی',
  confirmed: 'تأیید شده',
  cancelled: 'لغو شده',
};

const PAYMENT_LABEL: Record<Order['payment_method'], string> = {
  card: 'درگاه بانکی',
  paypal: 'پی‌پال',
  cod: 'پرداخت در محل',
};

const PAYMENT_STATUS_LABEL: Record<Order['payment_status'], string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  refunded: 'مسترد شده',
  cancelled: 'لغو شده',
};

const METHOD_BADGE: Record<Order['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
};

export function OrderCard({
  order,
  onChanged,
  onReordered,
}: {
  order: Order;
  onChanged(next: Order): void;
  onReordered(): void;
}) {
  const { refresh: refreshCart, setOpen: setCartOpen } = useCart();
  const [busy, setBusy] = useState<'cancel' | 'reorder' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(order.created_at));
  const orderNo = order.order_number.split('').map(ch => (/\d/.test(ch) ? formatNumber(Number(ch)) : ch)).join('');
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  async function cancel() {
    if (!window.confirm('سفارش لغو شود؟')) return;
    setBusy('cancel'); setError(null);
    try {
      const { order: updated } = await OrdersAPI.cancel(order.id);
      onChanged({ ...updated, items: order.items });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطایی رخ داد.');
    } finally { setBusy(null); }
  }

  async function reorder() {
    setBusy('reorder'); setError(null);
    try {
      await OrdersAPI.reorder(order.id);
      await refreshCart();
      setCartOpen(true);
      onReordered();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطایی رخ داد.');
    } finally { setBusy(null); }
  }

  return (
    <li className="space-y-2.5 rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">سفارش {orderNo}</span>
          <Badge variant={METHOD_BADGE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">{date}</span>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>پرداخت: {PAYMENT_LABEL[order.payment_method]}</span>
        <span>وضعیت پرداخت: {PAYMENT_STATUS_LABEL[order.payment_status]}</span>
      </div>

      {order.items && order.items.length > 0 && (
        <ul className="space-y-0.5 text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>
                {it.name} × {formatNumber(it.quantity)}
              </span>
              <span className="text-muted-foreground">{formatToman(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border/70 pt-2.5 text-sm">
        <span className="font-black tabular-nums">{formatToman(order.total)}</span>
        <div className="flex gap-1.5">
          {canCancel && (
            <Button size="sm" variant="outline" className="rounded-full" disabled={busy != null} onClick={() => void cancel()}>
              {busy === 'cancel' ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <XCircle className="size-3.5" aria-hidden />}
              لغو سفارش
            </Button>
          )}
          <Button size="sm" variant="secondary" className="rounded-full" disabled={busy != null} onClick={() => void reorder()}>
            {busy === 'reorder' ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RotateCcw className="size-3.5" aria-hidden />}
            سفارش مجدد
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="text-destructive text-xs">{error}</p>}
    </li>
  );
}
