import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Globe2,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressesAPI, OrdersAPI } from '@/lib/api';
import { cartTotals, formatNumber, formatToman } from '@/lib/format';
import type { Order, OrderPayload } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { CheckoutSuccess } from './CheckoutSuccess';
import { cn } from 'cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9()\-\s]{6,20}$/;

type Step = 1 | 2 | 3;

interface AddressForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_state: string;
  customer_postal: string;
  customer_country: string;
}

const EMPTY_FORM: AddressForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  customer_city: '',
  customer_state: '',
  customer_postal: '',
  customer_country: 'ایران',
};

const PAYMENT_OPTIONS: {
  value: OrderPayload['payment_method'];
  label: string;
  note: string;
  icon: typeof CreditCard;
}[] = [
  { value: 'card', label: 'درگاه بانکی', note: 'پرداخت آنلاین و امن', icon: CreditCard },
  { value: 'paypal', label: 'پی‌پال', note: 'برای پرداخت بین‌المللی', icon: Globe2 },
  { value: 'cod', label: 'پرداخت در محل', note: 'نقدی هنگام تحویل سفارش', icon: Banknote },
];

const STEP_LABELS: Record<Step, string> = {
  1: 'نشانی',
  2: 'پرداخت',
  3: 'بررسی',
};

