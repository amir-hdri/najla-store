import { useState } from 'react';
import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PromoAPI } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useCart } from '@/context/CartContext';

export function PromoField() {
  const { promo, setPromo, cart } = useCart();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const { promo: p } = await PromoAPI.validate(trimmed, cart.subtotal);
      setPromo(p);
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'کد تخفیف معتبر نیست.');
    } finally {
      setBusy(false);
    }
  }

  if (promo) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10">
            <Check className="size-3.5 text-primary" aria-hidden />
          </span>
          <Badge variant="secondary" className="font-medium">{promo.code}</Badge>
          {promo.type === 'percent' && (
            <span className="truncate text-[11px] text-muted-foreground">
              ٪{formatNumber(promo.value)} تخفیف
            </span>
          )}
          {promo.freeShip && promo.type !== 'percent' && (
            <span className="truncate text-[11px] text-muted-foreground">ارسال رایگان</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => setPromo(null)}
          aria-label="حذف کد تخفیف"
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          placeholder="کد تخفیف دارید؟"
          aria-label="کد تخفیف"
          className="h-9 bg-background"
          value={code}
          onChange={e => { setCode(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') void apply(); }}
        />
        <Button
          variant="outline"
          className="h-9 shrink-0 px-4"
          disabled={busy || !code.trim()}
          onClick={() => void apply()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : 'اعمال'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
