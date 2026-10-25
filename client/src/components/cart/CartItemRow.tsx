import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatToman, formatNumber } from '@/lib/format';
import type { CartItem } from '@/lib/types';
import { ProductArt } from '@/components/catalog/ProductArt';
import { artFor } from '@/art/productArt';
import { useCart } from '@/context/CartContext';

export function CartItemRow({ item }: { item: CartItem }) {
  const { update, remove } = useCart();
  const max = Math.min(item.stock, 99);
  const line = item.price * item.quantity;

  return (
    <li className="flex gap-3 rounded-2xl border border-border/70 bg-card/60 p-3">
      <ProductArt
        svg={artFor(item.category) ?? ''}
        alt={item.name}
        className="size-[68px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-cream [&>svg]:h-full [&>svg]:w-full"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{item.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {item.weight} · {formatToman(item.price)} هر عدد
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="tap -me-1 -mt-1 size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => remove(item.item_id)}
            aria-label={`حذف ${item.name}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="tap size-9 rounded-full"
              disabled={item.quantity <= 1}
              onClick={() => update(item.item_id, item.quantity - 1)}
              aria-label="کاهش تعداد"
            >
              <Minus className="size-3.5" aria-hidden />
            </Button>
            <span className="min-w-6 text-center text-xs font-bold tabular-nums" aria-live="polite">
              {formatNumber(item.quantity)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="tap size-9 rounded-full"
              disabled={item.quantity >= max}
              onClick={() => update(item.item_id, item.quantity + 1)}
              aria-label="افزایش تعداد"
            >
              <Plus className="size-3.5" aria-hidden />
            </Button>
          </div>
          <span className="text-sm font-black tabular-nums">{formatToman(line)}</span>
        </div>
      </div>
    </li>
  );
}