function validateAddress(f: AddressForm): string | null {
  if (!f.customer_name.trim()) return 'نام گیرنده لازم است.';
  if (!EMAIL_RE.test(f.customer_email)) return 'ایمیل معتبر نیست.';
  if (f.customer_phone && !PHONE_RE.test(f.customer_phone)) return 'شماره تماس معتبر نیست.';
  if (!f.customer_address.trim()) return 'نشانی لازم است.';
  if (!f.customer_city.trim()) return 'شهر لازم است.';
  if (!f.customer_country.trim()) return 'کشور لازم است.';
  return null;
}

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(v: boolean): void;
}) {
  const { user } = useAuth();
  const { cart, promo, setOpen: setCartOpen, clear, refresh } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [payment, setPayment] = useState<OrderPayload['payment_method']>('card');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<Order | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const totals = useMemo(() => cartTotals(cart.subtotal, promo), [cart.subtotal, promo]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setError(null);
      setBusy(false);
      setSuccess(null);
      setPrefilled(false);
      setPayment('card');
      return;
    }
    setForm(f => ({
      ...f,
      customer_name: user?.name || f.customer_name,
      customer_email: user?.email || f.customer_email,
      customer_phone: user?.phone || f.customer_phone,
    }));
    if (user && !prefilled) {
      setPrefilled(true);
      AddressesAPI.list()
        .then(r => {
          const d = r.addresses.find(a => a.is_default === 1) ?? r.addresses[0];
          if (!d) return;
          setForm(prev => ({
            customer_name: prev.customer_name || d.full_name,
            customer_email: prev.customer_email,
            customer_phone: prev.customer_phone || d.phone,
            customer_address: prev.customer_address || [d.line1, d.line2].filter(Boolean).join('، '),
            customer_city: prev.customer_city || d.city,
            customer_state: prev.customer_state || d.state || '',
            customer_postal: prev.customer_postal || d.postal_code || '',
            customer_country: prev.customer_country || d.country,
          }));
        })
        .catch(() => undefined);
    }
  }, [open, user, prefilled]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { order } = await OrdersAPI.create({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim() || undefined,
        customer_address: form.customer_address.trim(),
        customer_city: form.customer_city.trim(),
        customer_state: form.customer_state.trim() || undefined,
        customer_postal: form.customer_postal.trim() || undefined,
        customer_country: form.customer_country.trim(),
        payment_method: payment,
        promo_code: promo?.code,
      });
      setSuccess(order);
      await clear();
      void refresh();
      setCartOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطایی رخ داد.');
    } finally {
      setBusy(false);
    }
  }

  const set = (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setError(null);
  };

  if (success) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md" dir="rtl">
          <CheckoutSuccess order={success} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  const empty = cart.items.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl" dir="rtl">
        <DialogHeader className="border-b border-border/70 px-6 pb-4 pe-12 pt-5 text-start">
          <DialogTitle className="font-display text-2xl">تکمیل سفارش</DialogTitle>
          <DialogDescription>
            {empty ? 'سبد خرید خالی است.' : 'سفارش خود را در سه مرحله ثبت کنید.'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {empty ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag className="size-7" aria-hidden />
              </span>
              <p className="font-display text-2xl">سبد خرید خالی است</p>
              <p className="max-w-64 text-sm leading-7 text-muted-foreground">
                برای ثبت سفارش ابتدا چند محصول به سبد اضافه کنید.
              </p>
            </div>
          ) : (
            <>
              <ol className="mb-5 flex items-center gap-1.5" aria-label="مراحل ثبت سفارش">
                {([1, 2, 3] as Step[]).map((s, i) => (
                  <li
                    key={s}
                    className="flex flex-1 items-center gap-1.5 last:flex-none"
                    aria-label={`${STEP_LABELS[s]}${step > s ? ' (تکمیل‌شده)' : ''}`}
                  >
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors',
                        step === s && 'border-primary bg-primary text-primary-foreground',
                        step > s && 'border-primary/30 bg-primary/10 text-primary',
                        step < s && 'border-border bg-muted/50 text-muted-foreground',
                      )}
                      aria-current={step === s ? 'step' : undefined}
                    >
                      {step > s ? <Check className="size-4" aria-hidden /> : formatNumber(s)}
                    </span>
                    <span
                      className={cn(
                        'hidden text-xs whitespace-nowrap sm:block',
                        step === s ? 'font-semibold text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {STEP_LABELS[s]}
                    </span>
                    {i < 2 && (
                      <span
                        className={cn('h-px flex-1', step > s ? 'bg-primary/40' : 'bg-border')}
                        aria-hidden
                      />
                    )}
                  </li>
                ))}
              </ol>

              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg">نشانی گیرنده</h3>
                    <span className="text-[10px] text-muted-foreground">* فیلدهای الزامی</span>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="co-name">نام و نام خانوادگی *</Label>
                      <Input
                        id="co-name"
                        autoComplete="name"
                        value={form.customer_name}
                        onChange={set('customer_name')}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="co-email">ایمیل *</Label>
                        <Input
                          id="co-email"
                          type="email"
                          dir="ltr"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={form.customer_email}
                          onChange={set('customer_email')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="co-phone">تلفن همراه</Label>
                        <Input
                          id="co-phone"
                          dir="ltr"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="0912 000 0000"
                          value={form.customer_phone}
                          onChange={set('customer_phone')}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="co-address">نشانی کامل *</Label>
                      <Input
                        id="co-address"
                        autoComplete="street-address"
                        placeholder="خیابان، کوچه، پلاک و واحد"
                        value={form.customer_address}
                        onChange={set('customer_address')}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="co-city">شهر *</Label>
                        <Input
                          id="co-city"
                          autoComplete="address-level2"
                          value={form.customer_city}
                          onChange={set('customer_city')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="co-state">استان</Label>
                        <Input
                          id="co-state"
                          autoComplete="address-level1"
                          value={form.customer_state}
                          onChange={set('customer_state')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="co-postal">کد پستی</Label>
                        <Input
                          id="co-postal"
                          dir="ltr"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          value={form.customer_postal}
                          onChange={set('customer_postal')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="co-country">کشور *</Label>
                        <Input
                          id="co-country"
                          autoComplete="country-name"
                          value={form.customer_country}
                          onChange={set('customer_country')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg">روش پرداخت</h3>
                    <Wallet className="size-4 text-gold" aria-hidden />
                  </div>
                  <div className="grid gap-2" role="radiogroup" aria-label="روش پرداخت">
                    {PAYMENT_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const active = payment === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25',
                            active
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border/80 hover:border-primary/40 hover:bg-muted/40',
                          )}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={opt.value}
                            checked={active}
                            onChange={() => setPayment(opt.value)}
                            className="sr-only"
                          />
                          <span
                            className={cn(
                              'grid size-10 shrink-0 place-items-center rounded-lg transition-colors',
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground group-hover:text-primary',
                            )}
                          >
                            <Icon className="size-4.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{opt.label}</span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">{opt.note}</span>
                          </span>
                          <span
                            className={cn(
                              'grid size-4 shrink-0 place-items-center rounded-full border',
                              active ? 'border-primary' : 'border-border',
                            )}
                            aria-hidden
                          >
                            {active && <span className="size-2 rounded-full bg-primary" />}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="rounded-xl bg-muted/50 px-3 py-2 text-[11px] leading-6 text-muted-foreground">
                    پرداخت آنلاین در این نسخه نمایشی است؛ سفارش‌های کارتی بلافاصله پرداخت‌شده ثبت می‌شوند.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/70">
                    <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
                      <Package className="size-4 text-gold" aria-hidden />
                      <h3 className="text-xs font-semibold">اقلام سفارش</h3>
                      <Badge variant="secondary" className="ms-auto text-[10px]">
                        {formatNumber(cart.totalItems)} کالا
                      </Badge>
                    </div>
                    <ul className="divide-y divide-border/60 px-3">
                      {cart.items.map(item => (
                        <li key={item.item_id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                          <span className="min-w-0 truncate">
                            {item.name}
                            <span className="ms-1 text-muted-foreground">× {formatNumber(item.quantity)}</span>
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">
                            {formatToman(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                        <MapPin className="size-3.5 text-gold" aria-hidden />
                        نشانی
                      </p>
                      <p className="text-xs leading-6">
                        {form.customer_name}
                        <br />
                        {form.customer_city}، {form.customer_address}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                        <CreditCard className="size-3.5 text-gold" aria-hidden />
                        پرداخت
                      </p>
                      <p className="text-xs leading-6">
                        {PAYMENT_OPTIONS.find(o => o.value === payment)?.label}
                        <br />
                        <span dir="ltr" className="inline-block text-[10px] text-muted-foreground">
                          {form.customer_email}
                        </span>
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-2 rounded-xl border border-dashed border-border p-3 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">جمع کالاها</dt>
                      <dd className="tabular-nums">{formatToman(cart.subtotal)}</dd>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between font-medium text-primary">
                        <dt className="flex items-center gap-1.5">
                          تخفیف
                          {promo && <Badge variant="secondary" className="text-[9px]">{promo.code}</Badge>}
                        </dt>
                        <dd className="tabular-nums">−{formatToman(totals.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">هزینه ارسال</dt>
                      <dd className={totals.shipping === 0 ? 'font-medium text-primary' : 'tabular-nums'}>
                        {totals.shipping === 0 ? 'رایگان' : formatToman(totals.shipping)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2">
                      <dt className="text-sm font-bold">مبلغ قابل پرداخت</dt>
                      <dd className="font-display text-xl font-bold text-primary tabular-nums">
                        {formatToman(totals.total)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border/70 bg-card/60 px-6 py-4">
          {error && (
            <p role="alert" className="mb-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}
          <div className="flex justify-between gap-2">
            {!empty && step > 1 ? (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => { setStep(s => (s - 1) as Step); setError(null); }}
              >
                <ArrowRight className="ml-1 size-4" aria-hidden />
                قبلی
              </Button>
            ) : (
              <span />
            )}
            {empty ? (
              <Button className="tap h-11 rounded-full px-5" onClick={() => onOpenChange(false)}>
                بازگشت به فروشگاه
              </Button>
            ) : step < 3 ? (
              <Button
                className="tap h-11 rounded-full px-5"
                onClick={() => {
                  if (step === 1) {
                    const v = validateAddress(form);
                    if (v) { setError(v); return; }
                  }
                  setError(null);
                  setStep(s => (s + 1) as Step);
                }}
              >
                بعدی
                <ArrowLeft className="mr-1 size-4" aria-hidden />
              </Button>
            ) : (
              <Button className="tap h-11 rounded-full px-5" disabled={busy} onClick={() => void submit()}>
                {busy && <Loader2 className="ml-1 size-4 animate-spin" aria-hidden />}
                ثبت سفارش
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
